import { Router, Request, Response } from "express";
import * as authController from "../controllers/auth.controller";
import * as userController from "../controllers/user.controller";
import * as uploadController from "../controllers/upload.controller";
import multer from "multer";
import { requireAdmin } from "../middleware/auth.middleware";

const router = Router();
const upload = multer();

// Auth
router.post("/register", authController.signUp);
router.post("/login", authController.signIn);
router.get("/logout", authController.logout);

// User DB
router.get("/", userController.getAllUsers);
router.get("/:id", userController.userInfo);
// Admins can create users (add members)
router.post("/", requireAdmin, authController.signUp);
// Admins can update or delete users
router.put("/:id", requireAdmin, userController.updateUser);
router.delete("/:id", requireAdmin, userController.deleteUser);

// Set role (admin only)
router.put("/:id/role", requireAdmin, userController.setRole);

// Upload
router.post("/upload", upload.single("file"), (req: Request, res: Response) => {
  uploadController.uploadProfil(req, res);
});

export default router;
