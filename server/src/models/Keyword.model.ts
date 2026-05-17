import mongoose, { Document, Schema } from "mongoose";
import type { DeviceType, SearchEngine, SerpLocation } from "../services/serp/serp.types";

export type KeywordStatus = "active" | "paused";
export type RankCheckStatus = "never_checked" | "queued" | "checking" | "completed" | "failed";

interface IKeywordSchedule {
  enabled: boolean;
  cron: string;
  timezone: string;
  lastScheduledAt?: Date;
}

export interface IKeyword extends Document {
  userId: mongoose.Types.ObjectId;
  websiteId?: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  domain: string;
  keyword: string;
  searchEngine: SearchEngine;
  locale: string;
  device: DeviceType;
  group?: string;
  tags: string[];
  competitors: string[];
  status: KeywordStatus;
  schedule: IKeywordSchedule;
  geoTarget?: SerpLocation & {
    radiusKm?: number;
    gridSize?: number;
  };
  lastPosition?: number;
  previousPosition?: number;
  bestPosition?: number;
  lastUrl?: string;
  lastCheckedAt?: Date;
  lastCheckStatus: RankCheckStatus;
  lastCheckError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const keywordScheduleSchema = new Schema<IKeywordSchedule>(
  {
    enabled: { type: Boolean, default: true },
    cron: { type: String, default: "0 3 * * *" },
    timezone: { type: String, default: "UTC" },
    lastScheduledAt: Date,
  },
  { _id: false }
);

const geoTargetSchema = new Schema(
  {
    name: { type: String, trim: true },
    latitude: Number,
    longitude: Number,
    radiusKm: { type: Number, min: 1, max: 100 },
    gridSize: { type: Number, min: 3, max: 9 },
  },
  { _id: false }
);

const keywordSchema = new Schema<IKeyword>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    websiteId: { type: Schema.Types.ObjectId, ref: "Website" },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    domain: {
      type: String,
      required: [true, "Domain is required"],
      lowercase: true,
      trim: true,
    },
    keyword: {
      type: String,
      required: [true, "Keyword is required"],
      trim: true,
      maxlength: [250, "Keyword cannot exceed 250 characters"],
    },
    searchEngine: {
      type: String,
      enum: ["google"],
      default: "google",
    },
    locale: {
      type: String,
      default: "en-US",
      trim: true,
    },
    device: {
      type: String,
      enum: ["desktop", "mobile"],
      default: "desktop",
    },
    group: { type: String, trim: true, maxlength: 80 },
    tags: { type: [String], default: [] },
    competitors: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["active", "paused"],
      default: "active",
    },
    schedule: {
      type: keywordScheduleSchema,
      default: () => ({
        enabled: true,
        cron: "0 3 * * *",
        timezone: "UTC",
      }),
    },
    geoTarget: geoTargetSchema,
    lastPosition: Number,
    previousPosition: Number,
    bestPosition: Number,
    lastUrl: String,
    lastCheckedAt: Date,
    lastCheckStatus: {
      type: String,
      enum: ["never_checked", "queued", "checking", "completed", "failed"],
      default: "never_checked",
    },
    lastCheckError: String,
  },
  { timestamps: true }
);

keywordSchema.index(
  { userId: 1, domain: 1, keyword: 1, searchEngine: 1, locale: 1, device: 1 },
  { unique: true }
);
keywordSchema.index({ userId: 1, status: 1, updatedAt: -1 });
keywordSchema.index({ websiteId: 1, status: 1 });
keywordSchema.index({ tags: 1 });

export const Keyword = mongoose.model<IKeyword>("Keyword", keywordSchema);
