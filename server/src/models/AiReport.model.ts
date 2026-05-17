import mongoose, { Document, Schema } from "mongoose";

/** Represents a single prioritized action in an AI report */
interface PrioritizedAction {
  priority: number;
  category: string;
  title: string;
  description: string;
  impact: string;
  effort: string;
  codeSnippet?: string;
}

/** Represents a technical roadmap item */
interface RoadmapItem {
  phase: string;
  action: string;
  expectedImpact: string;
}

export interface IAiReport extends Document {
  userId: mongoose.Types.ObjectId;
  auditId?: mongoose.Types.ObjectId;
  reportType: "seo_report" | "content_brief" | "content_optimization" | "competitor_analysis";
  url?: string;
  keyword?: string;
  status: "generating" | "completed" | "failed";

  // Report data (flexible per type)
  executiveSummary?: string;
  overallAssessment?: string;
  prioritizedActions: PrioritizedAction[];
  strengths: string[];
  technicalRoadmap: RoadmapItem[];
  contentRecommendations: string[];
  estimatedScoreAfterFixes?: number;

  // Full AI response (stored for flexibility)
  rawResponse: Record<string, unknown>;

  // Token usage tracking
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    model: string;
    estimatedCostUsd: number;
  };

  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const prioritizedActionSchema = new Schema(
  {
    priority: { type: Number, required: true },
    category: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    impact: { type: String, required: true },
    effort: { type: String, required: true },
    codeSnippet: String,
  },
  { _id: false }
);

const roadmapItemSchema = new Schema(
  {
    phase: { type: String, required: true },
    action: { type: String, required: true },
    expectedImpact: { type: String, required: true },
  },
  { _id: false }
);

const tokenUsageSchema = new Schema(
  {
    promptTokens: { type: Number, default: 0 },
    completionTokens: { type: Number, default: 0 },
    totalTokens: { type: Number, default: 0 },
    model: { type: String, default: "" },
    estimatedCostUsd: { type: Number, default: 0 },
  },
  { _id: false }
);

const aiReportSchema = new Schema<IAiReport>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    auditId: { type: Schema.Types.ObjectId, ref: "SeoAudit" },
    reportType: {
      type: String,
      enum: ["seo_report", "content_brief", "content_optimization", "competitor_analysis"],
      required: true,
    },
    url: String,
    keyword: String,
    status: {
      type: String,
      enum: ["generating", "completed", "failed"],
      default: "generating",
    },
    executiveSummary: String,
    overallAssessment: String,
    prioritizedActions: { type: [prioritizedActionSchema], default: [] },
    strengths: { type: [String], default: [] },
    technicalRoadmap: { type: [roadmapItemSchema], default: [] },
    contentRecommendations: { type: [String], default: [] },
    estimatedScoreAfterFixes: Number,
    rawResponse: { type: Schema.Types.Mixed, default: {} },
    tokenUsage: { type: tokenUsageSchema, default: () => ({}) },
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

// Indexes
aiReportSchema.index({ userId: 1, createdAt: -1 });
aiReportSchema.index({ userId: 1, reportType: 1, createdAt: -1 });
aiReportSchema.index({ auditId: 1 });

export const AiReport = mongoose.model<IAiReport>("AiReport", aiReportSchema);
