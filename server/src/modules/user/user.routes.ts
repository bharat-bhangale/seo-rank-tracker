import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as userController from "./user.controller";
import { updateProfileSchema } from "./user.validation";

const router = Router();

// All user routes require authentication
router.use(authenticate);

router.get("/profile", userController.getProfile);
router.put("/profile", validate(updateProfileSchema), userController.updateProfile);
router.get("/usage", userController.getUsage);
router.delete("/account", userController.deleteAccount);

export default router;
