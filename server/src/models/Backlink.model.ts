import mongoose, { Document, Schema } from "mongoose";

export interface IBacklink extends Document {
  userId: mongoose.Types.ObjectId;
  websiteId?: mongoose.Types.ObjectId;
  targetDomain: string; // The domain being analyzed
  urlFrom: string; // The page where the link is found
  domainFrom: string;
  urlTo: string; // The page being linked to
  anchorText: string;
  isDofollow: boolean;
  spamScore: number;
  domainRank: number; // Authority of referring domain
  pageRank: number; // Authority of referring page
  isLost: boolean;
  isNewlyDiscovered: boolean;
  toxicityScore: number; // 0-100 score indicating spamminess
  toxicityStatus: "safe" | "suspicious" | "toxic";
  disavowed: boolean; // Whether the user marked this for disavow
  firstSeenAt: Date;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const backlinkSchema = new Schema<IBacklink>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    websiteId: { type: Schema.Types.ObjectId, ref: "Website" },
    targetDomain: { type: String, required: true, index: true },
    urlFrom: { type: String, required: true },
    domainFrom: { type: String, required: true, index: true },
    urlTo: { type: String, required: true },
    anchorText: { type: String, default: "" },
    isDofollow: { type: Boolean, default: true },
    spamScore: { type: Number, default: 0 },
    domainRank: { type: Number, default: 0 },
    pageRank: { type: Number, default: 0 },
    isLost: { type: Boolean, default: false },
    isNewlyDiscovered: { type: Boolean, default: false },
    toxicityScore: { type: Number, default: 0 },
    toxicityStatus: {
      type: String,
      enum: ["safe", "suspicious", "toxic"],
      default: "safe",
    },
    disavowed: { type: Boolean, default: false },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

backlinkSchema.index({ userId: 1, targetDomain: 1, urlFrom: 1, urlTo: 1 }, { unique: true });
backlinkSchema.index({ targetDomain: 1, toxicityStatus: 1 });
backlinkSchema.index({ targetDomain: 1, isLost: 1 });

export const Backlink = mongoose.model<IBacklink>("Backlink", backlinkSchema);
