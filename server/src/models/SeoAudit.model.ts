import mongoose, { Document, Schema } from "mongoose";
import type { SeoCheckResult, CategoryScore, PageData } from "../modules/seo-analyzer/seo-analyzer.types";

export interface ISeoAudit extends Document {
  userId: mongoose.Types.ObjectId;
  websiteId?: mongoose.Types.ObjectId;
  url: string;
  overallScore: number;
  grade: string;
  categoryScores: CategoryScore[];
  checks: SeoCheckResult[];
  pageData: PageData;
  status: "pending" | "running" | "completed" | "failed";
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const seoCheckSchema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, enum: ["onPage", "technical", "performance", "content"], required: true },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    severity: { type: String, enum: ["critical", "warning", "info", "pass"], required: true },
    message: { type: String, required: true },
    details: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const categoryScoreSchema = new Schema(
  {
    category: { type: String, required: true },
    score: { type: Number, required: true },
    maxScore: { type: Number, required: true },
    checksCount: { type: Number, required: true },
    criticalCount: { type: Number, required: true },
    warningCount: { type: Number, required: true },
  },
  { _id: false }
);

const pageDataSchema = new Schema(
  {
    url: { type: String, required: true },
    finalUrl: { type: String, required: true },
    statusCode: { type: Number, required: true },
    contentLength: { type: Number, required: true },
    loadTimeMs: { type: Number, required: true },
    isHttps: { type: Boolean, required: true },
    title: String,
    description: String,
    h1: String,
  },
  { _id: false }
);

const seoAuditSchema = new Schema<ISeoAudit>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    websiteId: { type: Schema.Types.ObjectId, ref: "Website" },
    url: { type: String, required: true },
    overallScore: { type: Number, default: 0 },
    grade: { type: String, default: "F" },
    categoryScores: { type: [categoryScoreSchema], default: [] },
    checks: { type: [seoCheckSchema], default: [] },
    pageData: { type: pageDataSchema },
    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed"],
      default: "pending",
    },
    errorMessage: String,
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
seoAuditSchema.index({ userId: 1, createdAt: -1 });
seoAuditSchema.index({ userId: 1, url: 1, createdAt: -1 });
seoAuditSchema.index({ websiteId: 1, createdAt: -1 });

// TTL index: auto-delete free-tier audits after 90 days
seoAuditSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60, partialFilterExpression: { grade: { $ne: "A+" } } }
);

export const SeoAudit = mongoose.model<ISeoAudit>("SeoAudit", seoAuditSchema);
