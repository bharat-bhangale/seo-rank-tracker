import mongoose, { Document, Schema } from "mongoose";

/** Single crawled page data */
interface ICrawledPage {
  url: string;
  statusCode: number;
  title?: string;
  description?: string;
  h1?: string;
  contentLength: number;
  loadTimeMs: number;
  internalLinksCount: number;
  externalLinksCount: number;
  brokenLinks: string[];
  redirectTarget?: string;
  issues: Array<{
    type: string;
    severity: "critical" | "warning" | "info";
    message: string;
  }>;
  depth: number;
}

/** Site-wide aggregation summary */
interface ICrawlSummary {
  totalPages: number;
  brokenLinksCount: number;
  redirectChainsCount: number;
  orphanPagesCount: number;
  duplicateTitlesCount: number;
  duplicateDescriptionsCount: number;
  missingTitles: number;
  missingDescriptions: number;
  missingH1: number;
  averageLoadTimeMs: number;
  healthScore: number;
}

export interface ICrawlResult extends Document {
  userId: mongoose.Types.ObjectId;
  websiteId: mongoose.Types.ObjectId;
  domain: string;
  status: "pending" | "crawling" | "completed" | "failed";
  config: {
    maxDepth: number;
    maxPages: number;
    respectRobotsTxt: boolean;
    includeSubdomains: boolean;
  };
  progress: {
    crawledPages: number;
    totalDiscovered: number;
    percentComplete: number;
  };
  pages: ICrawledPage[];
  summary: ICrawlSummary;
  robotsTxt?: string;
  sitemapUrls: string[];
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const crawledPageSchema = new Schema(
  {
    url: { type: String, required: true },
    statusCode: { type: Number, required: true },
    title: String,
    description: String,
    h1: String,
    contentLength: { type: Number, default: 0 },
    loadTimeMs: { type: Number, default: 0 },
    internalLinksCount: { type: Number, default: 0 },
    externalLinksCount: { type: Number, default: 0 },
    brokenLinks: { type: [String], default: [] },
    redirectTarget: String,
    issues: [
      {
        type: { type: String, required: true },
        severity: { type: String, enum: ["critical", "warning", "info"], required: true },
        message: { type: String, required: true },
      },
    ],
    depth: { type: Number, default: 0 },
  },
  { _id: false }
);

const crawlSummarySchema = new Schema(
  {
    totalPages: { type: Number, default: 0 },
    brokenLinksCount: { type: Number, default: 0 },
    redirectChainsCount: { type: Number, default: 0 },
    orphanPagesCount: { type: Number, default: 0 },
    duplicateTitlesCount: { type: Number, default: 0 },
    duplicateDescriptionsCount: { type: Number, default: 0 },
    missingTitles: { type: Number, default: 0 },
    missingDescriptions: { type: Number, default: 0 },
    missingH1: { type: Number, default: 0 },
    averageLoadTimeMs: { type: Number, default: 0 },
    healthScore: { type: Number, default: 0 },
  },
  { _id: false }
);

const crawlResultSchema = new Schema<ICrawlResult>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    websiteId: { type: Schema.Types.ObjectId, ref: "Website", required: true },
    domain: { type: String, required: true, trim: true, lowercase: true },
    status: {
      type: String,
      enum: ["pending", "crawling", "completed", "failed"],
      default: "pending",
    },
    config: {
      maxDepth: { type: Number, default: 3 },
      maxPages: { type: Number, default: 100 },
      respectRobotsTxt: { type: Boolean, default: true },
      includeSubdomains: { type: Boolean, default: false },
    },
    progress: {
      crawledPages: { type: Number, default: 0 },
      totalDiscovered: { type: Number, default: 0 },
      percentComplete: { type: Number, default: 0 },
    },
    pages: { type: [crawledPageSchema], default: [] },
    summary: { type: crawlSummarySchema, default: () => ({}) },
    robotsTxt: String,
    sitemapUrls: { type: [String], default: [] },
    errorMessage: String,
    startedAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: any, ret: Record<string, any>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes for fast queries
crawlResultSchema.index({ userId: 1, createdAt: -1 });
crawlResultSchema.index({ websiteId: 1, createdAt: -1 });
crawlResultSchema.index({ userId: 1, status: 1 });

export const CrawlResult = mongoose.model<ICrawlResult>("CrawlResult", crawlResultSchema);
