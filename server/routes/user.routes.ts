import { Router, Request, Response } from "express";
import * as authController from "../controllers/auth.controller";
import * as userController from "../controllers/user.controller";
import * as uploadController from "../controllers/upload.controller";
import multer from "multer";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";

const router = Router();
const upload = multer();

// Auth
router.post("/register", requireAdmin, authController.signUp);
router.post("/login", authController.signIn);
router.get("/logout", authController.logout);

// User DB (authenticated)
router.get("/", requireAuth, userController.getAllUsers);
router.get("/:id", requireAuth, userController.userInfo);
// Admins can create users (add members)
router.post("/", requireAdmin, authController.signUp);
// Admins can update or delete users
router.put("/:id", requireAdmin, userController.updateUser);
router.delete("/:id", requireAdmin, userController.deleteUser);

// Set role(s) (admin only)
router.put("/:id/role", requireAdmin, userController.setRole);
router.put("/:id/roles", requireAdmin, userController.setRoles);

// Upload (authenticated)
router.post(
  "/upload",
  requireAuth,
  upload.single("file"),
  (req: Request, res: Response) => {
    uploadController.uploadProfil(req, res);
  },
);

export default router;
