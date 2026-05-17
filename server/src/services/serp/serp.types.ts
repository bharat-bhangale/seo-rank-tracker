export const SEARCH_ENGINES = ["google"] as const;
export type SearchEngine = (typeof SEARCH_ENGINES)[number];

export const DEVICE_TYPES = ["desktop", "mobile"] as const;
export type DeviceType = (typeof DEVICE_TYPES)[number];

export const SERP_PROVIDERS = ["browserbase", "serpapi"] as const;
export type SerpProvider = (typeof SERP_PROVIDERS)[number];

export const SERP_FEATURE_TYPES = [
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
] as const;

export type SerpFeatureType = (typeof SERP_FEATURE_TYPES)[number];

export interface SerpLocation {
  name?: string;
  latitude?: number;
  longitude?: number;
}

export interface OrganicSerpResult {
  position: number;
  title: string;
  url: string;
  snippet?: string;
  displayedUrl?: string;
}

export interface SerpFeature {
  type: SerpFeatureType;
  position?: number;
  title?: string;
  url?: string;
  ownerDomain?: string;
  owned: boolean;
  metadata?: Record<string, unknown>;
}

export interface AiOverviewResult {
  present: boolean;
  citesDomain: boolean;
  citations: Array<{
    title?: string;
    url?: string;
    domain?: string;
  }>;
  summary?: string;
}

export interface NormalizedSerpResult {
  provider: SerpProvider;
  keyword: string;
  searchEngine: SearchEngine;
  locale: string;
  device: DeviceType;
  location?: SerpLocation;
  organicResults: OrganicSerpResult[];
  serpFeatures: SerpFeature[];
  aiOverview: AiOverviewResult;
  rawMetadata?: Record<string, unknown>;
}

export interface RankingMatch {
  found: boolean;
  position?: number;
  url?: string;
  title?: string;
  snippet?: string;
}

export interface RunSerpSearchInput {
  keyword: string;
  domain: string;
  searchEngine: SearchEngine;
  locale: string;
  device: DeviceType;
  location?: SerpLocation;
}
