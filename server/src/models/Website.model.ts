import mongoose, { Document, Schema } from "mongoose";

export interface IWebsite extends Document {
  userId: mongoose.Types.ObjectId;
  projectId?: mongoose.Types.ObjectId;
  domain: string;
  name: string;
  isVerified: boolean;
  verificationMethod?: "dns" | "file" | "meta";
  favicon?: string;
  whiteLabel?: {
    logoUrl?: string;
    brandColor?: string;
    companyName?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const websiteSchema = new Schema<IWebsite>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "Project",
    },
    domain: {
      type: String,
      required: [true, "Domain is required"],
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: [true, "Website name is required"],
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationMethod: {
      type: String,
      enum: ["dns", "file", "meta"],
    },
    favicon: String,
    whiteLabel: {
      logoUrl: { type: String },
      brandColor: { type: String },
      companyName: { type: String },
    },
  },
  { timestamps: true }
);

// Compound index: one domain per user
websiteSchema.index({ userId: 1, domain: 1 }, { unique: true });
websiteSchema.index({ projectId: 1 });

export const Website = mongoose.model<IWebsite>("Website", websiteSchema);
