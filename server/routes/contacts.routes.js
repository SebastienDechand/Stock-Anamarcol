const router = require("express").Router();
const contactController = require("../controllers/contacts.controller");
const uploadContactController = require("../controllers/uploadContact.controller");
const { requireAuth, requireAdmin } = require("../middleware/auth.middleware");
const multer = require("multer");
const upload = multer();

router.get("/", requireAuth, contactController.getContacts);
router.get("/:id", requireAuth, contactController.contactInfo);
router.post("/", requireAdmin, contactController.createContact);
router.put("/:id", requireAdmin, contactController.updateContact);
router.delete("/:id", requireAdmin, contactController.deleteContact);

// Upload
router.post("/upload", requireAdmin, upload.single("file"), (req, res) => {
  uploadContactController.uploadContact(req, res);
});

module.exports = router;
