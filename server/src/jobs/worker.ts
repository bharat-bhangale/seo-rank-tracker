import { Worker } from "bullmq";
import { connectDB } from "../config/db";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { closeRedisConnection, getRedisConnection } from "./connection";
import { closeQueues, QUEUE_NAMES } from "./queues";
import { processGscSync } from "./processors/gsc-sync.processor";
import { processRankCheck } from "./processors/rank-check.processor";
import { processBacklinkSync } from "./processors/backlink-sync.processor";
import { processSeoAudit } from "./processors/seo-audit.processor";
import { processAiReport } from "./processors/ai-report.processor";
import { processSiteCrawl } from "./processors/site-crawl.processor";

export const startWorkers = () => {
  const connection = getRedisConnection();

  const rankWorker = new Worker(QUEUE_NAMES.rankChecks, processRankCheck, {
    connection,
    concurrency: 3,
  });

  const gscWorker = new Worker(QUEUE_NAMES.gscSync, processGscSync, {
    connection,
    concurrency: 2,
  });

  const backlinkWorker = new Worker(QUEUE_NAMES.backlinkSync, processBacklinkSync, {
    connection,
    concurrency: 2,
  });

  const seoAuditWorker = new Worker(QUEUE_NAMES.seoAudits, processSeoAudit, {
    connection,
    concurrency: 3,
  });

  const aiReportWorker = new Worker(QUEUE_NAMES.aiReports, processAiReport, {
    connection,
    concurrency: 2,
  });

  const siteCrawlWorker = new Worker(QUEUE_NAMES.siteCrawls, processSiteCrawl, {
    connection,
    concurrency: 1, // Crawls are resource-intensive
  });

  const workers = [
    rankWorker,
    gscWorker,
    backlinkWorker,
    seoAuditWorker,
    aiReportWorker,
    siteCrawlWorker,
  ];

  workers.forEach((worker) => {
    worker.on("completed", (job) => {
      logger.info(`Job completed: ${worker.name}/${job.name}/${job.id}`);
    });

    worker.on("failed", (job, error) => {
      logger.error(`Job failed: ${worker.name}/${job?.name}/${job?.id}`, {
        error: error.message,
      });
    });
  });

  const shutdown = async () => {
    logger.info("Shutting down workers gracefully");
    await Promise.all(workers.map((worker) => worker.close()));
    await closeQueues();
    await closeRedisConnection();
    process.exit(0);
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  return workers;
};

if (require.main === module) {
  connectDB()
    .then(() => {
      startWorkers();
      logger.info(`Workers started in ${env.NODE_ENV} mode`);
    })
    .catch((error) => {
      logger.error("Failed to start workers", error);
      process.exit(1);
    });
}
