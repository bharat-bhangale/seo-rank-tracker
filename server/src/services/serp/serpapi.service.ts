import axios from "axios";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import {
  buildNormalizedSerpResult,
  extractSerpApiAiOverview,
  extractSerpApiFeatures,
  normalizeOrganicResults,
} from "./serp-normalizer";
import type { NormalizedSerpResult, RunSerpSearchInput } from "./serp.types";

const localeToCountry = (locale: string): string | undefined => {
  const parts = locale.split("-");
  return parts[1]?.toLowerCase();
};

export const fetchSerpWithSerpApi = async (
  input: RunSerpSearchInput
): Promise<NormalizedSerpResult> => {
  if (!env.SERPAPI_KEY) {
    throw new AppError("SerpApi credentials are not configured.", 503);
  }

  const response = await axios.get<Record<string, unknown>>(
    "https://serpapi.com/search.json",
    {
      timeout: 45_000,
      params: {
        api_key: env.SERPAPI_KEY,
        engine: "google",
        q: input.keyword,
        num: 100,
        hl: input.locale.split("-")[0] || "en",
        gl: localeToCountry(input.locale),
        device: input.device,
        location: input.location?.name,
      },
    }
  );

  if (response.data.error) {
    throw new AppError(String(response.data.error), 502);
  }

  const organicResults = normalizeOrganicResults(
    (response.data.organic_results as Array<Record<string, unknown>>) || []
  );

  return buildNormalizedSerpResult({
    provider: "serpapi",
    keyword: input.keyword,
    domain: input.domain,
    searchEngine: input.searchEngine,
    locale: input.locale,
    device: input.device,
    location: input.location,
    organicResults,
    features: extractSerpApiFeatures(response.data, input.domain),
    aiOverview: extractSerpApiAiOverview(response.data, input.domain),
    rawMetadata: {
      searchId: (response.data.search_metadata as Record<string, unknown> | undefined)?.id,
      status: (response.data.search_metadata as Record<string, unknown> | undefined)?.status,
      estimatedCostUsd: env.SERPAPI_COST_PER_SEARCH,
    },
  });
};
