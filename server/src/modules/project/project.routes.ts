import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as projectController from "./project.controller";
import {
  createProjectSchema,
  updateProjectSchema,
  inviteMemberSchema,
} from "./project.validation";

const router = Router();

// All project routes require authentication
router.use(authenticate);

router.post("/", validate(createProjectSchema), projectController.createProject);
router.get("/", projectController.getProjects);
router.get("/:id", projectController.getProject);
router.put("/:id", validate(updateProjectSchema), projectController.updateProject);
router.delete("/:id", projectController.deleteProject);

// Team member management
router.post(
  "/:id/members",
  validate(inviteMemberSchema),
  projectController.inviteMember
);
router.delete("/:id/members/:userId", projectController.removeMember);

export default router;
