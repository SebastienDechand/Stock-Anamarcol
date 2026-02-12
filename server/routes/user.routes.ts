import { Router, Request, Response } from "express";
import * as authController from "../controllers/auth.controller";
import * as userController from "../controllers/user.controller";
import * as uploadController from "../controllers/upload.controller";
import multer from "multer";

const router = Router();
const upload = multer();

// Auth
router.post("/register", authController.signUp);
router.post("/login", authController.signIn);
router.get("/logout", authController.logout);

// User DB
router.get("/", userController.getAllUsers);
router.get("/:id", userController.userInfo);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

// Upload
router.post("/upload", upload.single("file"), (req: Request, res: Response) => {
  uploadController.uploadProfil(req, res);
});

export default router;
