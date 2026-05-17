import type { Job } from "bullmq";
import type { BacklinkSyncJobData } from "../queues";
import { syncBacklinksJob } from "../../modules/backlinks/backlinks.service";

export const processBacklinkSync = async (
  job: Job<BacklinkSyncJobData>
): Promise<{ imported: number; newLinks: number; lostCount: number }> => {
  await job.updateProgress(10);
  const result = await syncBacklinksJob(
    job.data.userId,
    job.data.domain,
    job.data.websiteId
  );
  await job.updateProgress(100);

  return result;
};
