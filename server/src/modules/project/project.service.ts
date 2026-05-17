import { Project, type IProject } from "../../models/Project.model";
import { User } from "../../models/User.model";
import { AppError } from "../../utils/AppError";
import type {
  CreateProjectInput,
  UpdateProjectInput,
  InviteMemberInput,
} from "./project.validation";

/**
 * Create a new project. The creator becomes the owner.
 */
export const createProject = async (
  userId: string,
  input: CreateProjectInput
): Promise<IProject> => {
  const project = await Project.create({
    name: input.name,
    ownerId: userId,
    members: [{ userId, role: "owner", joinedAt: new Date() }],
  });

  return project;
};

/**
 * Get all projects the user owns or is a member of.
 */
export const getUserProjects = async (userId: string) => {
  const projects = await Project.find({
    $or: [{ ownerId: userId }, { "members.userId": userId }],
    isArchived: false,
  })
    .sort({ updatedAt: -1 })
    .lean();

  return projects;
};

/**
 * Get a single project by ID. Verifies user has access.
 */
export const getProjectById = async (
  projectId: string,
  userId: string
): Promise<IProject> => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new AppError("Project not found.", 404);
  }

  const hasAccess =
    project.ownerId.toString() === userId ||
    project.members.some((m) => m.userId.toString() === userId);

  if (!hasAccess) {
    throw new AppError("You do not have access to this project.", 403);
  }

  return project;
};

/**
 * Update project details. Only owner can update.
 */
export const updateProject = async (
  projectId: string,
  userId: string,
  input: UpdateProjectInput
): Promise<IProject> => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new AppError("Project not found.", 404);
  }

  if (project.ownerId.toString() !== userId) {
    throw new AppError("Only the project owner can update project details.", 403);
  }

  Object.assign(project, input);
  await project.save();

  return project;
};

/**
 * Delete a project. Only owner can delete.
 */
export const deleteProject = async (
  projectId: string,
  userId: string
): Promise<void> => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new AppError("Project not found.", 404);
  }

  if (project.ownerId.toString() !== userId) {
    throw new AppError("Only the project owner can delete this project.", 403);
  }

  // Unlink websites from this project
  const { Website } = await import("../../models/Website.model");
  await Website.updateMany({ projectId }, { $unset: { projectId: 1 } });

  await Project.findByIdAndDelete(projectId);
};

/**
 * Invite a team member by email. Owner or editor can invite.
 */
export const inviteMember = async (
  projectId: string,
  inviterId: string,
  input: InviteMemberInput
): Promise<IProject> => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new AppError("Project not found.", 404);
  }

  // Check inviter has owner or editor role
  const inviterMember = project.members.find(
    (m) => m.userId.toString() === inviterId
  );
  if (!inviterMember || !["owner", "editor"].includes(inviterMember.role)) {
    throw new AppError("You do not have permission to invite members.", 403);
  }

  // Find user by email
  const invitee = await User.findOne({ email: input.email });
  if (!invitee) {
    throw new AppError("No user found with that email address.", 404);
  }

  // Check if already a member
  const alreadyMember = project.members.some(
    (m) => m.userId.toString() === invitee.id
  );
  if (alreadyMember) {
    throw new AppError("This user is already a project member.", 409);
  }

  project.members.push({
    userId: invitee.id,
    role: input.role,
    joinedAt: new Date(),
  });

  await project.save();

  return project;
};

/**
 * Remove a member from a project. Owner can remove anyone; members can remove themselves.
 */
export const removeMember = async (
  projectId: string,
  requesterId: string,
  memberUserId: string
): Promise<IProject> => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new AppError("Project not found.", 404);
  }

  const isOwner = project.ownerId.toString() === requesterId;
  const isSelf = requesterId === memberUserId;

  if (!isOwner && !isSelf) {
    throw new AppError("Only the owner can remove other members.", 403);
  }

  if (isOwner && isSelf) {
    throw new AppError("The project owner cannot leave. Transfer ownership or delete the project.", 400);
  }

  project.members = project.members.filter(
    (m) => m.userId.toString() !== memberUserId
  );

  await project.save();

  return project;
};
