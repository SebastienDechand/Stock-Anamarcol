const router = require("express").Router();
const itemController = require("../controllers/item.controller");
const uploadItemController = require("../controllers/uploadItem.controller");
const { requireAuth, requireAdmin } = require("../middleware/auth.middleware");
const multer = require("multer");
const upload = multer();

router.get("/", requireAuth, itemController.readItem);
router.get("/:id", requireAuth, itemController.itemInfo);
router.post("/", requireAuth, itemController.createItem);
router.put("/:id", requireAuth, itemController.updateItem);
router.delete("/:id", requireAdmin, itemController.deleteItem);

// Upload
router.post("/upload", requireAuth, upload.single("file"), (req, res) => {
  uploadItemController.uploadItem(req, res);
});

module.exports = router;
