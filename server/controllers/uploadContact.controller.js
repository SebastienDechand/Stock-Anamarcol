const ContactModel = require("../models/contact.model");
const fs = require("fs");
const { promisify } = require("util");
const { uploadErrors } = require("../errors.utils");
const stream = require("stream");
const pipeline = promisify(stream.pipeline);
const path = require("path");

module.exports.uploadContact = async (req, res) => {
  try {
    if (
      req.file.mimetype !== "image/jpg" &&
      req.file.mimetype !== "image/png" &&
      req.file.mimetype !== "image/jpeg"
    ) {
      throw new Error("Invalid file");
    }

    if (req.file.size > 2500000) {
      throw new Error("Max size");
    }
  } catch (err) {
    const errors = uploadErrors(err, req.file.mimetype);
    return res.status(400).json(errors);
  }

  const fileName = req.body.nom + ".jpg";
  const filePath = path.join(
    __dirname,
    `/../../client/public/uploads/contacts/${fileName}`
  );

  try {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    await pipeline(bufferStream, fs.createWriteStream(filePath));

    const updatedContact = await ContactModel.findByIdAndUpdate(
      req.body.contactId,
      { $set: { picture: `/uploads/contacts/${fileName}` } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json(updatedContact);
  } catch (err) {
    console.error("File upload or database update error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
