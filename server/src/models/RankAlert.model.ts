import mongoose, { Document, Schema } from "mongoose";
import type { SerpFeatureType } from "../services/serp/serp.types";

export type RankAlertType =
  | "rank_gain"
  | "rank_loss"
  | "feature_gain"
  | "feature_loss"
  | "ai_visibility_gain"
  | "ai_visibility_loss";

export type RankAlertSeverity = "info" | "warning" | "critical";

export interface IRankAlert extends Document {
  userId: mongoose.Types.ObjectId;
  keywordId: mongoose.Types.ObjectId;
  rankCheckId: mongoose.Types.ObjectId;
  type: RankAlertType;
  severity: RankAlertSeverity;
  message: string;
  previousPosition?: number;
  currentPosition?: number;
  delta?: number;
  featureType?: SerpFeatureType;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const rankAlertSchema = new Schema<IRankAlert>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    keywordId: { type: Schema.Types.ObjectId, ref: "Keyword", required: true },
    rankCheckId: { type: Schema.Types.ObjectId, ref: "RankCheck", required: true },
    type: {
      type: String,
      enum: [
        "rank_gain",
        "rank_loss",
        "feature_gain",
        "feature_loss",
        "ai_visibility_gain",
        "ai_visibility_loss",
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      default: "info",
    },
    message: { type: String, required: true },
    previousPosition: Number,
    currentPosition: Number,
    delta: Number,
    featureType: String,
    readAt: Date,
  },
  { timestamps: true }
);

rankAlertSchema.index({ userId: 1, createdAt: -1 });
rankAlertSchema.index({ keywordId: 1, createdAt: -1 });
rankAlertSchema.index({ readAt: 1 });

export const RankAlert = mongoose.model<IRankAlert>("RankAlert", rankAlertSchema);
