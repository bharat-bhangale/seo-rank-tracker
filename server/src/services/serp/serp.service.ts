import { logger } from "../../utils/logger";
import { fetchSerpWithSerpApi } from "./serpapi.service";
import { scrapeSerpWithStagehand } from "./stagehand-serp.service";
import type { NormalizedSerpResult, RunSerpSearchInput } from "./serp.types";

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const runWithRetry = async <T>(
  fn: () => Promise<T>,
  attempts: number,
  delayMs: number
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await sleep(delayMs * attempt);
      }
    }
  }

  throw lastError;
};

export const runSerpSearch = async (
  input: RunSerpSearchInput
): Promise<NormalizedSerpResult> => {
  try {
    return await runWithRetry(() => scrapeSerpWithStagehand(input), 2, 1_500);
  } catch (stagehandError) {
    logger.warn("Falling back to SerpApi after Browserbase extraction failure", {
      keyword: input.keyword,
      domain: input.domain,
      error:
        stagehandError instanceof Error
          ? stagehandError.message
          : String(stagehandError),
    });

    return fetchSerpWithSerpApi(input);
  }
};
