import mongoose, { Document, Schema } from "mongoose";

export interface ITopicCluster extends Document {
  userId: mongoose.Types.ObjectId;
  websiteId?: mongoose.Types.ObjectId;
  pillarTopic: string;
  subTopics: Array<{
    keyword: string;
    searchVolume: number;
    difficulty: number;
    intent: string;
    publishedUrl?: string; // Track cluster coverage
  }>;
  overallVolume: number;
  coveragePercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

const topicClusterSchema = new Schema<ITopicCluster>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    websiteId: { type: Schema.Types.ObjectId, ref: "Website" },
    pillarTopic: { type: String, required: true },
    subTopics: [
      {
        keyword: { type: String, required: true },
        searchVolume: { type: Number, default: 0 },
        difficulty: { type: Number, default: 0 },
        intent: { type: String, default: "informational" },
        publishedUrl: { type: String },
      },
    ],
    overallVolume: { type: Number, default: 0 },
    coveragePercentage: { type: Number, default: 0 },
  },
  { timestamps: true }
);

topicClusterSchema.index({ userId: 1, pillarTopic: 1 });

export const TopicCluster = mongoose.model<ITopicCluster>("TopicCluster", topicClusterSchema);
