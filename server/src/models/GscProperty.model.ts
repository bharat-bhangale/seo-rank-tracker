import mongoose, { Document, Schema } from "mongoose";

export type GscPropertyStatus = "connected" | "needs_reauth" | "syncing" | "failed";

export interface IGscProperty extends Document {
  userId: mongoose.Types.ObjectId;
  websiteId?: mongoose.Types.ObjectId;
  siteUrl: string;
  propertyType: "url_prefix" | "domain";
  accountEmail?: string;
  scopes: string[];
  accessToken?: string;
  refreshToken?: string;
  tokenExpiryDate?: Date;
  status: GscPropertyStatus;
  lastSyncedAt?: Date;
  lastSyncError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const gscPropertySchema = new Schema<IGscProperty>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    websiteId: { type: Schema.Types.ObjectId, ref: "Website" },
    siteUrl: { type: String, required: true, trim: true },
    propertyType: {
      type: String,
      enum: ["url_prefix", "domain"],
      required: true,
    },
    accountEmail: String,
    scopes: { type: [String], default: [] },
    accessToken: { type: String, select: false },
    refreshToken: { type: String, select: false },
    tokenExpiryDate: Date,
    status: {
      type: String,
      enum: ["connected", "needs_reauth", "syncing", "failed"],
      default: "connected",
    },
    lastSyncedAt: Date,
    lastSyncError: String,
  },
  { timestamps: true }
);

gscPropertySchema.index({ userId: 1, siteUrl: 1 }, { unique: true });
gscPropertySchema.index({ websiteId: 1 });

export const GscProperty = mongoose.model<IGscProperty>("GscProperty", gscPropertySchema);
