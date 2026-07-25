import { Router, Request, Response } from "express";
import * as contactController from "../controllers/contacts/contacts.controller";
import * as uploadContactController from "../controllers/uploadContact/uploadContact.controller";
import { requireAuth, requireAdmin } from "../middleware/auth/auth.middleware";
import { imageUpload } from "../utils/upload/upload.utils";

const router = Router();

router.get("/", requireAuth, contactController.getContacts);
router.get("/:id", requireAuth, contactController.contactInfo);
router.post("/", requireAdmin, contactController.createContact);
router.put("/:id", requireAdmin, contactController.updateContact);
router.delete("/:id", requireAdmin, contactController.deleteContact);

// Upload
router.post(
  "/upload",
  requireAdmin,
  imageUpload.single("file"),
  (req: Request, res: Response) => {
    uploadContactController.uploadContact(req, res);
  },
);

export default router;
