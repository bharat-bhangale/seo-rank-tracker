import mongoose, { Document, Schema } from "mongoose";
import type { ProjectRole } from "../config/constants";

/** Subdocument: Team member with role */
interface IProjectMember {
  userId: mongoose.Types.ObjectId;
  role: ProjectRole;
  joinedAt: Date;
}

export interface IProject extends Document {
  name: string;
  ownerId: mongoose.Types.ObjectId;
  members: IProjectMember[];
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const projectMemberSchema = new Schema<IProjectMember>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: {
      type: String,
      enum: ["owner", "editor", "viewer"],
      default: "viewer",
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const projectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
      maxlength: [100, "Project name cannot exceed 100 characters"],
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: {
      type: [projectMemberSchema],
      default: [],
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

projectSchema.index({ ownerId: 1 });
projectSchema.index({ "members.userId": 1 });

export const Project = mongoose.model<IProject>("Project", projectSchema);
