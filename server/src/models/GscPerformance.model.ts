import mongoose, { Document, Schema } from "mongoose";

export interface IGscPerformance extends Document {
  userId: mongoose.Types.ObjectId;
  propertyId: mongoose.Types.ObjectId;
  siteUrl: string;
  date: string;
  query: string;
  page: string;
  country: string;
  device: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

const gscPerformanceSchema = new Schema<IGscPerformance>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    propertyId: { type: Schema.Types.ObjectId, ref: "GscProperty", required: true },
    siteUrl: { type: String, required: true },
    date: { type: String, required: true },
    query: { type: String, required: true },
    page: { type: String, required: true },
    country: { type: String, required: true },
    device: { type: String, required: true },
    clicks: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    position: { type: Number, default: 0 },
  },
  { timestamps: true }
);

gscPerformanceSchema.index(
  { propertyId: 1, date: 1, query: 1, page: 1, country: 1, device: 1 },
  { unique: true }
);
gscPerformanceSchema.index({ userId: 1, date: -1 });
gscPerformanceSchema.index({ query: "text", page: "text" });

export const GscPerformance = mongoose.model<IGscPerformance>(
  "GscPerformance",
  gscPerformanceSchema
);
