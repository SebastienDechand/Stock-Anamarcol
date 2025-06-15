const router = require("express").Router();
const contactController = require("../controllers/contacts.controller");
const uploadContactController = require("../controllers/uploadContact.controller");
const multer = require("multer");
const upload = multer();

router.get("/", contactController.getContacts);
router.get("/:id", contactController.contactInfo);
router.post("/", contactController.createContact);
router.put("/:id", contactController.updateContact);
router.delete("/:id", contactController.deleteContact);

// Upload
router.post("/upload", upload.single("file"), (req, res) => {
  uploadContactController.uploadContact(req, res);
});

module.exports = router;
