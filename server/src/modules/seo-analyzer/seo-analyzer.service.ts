import axios from "axios";
import * as cheerio from "cheerio";
import { SeoAudit } from "../../models/SeoAudit.model";
import { AppError } from "../../utils/AppError";
import { logger } from "../../utils/logger";
import type { SeoCheckResult, PageData } from "./seo-analyzer.types";
import type { RunAuditInput } from "./seo-analyzer.validation";
import {
  calculateCategoryScores,
  calculateOverallScore,
  scoreToGrade,
} from "./score-calculator";

// On-page checks
import {
  checkTitleTag,
  checkMetaDescription,
  checkHeadings,
  checkImageAlts,
  checkOpenGraph,
  checkCanonical,
} from "./checks/on-page.checks";

// Technical checks
import {
  checkRobotsMeta,
  checkHttps,
  checkMixedContent,
  checkHreflang,
  checkViewport,
  checkLangAttribute,
} from "./checks/technical.checks";

// Content checks
import {
  checkContentLength,
  checkInternalLinks,
  checkStructuredData,
} from "./checks/content.checks";

// Structured data checks
import {
  checkJsonLd,
  checkMicrodata,
  checkSocialMeta,
} from "./checks/structured-data.checks";

const MAX_CONTENT_SIZE = 5 * 1024 * 1024; // 5MB limit

/**
 * Fetch a URL and return the HTML content with metadata.
 * Implements size limits and timeout protection.
 */
async function fetchPage(url: string): Promise<{ html: string; pageData: PageData }> {
  const startTime = Date.now();

  try {
    const response = await axios.get(url, {
      timeout: 30_000,
      maxContentLength: MAX_CONTENT_SIZE,
      maxRedirects: 5,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SEORankTracker/1.0; +https://seo-rank-tracker.com/bot)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      validateStatus: (status) => status < 500,
    });

    const loadTimeMs = Date.now() - startTime;
    const html = typeof response.data === "string" ? response.data : String(response.data);
    const finalUrl = response.request?.res?.responseUrl || url;

    const $ = cheerio.load(html);

    const pageData: PageData = {
      url,
      finalUrl,
      statusCode: response.status,
      contentLength: html.length,
      loadTimeMs,
      isHttps: finalUrl.startsWith("https://"),
      title: $("title").first().text().trim() || undefined,
      description:
        $('meta[name="description"]').attr("content")?.trim() || undefined,
      h1: $("h1").first().text().trim() || undefined,
    };

    return { html, pageData };
  } catch (error: any) {
    if (error.code === "ECONNABORTED") {
      throw new AppError(`Timeout: ${url} took longer than 30 seconds to respond.`, 408);
    }
    if (error.code === "ENOTFOUND") {
      throw new AppError(`Domain not found: ${url}`, 400);
    }
    throw new AppError(`Failed to fetch ${url}: ${error.message}`, 502);
  }
}

/**
 * Run all SEO checks against the fetched HTML.
 * Returns an array of check results.
 */
function runAllChecks($: cheerio.CheerioAPI, url: string): SeoCheckResult[] {
  const checks: SeoCheckResult[] = [];

  // On-page checks
  checks.push(checkTitleTag($));
  checks.push(checkMetaDescription($));
  checks.push(checkHeadings($));
  checks.push(checkImageAlts($));
  checks.push(checkOpenGraph($));
  checks.push(checkCanonical($, url));

  // Technical checks
  checks.push(checkRobotsMeta($));
  checks.push(checkHttps(url));
  checks.push(checkMixedContent($, url));
  checks.push(checkHreflang($));
  checks.push(checkViewport($));
  checks.push(checkLangAttribute($));

  // Content checks
  checks.push(checkContentLength($));
  checks.push(checkInternalLinks($, url));
  checks.push(checkStructuredData($));

  // Structured data checks
  checks.push(checkJsonLd($));
  checks.push(checkMicrodata($));
  checks.push(checkSocialMeta($));

  return checks;
}

/**
 * Run a full SEO audit on a URL.
 * Fetches the page, runs all checks, calculates scores, and stores the result.
 */
export async function runAudit(userId: string, input: RunAuditInput) {
  // Create the audit record in "running" state
  const audit = await SeoAudit.create({
    userId,
    websiteId: input.websiteId || undefined,
    url: input.url,
    status: "running",
  });

  try {
    // 1. Fetch the page
    const { html, pageData } = await fetchPage(input.url);
    const $ = cheerio.load(html);

    // 2. Run all SEO checks
    const checks = runAllChecks($, pageData.finalUrl);

    // 3. Calculate scores
    const categoryScores = calculateCategoryScores(checks);
    const overallScore = calculateOverallScore(categoryScores);
    const grade = scoreToGrade(overallScore);

    // 4. Update audit with results
    audit.checks = checks;
    audit.categoryScores = categoryScores;
    audit.overallScore = overallScore;
    audit.grade = grade;
    audit.pageData = pageData;
    audit.status = "completed";
    await audit.save();

    logger.info(`Audit completed for ${input.url} — Score: ${overallScore} (${grade})`);

    return audit;
  } catch (error: any) {
    // Mark audit as failed
    audit.status = "failed";
    audit.errorMessage = error.message;
    await audit.save();

    throw error;
  }
}

/**
 * Get a specific audit by ID. Verifies user ownership.
 */
export async function getAuditById(auditId: string, userId: string) {
  const audit = await SeoAudit.findById(auditId);

  if (!audit) {
    throw new AppError("Audit not found.", 404);
  }

  if (audit.userId.toString() !== userId) {
    throw new AppError("You do not have access to this audit.", 403);
  }

  return audit;
}

/**
 * Get audit history for the current user with pagination.
 */
export async function getAuditHistory(
  userId: string,
  options: { url?: string; websiteId?: string; page: number; limit: number }
) {
  const filter: Record<string, unknown> = { userId };

  if (options.url) {
    filter.url = options.url;
  }
  if (options.websiteId) {
    filter.websiteId = options.websiteId;
  }

  const [audits, total] = await Promise.all([
    SeoAudit.find(filter)
      .select("-checks -categoryScores") // Exclude heavy fields in list view
      .sort({ createdAt: -1 })
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .lean(),
    SeoAudit.countDocuments(filter),
  ]);

  return { audits, total, page: options.page, limit: options.limit };
}
