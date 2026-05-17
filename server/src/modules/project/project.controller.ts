import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import * as projectService from "./project.service";

/**
 * POST /api/v1/projects
 */
export const createProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.createProject(req.user!.id, req.body);
  sendSuccess(res, { project }, 201, "Project created successfully");
});

/**
 * GET /api/v1/projects
 */
export const getProjects = asyncHandler(async (req: Request, res: Response) => {
  const projects = await projectService.getUserProjects(req.user!.id);
  sendSuccess(res, { projects });
});

/**
 * GET /api/v1/projects/:id
 */
export const getProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.getProjectById(
    req.params.id as string,
    req.user!.id
  );
  sendSuccess(res, { project });
});

/**
 * PUT /api/v1/projects/:id
 */
export const updateProject = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.updateProject(
    req.params.id as string,
    req.user!.id,
    req.body
  );
  sendSuccess(res, { project }, 200, "Project updated successfully");
});

/**
 * DELETE /api/v1/projects/:id
 */
export const deleteProject = asyncHandler(async (req: Request, res: Response) => {
  await projectService.deleteProject(req.params.id as string, req.user!.id);
  sendSuccess(res, null, 200, "Project deleted successfully");
});

/**
 * POST /api/v1/projects/:id/members
 */
export const inviteMember = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.inviteMember(
    req.params.id as string,
    req.user!.id,
    req.body
  );
  sendSuccess(res, { project }, 200, "Member invited successfully");
});

/**
 * DELETE /api/v1/projects/:id/members/:userId
 */
export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const project = await projectService.removeMember(
    req.params.id as string,
    req.user!.id,
    req.params.userId as string
  );
  sendSuccess(res, { project }, 200, "Member removed successfully");
});
