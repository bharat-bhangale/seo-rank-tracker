import mongoose, { Document, Schema } from "mongoose";
import type {
  AiOverviewResult,
  DeviceType,
  OrganicSerpResult,
  SearchEngine,
  SerpFeature,
  SerpLocation,
  SerpProvider,
} from "../services/serp/serp.types";

export type RankCheckSource = SerpProvider | "manual";
export type StoredRankCheckStatus = "completed" | "failed";

export interface IRankCheck extends Document {
  userId: mongoose.Types.ObjectId;
  keywordId: mongoose.Types.ObjectId;
  websiteId?: mongoose.Types.ObjectId;
  domain: string;
  keyword: string;
  searchEngine: SearchEngine;
  locale: string;
  device: DeviceType;
  location?: SerpLocation;
  source: RankCheckSource;
  status: StoredRankCheckStatus;
  checkedAt: Date;
  found: boolean;
  position?: number;
  previousPosition?: number;
  change?: number;
  url?: string;
  title?: string;
  snippet?: string;
  organicResults: OrganicSerpResult[];
  serpFeatures: SerpFeature[];
  aiOverview: AiOverviewResult;
  providerMetadata?: Record<string, unknown>;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const organicResultSchema = new Schema<OrganicSerpResult>(
  {
    position: { type: Number, required: true },
    title: { type: String, required: true },
    url: { type: String, required: true },
    snippet: String,
    displayedUrl: String,
  },
  { _id: false }
);

const serpFeatureSchema = new Schema<SerpFeature>(
  {
    type: {
      type: String,
      required: true,
      enum: [
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
      ],
    },
    position: Number,
    title: String,
    url: String,
    ownerDomain: String,
    owned: { type: Boolean, default: false },
    metadata: Schema.Types.Mixed,
  },
  { _id: false }
);

const aiOverviewSchema = new Schema<AiOverviewResult>(
  {
    present: { type: Boolean, default: false },
    citesDomain: { type: Boolean, default: false },
    citations: {
      type: [
        {
          title: String,
          url: String,
          domain: String,
        },
      ],
      default: [],
    },
    summary: String,
  },
  { _id: false }
);

const rankCheckSchema = new Schema<IRankCheck>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    keywordId: { type: Schema.Types.ObjectId, ref: "Keyword", required: true },
    websiteId: { type: Schema.Types.ObjectId, ref: "Website" },
    domain: { type: String, required: true, lowercase: true, trim: true },
    keyword: { type: String, required: true, trim: true },
    searchEngine: { type: String, enum: ["google"], default: "google" },
    locale: { type: String, default: "en-US" },
    device: { type: String, enum: ["desktop", "mobile"], default: "desktop" },
    location: {
      name: String,
      latitude: Number,
      longitude: Number,
    },
    source: {
      type: String,
      enum: ["browserbase", "serpapi", "manual"],
      required: true,
    },
    status: { type: String, enum: ["completed", "failed"], required: true },
    checkedAt: { type: Date, default: Date.now },
    found: { type: Boolean, default: false },
    position: Number,
    previousPosition: Number,
    change: Number,
    url: String,
    title: String,
    snippet: String,
    organicResults: { type: [organicResultSchema], default: [] },
    serpFeatures: { type: [serpFeatureSchema], default: [] },
    aiOverview: { type: aiOverviewSchema, default: () => ({ present: false, citesDomain: false, citations: [] }) },
    providerMetadata: Schema.Types.Mixed,
    errorMessage: String,
  },
  { timestamps: true }
);

rankCheckSchema.index({ keywordId: 1, checkedAt: -1 });
rankCheckSchema.index({ userId: 1, checkedAt: -1 });
rankCheckSchema.index({ domain: 1, keyword: 1, checkedAt: -1 });
rankCheckSchema.index({ "serpFeatures.type": 1, "serpFeatures.owned": 1 });

export const RankCheck = mongoose.model<IRankCheck>("RankCheck", rankCheckSchema);
