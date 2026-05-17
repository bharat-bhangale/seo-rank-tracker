import { domainMatchesUrl, getHostname } from "../../utils/domain";
import type {
  AiOverviewResult,
  DeviceType,
  NormalizedSerpResult,
  OrganicSerpResult,
  SearchEngine,
  SerpFeature,
  SerpFeatureType,
  SerpLocation,
  SerpProvider,
} from "./serp.types";

const KNOWN_FEATURE_KEYS: Array<{ key: string; type: SerpFeatureType }> = [
  { key: "answer_box", type: "featured_snippet" },
  { key: "featured_snippet", type: "featured_snippet" },
  { key: "ai_overview", type: "ai_overview" },
  { key: "local_results", type: "local_pack" },
  { key: "local_pack", type: "local_pack" },
  { key: "related_questions", type: "people_also_ask" },
  { key: "inline_videos", type: "video_carousel" },
  { key: "video_results", type: "video_carousel" },
  { key: "images_results", type: "image_pack" },
  { key: "shopping_results", type: "shopping" },
  { key: "top_stories", type: "top_stories" },
  { key: "knowledge_graph", type: "knowledge_panel" },
];

interface NormalizeInput {
  provider: SerpProvider;
  keyword: string;
  domain: string;
  searchEngine: SearchEngine;
  locale: string;
  device: DeviceType;
  location?: SerpLocation;
  organicResults: OrganicSerpResult[];
  features?: SerpFeature[];
  aiOverview?: AiOverviewResult;
  rawMetadata?: Record<string, unknown>;
}

export const normalizeOrganicResults = (
  results: Array<Record<string, unknown>>
): OrganicSerpResult[] => {
  const normalized: OrganicSerpResult[] = [];

  results.forEach((result, index) => {
    const url = String(result.url || result.link || "").trim();
    const title = String(result.title || "").trim();
    const position = Number(result.position || index + 1);
    const snippet = result.snippet ? String(result.snippet).trim() : undefined;
    const displayedUrl = result.displayedUrl || result.displayed_link;

    if (!url || !title || Number.isNaN(position)) return;

    normalized.push({
      position,
      title,
      url,
      snippet,
      displayedUrl: displayedUrl ? String(displayedUrl) : undefined,
    });
  });

  return normalized.sort((a, b) => a.position - b.position);
};

const featureFromObject = (
  type: SerpFeatureType,
  value: unknown,
  domain: string
): SerpFeature | undefined => {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const url = String(record.link || record.url || "").trim() || undefined;
  const title = String(record.title || record.name || type).trim();
  const ownerDomain = getHostname(url);

  return {
    type,
    position: Number(record.position) || undefined,
    title,
    url,
    ownerDomain,
    owned: Boolean(url && domainMatchesUrl(domain, url)),
    metadata: record,
  };
};

export const extractSerpApiFeatures = (
  payload: Record<string, unknown>,
  domain: string
): SerpFeature[] => {
  const features: SerpFeature[] = [];

  for (const { key, type } of KNOWN_FEATURE_KEYS) {
    const value = payload[key];
    if (!value) continue;

    if (Array.isArray(value)) {
      value.slice(0, 10).forEach((item) => {
        const feature = featureFromObject(type, item, domain);
        if (feature) features.push(feature);
      });
      continue;
    }

    const feature = featureFromObject(type, value, domain);
    if (feature) features.push(feature);
  }

  return features;
};

export const extractSerpApiAiOverview = (
  payload: Record<string, unknown>,
  domain: string
): AiOverviewResult => {
  const aiOverview = payload.ai_overview as Record<string, unknown> | undefined;
  const citationsSource =
    (aiOverview?.references as unknown[]) ||
    (aiOverview?.citations as unknown[]) ||
    [];

  const citations = citationsSource
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => {
      const url = String(item.link || item.url || "").trim() || undefined;
      return {
        title: item.title ? String(item.title) : undefined,
        url,
        domain: getHostname(url),
      };
    });

  const citesDomain = citations.some((citation) =>
    domainMatchesUrl(domain, citation.url)
  );

  return {
    present: Boolean(aiOverview),
    citesDomain,
    citations,
    summary: aiOverview?.text ? String(aiOverview.text) : undefined,
  };
};

export const buildNormalizedSerpResult = (
  input: NormalizeInput
): NormalizedSerpResult => {
  const aiOverview =
    input.aiOverview ||
    input.features?.some((feature) => feature.type === "ai_overview")
      ? input.aiOverview || {
          present: true,
          citesDomain: Boolean(
            input.features?.some(
              (feature) => feature.type === "ai_overview" && feature.owned
            )
          ),
          citations: [],
        }
      : { present: false, citesDomain: false, citations: [] };

  return {
    provider: input.provider,
    keyword: input.keyword,
    searchEngine: input.searchEngine,
    locale: input.locale,
    device: input.device,
    location: input.location,
    organicResults: input.organicResults.slice(0, 100),
    serpFeatures: input.features || [],
    aiOverview,
    rawMetadata: input.rawMetadata,
  };
};
