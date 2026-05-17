import { Stagehand } from "@browserbasehq/stagehand";
import { z } from "zod";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";
import { logger } from "../../utils/logger";
import {
  buildNormalizedSerpResult,
  normalizeOrganicResults,
} from "./serp-normalizer";
import type { NormalizedSerpResult, RunSerpSearchInput, SerpFeature } from "./serp.types";

const stagehandOrganicResultSchema = z.object({
  position: z.number(),
  title: z.string(),
  url: z.string(),
  snippet: z.string().optional(),
  displayedUrl: z.string().optional(),
});

const stagehandFeatureSchema = z.object({
  type: z.enum([
    "featured_snippet",
    "ai_overview",
    "local_pack",
    "people_also_ask",
    "video_carousel",
    "image_pack",
    "shopping",
    "top_stories",
    "knowledge_panel",
    "sitelinks",
    "reviews",
    "map_pack",
  ]),
  position: z.number().optional(),
  title: z.string().optional(),
  url: z.string().optional(),
  ownerDomain: z.string().optional(),
  owned: z.boolean().default(false),
});

const stagehandSerpSchema = z.object({
  organicResults: z.array(stagehandOrganicResultSchema).default([]),
  serpFeatures: z.array(stagehandFeatureSchema).default([]),
  aiOverview: z
    .object({
      present: z.boolean().default(false),
      citesDomain: z.boolean().default(false),
      citations: z
        .array(
          z.object({
            title: z.string().optional(),
            url: z.string().optional(),
            domain: z.string().optional(),
          })
        )
        .default([]),
      summary: z.string().optional(),
    })
    .default({ present: false, citesDomain: false, citations: [] }),
});

type StagehandExtractor = {
  extract: (
    instruction: string,
    schema: typeof stagehandSerpSchema
  ) => Promise<unknown>;
};

const createGoogleSearchUrl = (input: RunSerpSearchInput): string => {
  const params = new URLSearchParams({
    q: input.keyword,
    num: "100",
    hl: input.locale.split("-")[0] || "en",
  });

  if (input.device === "mobile") {
    params.set("source", "mobile");
  }

  if (input.location?.name) {
    params.set("near", input.location.name);
  }

  return `https://www.google.com/search?${params.toString()}`;
};

export const scrapeSerpWithStagehand = async (
  input: RunSerpSearchInput
): Promise<NormalizedSerpResult> => {
  if (!env.BROWSERBASE_API_KEY || !env.BROWSERBASE_PROJECT_ID) {
    throw new AppError("Browserbase credentials are not configured.", 503);
  }

  const stagehand = new Stagehand({
    env: "BROWSERBASE",
    apiKey: env.BROWSERBASE_API_KEY,
    projectId: env.BROWSERBASE_PROJECT_ID,
    model: env.STAGEHAND_MODEL,
    disablePino: true,
    waitForCaptchaSolves: true,
    browserbaseSessionCreateParams: {
      projectId: env.BROWSERBASE_PROJECT_ID,
      proxies: true,
    },
  });

  try {
    await stagehand.init();
    const page = stagehand.context.activePage() || (await stagehand.context.newPage());
    const searchUrl = createGoogleSearchUrl(input);

    await page.goto(searchUrl, {
      waitUntil: "domcontentloaded",
      timeoutMs: 45_000,
    });
    await page.waitForTimeout(2_000);

    const rawExtracted = await (stagehand as unknown as StagehandExtractor).extract(
      [
        "Extract Google SERP data for rank tracking.",
        "Return up to 100 organic search results with position, title, URL, and snippet.",
        "Also detect featured snippets, AI Overviews, local/map packs, videos, images, shopping, top stories, knowledge panels, sitelinks, reviews, and people-also-ask features.",
        `Mark features as owned when they cite or link to ${input.domain}.`,
      ].join(" "),
      stagehandSerpSchema
    );
    const extracted = stagehandSerpSchema.parse(rawExtracted);

    const organicResults = normalizeOrganicResults(extracted.organicResults);
    if (organicResults.length < 5) {
      throw new AppError("Stagehand extracted too few organic results.", 502);
    }

    return buildNormalizedSerpResult({
      provider: "browserbase",
      keyword: input.keyword,
      domain: input.domain,
      searchEngine: input.searchEngine,
      locale: input.locale,
      device: input.device,
      location: input.location,
      organicResults,
      features: extracted.serpFeatures as SerpFeature[],
      aiOverview: extracted.aiOverview,
      rawMetadata: {
        browserbaseSessionId: stagehand.browserbaseSessionID,
        browserbaseDebugUrl: stagehand.browserbaseDebugURL,
      },
    });
  } catch (error) {
    logger.warn("Stagehand SERP extraction failed", {
      keyword: input.keyword,
      domain: input.domain,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  } finally {
    await stagehand.close().catch(() => undefined);
  }
};
