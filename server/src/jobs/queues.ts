import { Queue, type JobsOptions } from "bullmq";
import { getRedisConnection } from "./connection";
import type { SerpLocation } from "../services/serp/serp.types";
import { logger } from "../utils/logger";

export const QUEUE_NAMES = {
  rankChecks: "rank-checks",
  seoAudits: "seo-audits",
  siteCrawls: "site-crawls",
  aiReports: "ai-reports",
  backlinkSync: "backlink-sync",
  notifications: "notifications",
  gscSync: "gsc-sync",
} as const;

export interface RankCheckJobData {
  keywordId: string;
  reason: "scheduled" | "manual" | "geo_grid";
  location?: SerpLocation;
}

export interface GscSyncJobData {
  propertyId: string;
  startDate?: string;
  endDate?: string;
}

export interface BacklinkSyncJobData {
  userId: string;
  websiteId?: string;
  domain: string;
}

export interface SeoAuditJobData {
  userId: string;
  url: string;
  websiteId?: string;
}

export interface SiteCrawlJobData {
  crawlId: string;
  userId: string;
  domain: string;
}

export interface AiReportJobData {
  reportId: string;
  userId: string;
}

export interface NotificationJobData {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

const defaultJobOptions: JobsOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 30_000,
  },
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 500 },
};

// ── Phase 8: Queue Singletons (require Redis) ───────────
// When Redis is not available, queue getters return undefined
// and enqueue functions become safe no-ops with a warning log.

let rankChecksQueue: Queue<RankCheckJobData> | undefined;
let gscSyncQueue: Queue<GscSyncJobData> | undefined;
let backlinkSyncQueue: Queue<BacklinkSyncJobData> | undefined;
let seoAuditsQueue: Queue<SeoAuditJobData> | undefined;
let siteCrawlsQueue: Queue<SiteCrawlJobData> | undefined;
let aiReportsQueue: Queue<AiReportJobData> | undefined;

/** Try to create a BullMQ queue; return undefined if Redis is unavailable */
function tryCreateQueue<T>(name: string, opts?: JobsOptions): Queue<T> | undefined {
  try {
    return new Queue<T>(name, {
      connection: getRedisConnection(),
      defaultJobOptions: opts ?? defaultJobOptions,
    });
  } catch (err) {
    logger.warn(`Queue "${name}" unavailable (Redis not connected). Job enqueueing disabled.`);
    return undefined;
  }
}

// ── Queue Getters ───────────────────────────────────────

export const getRankChecksQueue = (): Queue<RankCheckJobData> | undefined => {
  if (!rankChecksQueue) rankChecksQueue = tryCreateQueue<RankCheckJobData>(QUEUE_NAMES.rankChecks);
  return rankChecksQueue;
};

export const getGscSyncQueue = (): Queue<GscSyncJobData> | undefined => {
  if (!gscSyncQueue) gscSyncQueue = tryCreateQueue<GscSyncJobData>(QUEUE_NAMES.gscSync);
  return gscSyncQueue;
};

export const getBacklinkSyncQueue = (): Queue<BacklinkSyncJobData> | undefined => {
  if (!backlinkSyncQueue) backlinkSyncQueue = tryCreateQueue<BacklinkSyncJobData>(QUEUE_NAMES.backlinkSync);
  return backlinkSyncQueue;
};

export const getSeoAuditsQueue = (): Queue<SeoAuditJobData> | undefined => {
  if (!seoAuditsQueue) seoAuditsQueue = tryCreateQueue<SeoAuditJobData>(QUEUE_NAMES.seoAudits);
  return seoAuditsQueue;
};

export const getSiteCrawlsQueue = (): Queue<SiteCrawlJobData> | undefined => {
  if (!siteCrawlsQueue) siteCrawlsQueue = tryCreateQueue<SiteCrawlJobData>(QUEUE_NAMES.siteCrawls, {
    ...defaultJobOptions,
    attempts: 1, // Crawls are long-running; don't retry
  });
  return siteCrawlsQueue;
};

export const getAiReportsQueue = (): Queue<AiReportJobData> | undefined => {
  if (!aiReportsQueue) aiReportsQueue = tryCreateQueue<AiReportJobData>(QUEUE_NAMES.aiReports);
  return aiReportsQueue;
};

// ── Enqueue Functions (safe no-ops without Redis) ───────

export const enqueueRankCheck = async (
  data: RankCheckJobData,
  opts: JobsOptions = {}
) => {
  const queue = getRankChecksQueue();
  if (!queue) { logger.warn("Skipped enqueue: rank-check (Redis unavailable)"); return undefined; }
  return queue.add("check-keyword-rank", data, {
    priority: data.reason === "manual" ? 1 : 5,
    ...opts,
  });
};

export const scheduleKeywordRankCheck = async (
  keywordId: string,
  cron: string
) => {
  const queue = getRankChecksQueue();
  if (!queue) { logger.warn("Skipped schedule: rank-check (Redis unavailable)"); return undefined; }
  return queue.upsertJobScheduler(
    `keyword:${keywordId}:daily-rank-check`,
    { pattern: cron },
    {
      name: "check-keyword-rank",
      data: { keywordId, reason: "scheduled" },
      opts: {
        attempts: 3,
        backoff: { type: "exponential", delay: 30_000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 500 },
      },
    }
  );
};

export const removeKeywordRankScheduler = async (
  keywordId: string
): Promise<boolean> => {
  const queue = getRankChecksQueue();
  if (!queue) return false;
  return queue.removeJobScheduler(`keyword:${keywordId}:daily-rank-check`);
};

export const enqueueGscSync = async (
  data: GscSyncJobData,
  opts: JobsOptions = {}
) => {
  const queue = getGscSyncQueue();
  if (!queue) { logger.warn("Skipped enqueue: gsc-sync (Redis unavailable)"); return undefined; }
  return queue.add("sync-gsc-property", data, {
    priority: 3,
    ...opts,
  });
};

export const scheduleGscPropertySync = async (
  propertyId: string,
  cron = "0 4 * * *"
) => {
  const queue = getGscSyncQueue();
  if (!queue) { logger.warn("Skipped schedule: gsc-sync (Redis unavailable)"); return undefined; }
  return queue.upsertJobScheduler(
    `gsc:${propertyId}:daily-sync`,
    { pattern: cron },
    {
      name: "sync-gsc-property",
      data: { propertyId },
      opts: {
        attempts: 3,
        backoff: { type: "exponential", delay: 60_000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 500 },
      },
    }
  );
};

export const removeGscPropertyScheduler = async (
  propertyId: string
): Promise<boolean> => {
  const queue = getGscSyncQueue();
  if (!queue) return false;
  return queue.removeJobScheduler(`gsc:${propertyId}:daily-sync`);
};

export const enqueueBacklinkSync = async (
  data: BacklinkSyncJobData,
  opts: JobsOptions = {}
) => {
  const queue = getBacklinkSyncQueue();
  if (!queue) { logger.warn("Skipped enqueue: backlink-sync (Redis unavailable)"); return undefined; }
  return queue.add("sync-backlinks", data, {
    priority: 3,
    ...opts,
  });
};

export const enqueueSeoAudit = async (
  data: SeoAuditJobData,
  opts: JobsOptions = {}
) => {
  const queue = getSeoAuditsQueue();
  if (!queue) { logger.warn("Skipped enqueue: seo-audit (Redis unavailable)"); return undefined; }
  return queue.add("run-seo-audit", data, {
    priority: data.websiteId ? 3 : 1,
    ...opts,
  });
};

export const enqueueSiteCrawl = async (
  data: SiteCrawlJobData,
  opts: JobsOptions = {}
) => {
  const queue = getSiteCrawlsQueue();
  if (!queue) { logger.warn("Skipped enqueue: site-crawl (Redis unavailable)"); return undefined; }
  return queue.add("crawl-site", data, {
    priority: 5,
    ...opts,
  });
};

export const enqueueAiReport = async (
  data: AiReportJobData,
  opts: JobsOptions = {}
) => {
  const queue = getAiReportsQueue();
  if (!queue) { logger.warn("Skipped enqueue: ai-report (Redis unavailable)"); return undefined; }
  return queue.add("generate-ai-report", data, {
    priority: 3,
    ...opts,
  });
};

// ── Cleanup ─────────────────────────────────────────────

export const closeQueues = async (): Promise<void> => {
  await Promise.all([
    rankChecksQueue?.close(),
    gscSyncQueue?.close(),
    backlinkSyncQueue?.close(),
    seoAuditsQueue?.close(),
    siteCrawlsQueue?.close(),
    aiReportsQueue?.close(),
  ]);
  rankChecksQueue = undefined;
  gscSyncQueue = undefined;
  backlinkSyncQueue = undefined;
  seoAuditsQueue = undefined;
  siteCrawlsQueue = undefined;
  aiReportsQueue = undefined;
};
