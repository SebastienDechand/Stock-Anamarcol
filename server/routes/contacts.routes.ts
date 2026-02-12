import { Router, Request, Response } from "express";
import * as contactController from "../controllers/contacts.controller";
import * as uploadContactController from "../controllers/uploadContact.controller";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import multer from "multer";

const router = Router();
const upload = multer();

router.get("/", requireAuth, contactController.getContacts);
router.get("/:id", requireAuth, contactController.contactInfo);
router.post("/", requireAdmin, contactController.createContact);
router.put("/:id", requireAdmin, contactController.updateContact);
router.delete("/:id", requireAdmin, contactController.deleteContact);

// Upload
router.post(
  "/upload",
  requireAdmin,
  upload.single("file"),
  (req: Request, res: Response) => {
    uploadContactController.uploadContact(req, res);
  },
);

export default router;
