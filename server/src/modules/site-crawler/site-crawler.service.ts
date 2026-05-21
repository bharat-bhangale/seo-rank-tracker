import { Website } from "../../models/Website.model";
import { CrawlResult, type ICrawlResult } from "../../models/CrawlResult.model";
import { User } from "../../models/User.model";
import { AppError } from "../../utils/AppError";
import { enqueueSiteCrawl } from "../../jobs/queues";
import type { StartCrawlInput, GetCrawlPagesInput } from "./site-crawler.validation";

/**
 * Start a new site crawl for a website.
 * Creates a crawl job record and enqueues it for background processing.
 */
export const startCrawl = async (
  userId: string,
  input: StartCrawlInput
): Promise<ICrawlResult> => {
  const website = await Website.findOne({
    _id: input.websiteId,
    userId,
  });

  if (!website) {
    throw new AppError("Website not found or you don't have access.", 404);
  }

  // Check subscription limits
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found.", 404);

  const maxPages = Math.min(
    input.maxPages,
    user.subscription.crawlPageLimit
  );

  // Check for active crawls on same website
  const activeCrawl = await CrawlResult.findOne({
    websiteId: website._id,
    status: { $in: ["pending", "crawling"] },
  });

  if (activeCrawl) {
    throw new AppError(
      "A crawl is already in progress for this website. Please wait for it to complete.",
      409
    );
  }

  const crawl = await CrawlResult.create({
    userId,
    websiteId: website._id,
    domain: website.domain,
    config: {
      maxDepth: input.maxDepth,
      maxPages: maxPages,
      respectRobotsTxt: input.respectRobotsTxt,
      includeSubdomains: input.includeSubdomains,
    },
  });

  // Enqueue crawl job for background processing
  await enqueueSiteCrawl({
    crawlId: crawl.id,
    userId,
    domain: website.domain,
  });

  return crawl;
};

/**
 * Get a specific crawl result by ID.
 */
export const getCrawlById = async (
  crawlId: string,
  userId: string
): Promise<ICrawlResult> => {
  const crawl = await CrawlResult.findOne({
    _id: crawlId,
    userId,
  }).select("-pages"); // Exclude pages array for summary view

  if (!crawl) {
    throw new AppError("Crawl result not found.", 404);
  }

  return crawl;
};

/**
 * Get crawl history for a user, optionally filtered by website.
 */
export const getCrawlHistory = async (
  userId: string,
  query: { websiteId?: string; page?: number; limit?: number }
): Promise<{
  crawls: ICrawlResult[];
  total: number;
  page: number;
  limit: number;
}> => {
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = { userId };
  if (query.websiteId) filter.websiteId = query.websiteId;

  const [crawls, total] = await Promise.all([
    CrawlResult.find(filter)
      .select("-pages")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    CrawlResult.countDocuments(filter),
  ]);

  return { crawls: crawls as unknown as ICrawlResult[], total, page, limit };
};

/**
 * Get paginated crawled pages for a specific crawl.
 * Uses MongoDB's $slice for pagination on the embedded pages array.
 */
export const getCrawlPages = async (
  crawlId: string,
  userId: string,
  query: GetCrawlPagesInput
): Promise<{
  pages: any[];
  total: number;
  page: number;
  limit: number;
}> => {
  const page = query.page || 1;
  const limit = query.limit || 50;
  const skip = (page - 1) * limit;

  const crawl = await CrawlResult.findOne({
    _id: crawlId,
    userId,
  });

  if (!crawl) {
    throw new AppError("Crawl result not found.", 404);
  }

  let filteredPages = crawl.pages || [];

  // Apply filters
  if (query.statusCode) {
    filteredPages = filteredPages.filter(
      (p) => p.statusCode === query.statusCode
    );
  }
  if (query.hasIssues) {
    filteredPages = filteredPages.filter(
      (p) => p.issues && p.issues.length > 0
    );
  }

  const total = filteredPages.length;
  const paginatedPages = filteredPages.slice(skip, skip + limit);

  return { pages: paginatedPages, total, page, limit };
};
