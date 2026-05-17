import mongoose, { Document, Schema } from "mongoose";

export interface IDomainBacklinkStats extends Document {
  userId: mongoose.Types.ObjectId;
  websiteId?: mongoose.Types.ObjectId;
  domain: string;
  date: Date;
  totalBacklinks: number;
  referringDomains: number;
  dofollowBacklinks: number;
  domainRank: number; // overall domain rating/trust flow
  spamScore: number;
  newBacklinks: number; // gained today
  lostBacklinks: number; // lost today
  createdAt: Date;
  updatedAt: Date;
}

const domainBacklinkStatsSchema = new Schema<IDomainBacklinkStats>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    websiteId: { type: Schema.Types.ObjectId, ref: "Website" },
    domain: { type: String, required: true, index: true },
    date: { type: Date, required: true },
    totalBacklinks: { type: Number, default: 0 },
    referringDomains: { type: Number, default: 0 },
    dofollowBacklinks: { type: Number, default: 0 },
    domainRank: { type: Number, default: 0 },
    spamScore: { type: Number, default: 0 },
    newBacklinks: { type: Number, default: 0 },
    lostBacklinks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

domainBacklinkStatsSchema.index({ userId: 1, domain: 1, date: -1 }, { unique: true });

export const DomainBacklinkStats = mongoose.model<IDomainBacklinkStats>(
  "DomainBacklinkStats",
  domainBacklinkStatsSchema
);
