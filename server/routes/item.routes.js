const router = require("express").Router();
const itemController = require("../controllers/item.controller");
const uploadItemController = require("../controllers/uploadItem.controller");
const multer = require("multer");
const upload = multer();

router.get("/", itemController.readItem);
router.get("/:id", itemController.itemInfo);
router.post("/", itemController.createItem);
router.put("/:id", itemController.updateItem);
router.delete("/:id", itemController.deleteItem);

// Upload
router.post("/upload", upload.single("file"), (req, res) => {
  uploadItemController.uploadItem(req, res);
});

module.exports = router;
