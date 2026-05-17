import type { Job } from "bullmq";
import type { RankCheckJobData } from "../queues";
import { performRankCheck } from "../../modules/rank-tracking/rank-tracking.service";

export const processRankCheck = async (
  job: Job<RankCheckJobData>
): Promise<{ rankCheckId: string }> => {
  await job.updateProgress(10);
  const rankCheck = await performRankCheck(job.data.keywordId, {
    reason: job.data.reason,
    location: job.data.location,
    onProgress: (progress) => job.updateProgress(progress),
  });
  await job.updateProgress(100);

  return { rankCheckId: rankCheck.id };
};
