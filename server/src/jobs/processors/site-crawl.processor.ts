import type { Job } from "bullmq";
import axios from "axios";
import * as cheerio from "cheerio";
import type { SiteCrawlJobData } from "../queues";
import { CrawlResult } from "../../models/CrawlResult.model";
import { createNotification } from "../../modules/notifications/notifications.service";
import { logger } from "../../utils/logger";

const USER_AGENT =
  "Mozilla/5.0 (compatible; SEORankTracker/1.0; +https://seo-rank-tracker.com/bot)";

interface CrawledPageData {
  url: string;
  statusCode: number;
  title?: string;
  description?: string;
  h1?: string;
  contentLength: number;
  loadTimeMs: number;
  internalLinks: string[];
  externalLinksCount: number;
  brokenLinks: string[];
  redirectTarget?: string;
  issues: Array<{ type: string; severity: "critical" | "warning" | "info"; message: string }>;
  depth: number;
}

/**
 * Background processor for site crawling jobs.
 * Performs BFS crawl from the root URL, auditing each page.
 */
export const processSiteCrawl = async (
  job: Job<SiteCrawlJobData>
): Promise<{ crawlId: string }> => {
  const { crawlId, domain } = job.data;

  logger.info(`Starting site crawl: ${domain} (job ${crawlId})`);

  const crawl = await CrawlResult.findById(crawlId);
  if (!crawl) throw new Error(`Crawl ${crawlId} not found`);

  crawl.status = "crawling";
  crawl.startedAt = new Date();
  await crawl.save();

  const { maxDepth, maxPages, respectRobotsTxt } = crawl.config;
  const rootUrl = domain.startsWith("http") ? domain : `https://${domain}`;
  const rootOrigin = new URL(rootUrl).origin;

  // Track visited URLs to avoid duplicates
  const visited = new Set<string>();
  const queue: Array<{ url: string; depth: number }> = [{ url: rootUrl, depth: 0 }];
  const crawledPages: CrawledPageData[] = [];

  // Optionally fetch robots.txt
  let disallowedPaths: string[] = [];
  if (respectRobotsTxt) {
    try {
      const robotsRes = await axios.get(`${rootOrigin}/robots.txt`, {
        timeout: 10_000,
        validateStatus: () => true,
      });
      if (robotsRes.status === 200 && typeof robotsRes.data === "string") {
        crawl.robotsTxt = robotsRes.data;
        disallowedPaths = parseDisallowedPaths(robotsRes.data);
      }
    } catch {
      // robots.txt not available — continue crawling
    }
  }

  // BFS Crawl Loop
  while (queue.length > 0 && crawledPages.length < maxPages) {
    const { url, depth } = queue.shift()!;

    const normalizedUrl = normalizeUrl(url);
    if (visited.has(normalizedUrl)) continue;
    if (depth > maxDepth) continue;
    if (respectRobotsTxt && isDisallowed(normalizedUrl, disallowedPaths, rootOrigin)) continue;

    visited.add(normalizedUrl);

    try {
      const pageData = await crawlSinglePage(normalizedUrl, depth, rootOrigin);
      crawledPages.push(pageData);

      // Add discovered internal links to queue
      if (depth < maxDepth) {
        for (const link of pageData.internalLinks) {
          const normalizedLink = normalizeUrl(link);
          if (!visited.has(normalizedLink)) {
            queue.push({ url: normalizedLink, depth: depth + 1 });
          }
        }
      }

      // Update progress
      crawl.progress = {
        crawledPages: crawledPages.length,
        totalDiscovered: visited.size + queue.length,
        percentComplete: Math.min(
          Math.round((crawledPages.length / maxPages) * 100),
          99
        ),
      };
      await crawl.save();
      await job.updateProgress(crawl.progress.percentComplete);

      // Polite crawling delay (500ms between requests)
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error: any) {
      logger.warn(`Failed to crawl ${normalizedUrl}: ${error.message}`);
    }
  }

  // Post-crawl aggregation
  const summary = generateCrawlSummary(crawledPages);

  crawl.pages = crawledPages.map((p) => ({
    url: p.url,
    statusCode: p.statusCode,
    title: p.title,
    description: p.description,
    h1: p.h1,
    contentLength: p.contentLength,
    loadTimeMs: p.loadTimeMs,
    internalLinksCount: p.internalLinks.length,
    externalLinksCount: p.externalLinksCount,
    brokenLinks: p.brokenLinks,
    redirectTarget: p.redirectTarget,
    issues: p.issues,
    depth: p.depth,
  }));
  crawl.summary = summary;
  crawl.status = "completed";
  crawl.completedAt = new Date();
  crawl.progress.percentComplete = 100;
  await crawl.save();

  await job.updateProgress(100);

  // Notify user
  await createNotification(job.data.userId, {
    type: "audit_complete",
    title: "Site Crawl Complete",
    message: `Crawled ${crawledPages.length} pages on ${domain}. Health score: ${summary.healthScore}/100`,
    link: `/crawler`,
    metadata: { crawlId: crawl.id },
  });

  logger.info(`Site crawl completed: ${domain}, ${crawledPages.length} pages`);
  return { crawlId: crawl.id };
};

/**
 * Crawl a single page and extract SEO-relevant data.
 */
async function crawlSinglePage(
  url: string,
  depth: number,
  rootOrigin: string
): Promise<CrawledPageData> {
  const startTime = Date.now();
  const issues: CrawledPageData["issues"] = [];

  const response = await axios.get(url, {
    timeout: 15_000,
    maxContentLength: 5 * 1024 * 1024,
    maxRedirects: 5,
    headers: { "User-Agent": USER_AGENT },
    validateStatus: () => true,
  });

  const loadTimeMs = Date.now() - startTime;
  const html = typeof response.data === "string" ? response.data : String(response.data);
  const $ = cheerio.load(html);
  const statusCode = response.status;

  // Check for issues
  if (statusCode >= 400) {
    issues.push({ type: "http_error", severity: "critical", message: `HTTP ${statusCode}` });
  }
  if (statusCode >= 300 && statusCode < 400) {
    issues.push({
      type: "redirect",
      severity: "warning",
      message: `Redirects to ${response.headers.location || "unknown"}`,
    });
  }

  const title = $("title").first().text().trim() || undefined;
  const description = $('meta[name="description"]').attr("content")?.trim() || undefined;
  const h1 = $("h1").first().text().trim() || undefined;

  if (!title) issues.push({ type: "missing_title", severity: "warning", message: "Missing title tag" });
  if (!description)
    issues.push({ type: "missing_description", severity: "warning", message: "Missing meta description" });
  if (!h1) issues.push({ type: "missing_h1", severity: "info", message: "Missing H1 tag" });

  // Extract links
  const internalLinks: string[] = [];
  const brokenLinks: string[] = [];
  let externalLinksCount = 0;

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    try {
      const resolved = new URL(href, url);
      if (resolved.origin === rootOrigin) {
        internalLinks.push(resolved.href.split("#")[0].split("?")[0]); // Remove fragments/params
      } else {
        externalLinksCount++;
      }
    } catch {
      // Invalid URL
    }
  });

  // Check images for alt text
  const imagesWithoutAlt = $("img:not([alt]), img[alt='']").length;
  if (imagesWithoutAlt > 0) {
    issues.push({
      type: "missing_alt",
      severity: "warning",
      message: `${imagesWithoutAlt} image(s) missing alt text`,
    });
  }

  return {
    url,
    statusCode,
    title,
    description,
    h1,
    contentLength: html.length,
    loadTimeMs,
    internalLinks: [...new Set(internalLinks)],
    externalLinksCount,
    brokenLinks,
    redirectTarget: statusCode >= 300 && statusCode < 400 ? response.headers.location : undefined,
    issues,
    depth,
  };
}

interface CrawlSummary {
  totalPages: number;
  brokenLinksCount: number;
  redirectChainsCount: number;
  orphanPagesCount: number;
  duplicateTitlesCount: number;
  duplicateDescriptionsCount: number;
  missingTitles: number;
  missingDescriptions: number;
  missingH1: number;
  averageLoadTimeMs: number;
  healthScore: number;
}

/**
 * Generate site-wide summary from crawled pages.
 */
function generateCrawlSummary(
  pages: CrawledPageData[]
): CrawlSummary {
  const totalPages = pages.length;
  const brokenLinks = pages.reduce((sum, p) => sum + p.brokenLinks.length, 0);
  const missingTitles = pages.filter((p) => !p.title).length;
  const missingDescriptions = pages.filter((p) => !p.description).length;
  const missingH1 = pages.filter((p) => !p.h1).length;
  const averageLoadTimeMs =
    totalPages > 0
      ? Math.round(pages.reduce((sum, p) => sum + p.loadTimeMs, 0) / totalPages)
      : 0;

  // Detect duplicate titles
  const titles = pages.map((p) => p.title).filter(Boolean) as string[];
  const titleCounts = new Map<string, number>();
  titles.forEach((t) => titleCounts.set(t, (titleCounts.get(t) || 0) + 1));
  const duplicateTitlesCount = [...titleCounts.values()].filter((c) => c > 1).length;

  // Detect duplicate descriptions
  const descriptions = pages.map((p) => p.description).filter(Boolean) as string[];
  const descCounts = new Map<string, number>();
  descriptions.forEach((d) => descCounts.set(d, (descCounts.get(d) || 0) + 1));
  const duplicateDescriptionsCount = [...descCounts.values()].filter((c) => c > 1).length;

  // Orphan pages (pages not linked to by any other crawled page)
  const allInternalLinks = new Set(pages.flatMap((p) => p.internalLinks));
  const orphanPagesCount = pages.filter(
    (p) => p.depth > 0 && !allInternalLinks.has(p.url)
  ).length;

  // Redirect chains (pages that redirect)
  const redirectChainsCount = pages.filter((p) => p.redirectTarget).length;

  // Calculate health score (0-100)
  const issueCount = pages.reduce((sum, p) => sum + p.issues.length, 0);
  const criticalCount = pages.reduce(
    (sum, p) => sum + p.issues.filter((i) => i.severity === "critical").length,
    0
  );
  const healthScore = Math.max(
    0,
    Math.round(100 - criticalCount * 15 - (issueCount - criticalCount) * 3)
  );

  return {
    totalPages,
    brokenLinksCount: brokenLinks,
    redirectChainsCount,
    orphanPagesCount,
    duplicateTitlesCount,
    duplicateDescriptionsCount,
    missingTitles,
    missingDescriptions,
    missingH1,
    averageLoadTimeMs,
    healthScore,
  };
}

/**
 * Parse disallowed paths from robots.txt content.
 */
function parseDisallowedPaths(robotsTxt: string): string[] {
  const paths: string[] = [];
  let isUserAgentAll = false;

  for (const line of robotsTxt.split("\n")) {
    const trimmed = line.trim().toLowerCase();
    if (trimmed.startsWith("user-agent:")) {
      isUserAgentAll = trimmed.includes("*");
    }
    if (isUserAgentAll && trimmed.startsWith("disallow:")) {
      const path = trimmed.replace("disallow:", "").trim();
      if (path) paths.push(path);
    }
  }

  return paths;
}

/**
 * Check if a URL is disallowed by robots.txt.
 */
function isDisallowed(url: string, disallowedPaths: string[], rootOrigin: string): boolean {
  const pathname = url.replace(rootOrigin, "");
  return disallowedPaths.some((p) => pathname.startsWith(p));
}

/**
 * Normalize URL: remove fragments, trailing slashes, lowercase.
 */
function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    let normalized = u.href;
    if (normalized.endsWith("/") && u.pathname !== "/") {
      normalized = normalized.slice(0, -1);
    }
    return normalized.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}
