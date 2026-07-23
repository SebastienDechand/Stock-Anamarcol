import { Router, Request, Response } from "express";
import * as itemController from "../controllers/item.controller";
import * as historyController from "../controllers/history.controller";
import * as uploadItemController from "../controllers/uploadItem.controller";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";
import { imageUpload } from "../utils/upload.utils";

const router = Router();

router.get("/", requireAuth, itemController.readItem);
router.get("/history/:id", requireAuth, historyController.getItemHistory);
router.get("/:id", requireAuth, itemController.itemInfo);
router.post("/", requireAuth, itemController.createItem);
router.post("/prepa-batch", requireAuth, itemController.prepaBatch);
router.put("/:id", requireAuth, itemController.updateItem);
router.delete("/:id", requireAdmin, itemController.deleteItem);

// Upload
router.post(
  "/upload",
  requireAuth,
  imageUpload.single("file"),
  (req: Request, res: Response) => {
    uploadItemController.uploadItem(req, res);
  },
);

export default router;
