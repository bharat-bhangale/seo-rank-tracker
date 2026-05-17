import type { Job } from "bullmq";
import type { GscSyncJobData } from "../queues";
import { syncGscProperty } from "../../modules/gsc/gsc.service";

export const processGscSync = async (
  job: Job<GscSyncJobData>
): Promise<{ imported: number }> => {
  await job.updateProgress(10);
  const result = await syncGscProperty(job.data.propertyId, {
    startDate: job.data.startDate,
    endDate: job.data.endDate,
  });
  await job.updateProgress(100);

  return { imported: result.imported };
};
