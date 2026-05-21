import { Queue, type JobsOptions } from "bullmq";
import { getRedisConnection } from "./connection";
import type { SerpLocation } from "../services/serp/serp.types";

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

// ── Queue Singletons ────────────────────────────────────

let rankChecksQueue: Queue<RankCheckJobData> | undefined;
let gscSyncQueue: Queue<GscSyncJobData> | undefined;
let backlinkSyncQueue: Queue<BacklinkSyncJobData> | undefined;
let seoAuditsQueue: Queue<SeoAuditJobData> | undefined;
let siteCrawlsQueue: Queue<SiteCrawlJobData> | undefined;
let aiReportsQueue: Queue<AiReportJobData> | undefined;

// ── Queue Getters ───────────────────────────────────────

export const getRankChecksQueue = (): Queue<RankCheckJobData> => {
  if (!rankChecksQueue) {
    rankChecksQueue = new Queue<RankCheckJobData>(QUEUE_NAMES.rankChecks, {
    connection: getRedisConnection(),
    defaultJobOptions,
    });
  }

  return rankChecksQueue;
};

export const getGscSyncQueue = (): Queue<GscSyncJobData> => {
  if (!gscSyncQueue) {
    gscSyncQueue = new Queue<GscSyncJobData>(QUEUE_NAMES.gscSync, {
      connection: getRedisConnection(),
      defaultJobOptions,
    });
  }

  return gscSyncQueue;
};

export const getBacklinkSyncQueue = (): Queue<BacklinkSyncJobData> => {
  if (!backlinkSyncQueue) {
    backlinkSyncQueue = new Queue<BacklinkSyncJobData>(QUEUE_NAMES.backlinkSync, {
      connection: getRedisConnection(),
      defaultJobOptions,
    });
  }

  return backlinkSyncQueue;
};

export const getSeoAuditsQueue = (): Queue<SeoAuditJobData> => {
  if (!seoAuditsQueue) {
    seoAuditsQueue = new Queue<SeoAuditJobData>(QUEUE_NAMES.seoAudits, {
      connection: getRedisConnection(),
      defaultJobOptions,
    });
  }
  return seoAuditsQueue;
};

export const getSiteCrawlsQueue = (): Queue<SiteCrawlJobData> => {
  if (!siteCrawlsQueue) {
    siteCrawlsQueue = new Queue<SiteCrawlJobData>(QUEUE_NAMES.siteCrawls, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        ...defaultJobOptions,
        attempts: 1, // Crawls are long-running; don't retry
      },
    });
  }
  return siteCrawlsQueue;
};

export const getAiReportsQueue = (): Queue<AiReportJobData> => {
  if (!aiReportsQueue) {
    aiReportsQueue = new Queue<AiReportJobData>(QUEUE_NAMES.aiReports, {
      connection: getRedisConnection(),
      defaultJobOptions,
    });
  }
  return aiReportsQueue;
};

// ── Enqueue Functions ───────────────────────────────────

export const enqueueRankCheck = async (
  data: RankCheckJobData,
  opts: JobsOptions = {}
) => {
  return getRankChecksQueue().add("check-keyword-rank", data, {
    priority: data.reason === "manual" ? 1 : 5,
    ...opts,
  });
};

export const scheduleKeywordRankCheck = async (
  keywordId: string,
  cron: string
) => {
  return getRankChecksQueue().upsertJobScheduler(
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
  return getRankChecksQueue().removeJobScheduler(`keyword:${keywordId}:daily-rank-check`);
};

export const enqueueGscSync = async (
  data: GscSyncJobData,
  opts: JobsOptions = {}
) => {
  return getGscSyncQueue().add("sync-gsc-property", data, {
    priority: 3,
    ...opts,
  });
};

export const scheduleGscPropertySync = async (
  propertyId: string,
  cron = "0 4 * * *"
) => {
  return getGscSyncQueue().upsertJobScheduler(
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
  return getGscSyncQueue().removeJobScheduler(`gsc:${propertyId}:daily-sync`);
};

export const enqueueBacklinkSync = async (
  data: BacklinkSyncJobData,
  opts: JobsOptions = {}
) => {
  return getBacklinkSyncQueue().add("sync-backlinks", data, {
    priority: 3,
    ...opts,
  });
};

export const enqueueSeoAudit = async (
  data: SeoAuditJobData,
  opts: JobsOptions = {}
) => {
  return getSeoAuditsQueue().add("run-seo-audit", data, {
    priority: data.websiteId ? 3 : 1, // On-demand audits get higher priority
    ...opts,
  });
};

export const enqueueSiteCrawl = async (
  data: SiteCrawlJobData,
  opts: JobsOptions = {}
) => {
  return getSiteCrawlsQueue().add("crawl-site", data, {
    priority: 5,
    ...opts,
  });
};

export const enqueueAiReport = async (
  data: AiReportJobData,
  opts: JobsOptions = {}
) => {
  return getAiReportsQueue().add("generate-ai-report", data, {
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
