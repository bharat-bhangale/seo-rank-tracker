import mongoose, { Document, Schema } from "mongoose";

export interface IBacklinkAlert extends Document {
  userId: mongoose.Types.ObjectId;
  domain: string;
  type: "new_link" | "lost_link" | "toxic_link";
  severity: "info" | "warning" | "critical";
  message: string;
  backlinkId?: mongoose.Types.ObjectId;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const backlinkAlertSchema = new Schema<IBacklinkAlert>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    domain: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: ["new_link", "lost_link", "toxic_link"],
      required: true,
    },
    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      required: true,
    },
    message: { type: String, required: true },
    backlinkId: { type: Schema.Types.ObjectId, ref: "Backlink" },
    readAt: { type: Date },
  },
  { timestamps: true }
);

backlinkAlertSchema.index({ userId: 1, domain: 1, createdAt: -1 });

export const BacklinkAlert = mongoose.model<IBacklinkAlert>("BacklinkAlert", backlinkAlertSchema);
