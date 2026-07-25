import { Router, Request, Response } from "express";
import * as authController from "../controllers/auth.controller";
import * as userController from "../controllers/user.controller";
import * as uploadController from "../controllers/upload.controller";
import { imageUpload } from "../utils/upload.utils";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { loginRateLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

// Auth
router.post("/register", requireAdmin, authController.signUp);
router.post("/login", loginRateLimiter, authController.signIn);
router.get("/logout", authController.logout);

// User DB (authenticated)
router.get("/", requireAuth, userController.getAllUsers);
router.get("/:id", requireAuth, userController.userInfo);
// Admins can update any user; a user can also update their own profile
// (self-service fields only - see authorization check inside the controller)
router.put("/:id", requireAuth, userController.updateUser);
// Admins can delete users
router.delete("/:id", requireAdmin, userController.deleteUser);

// Set role(s) (admin only)
router.put("/:id/role", requireAdmin, userController.setRole);
router.put("/:id/roles", requireAdmin, userController.setRoles);

// Upload (authenticated)
router.post(
  "/upload",
  requireAuth,
  imageUpload.single("file"),
  (req: Request, res: Response) => {
    uploadController.uploadProfil(req, res);
  },
);

export default router;
