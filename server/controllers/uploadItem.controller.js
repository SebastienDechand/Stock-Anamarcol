const ItemModel = require("../models/item.model");
const fs = require("fs");
const { promisify } = require("util");
const { uploadErrors } = require("../errors.utils");
const stream = require("stream");
const pipeline = promisify(stream.pipeline);
const path = require("path");

module.exports.uploadItem = async (req, res) => {
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
    return res.status(400).json({ errors });
  }

  const fileName =
    req.body.denomination + req.body.fournisseur + req.body.etat + ".jpg";
  const filePath = path.join(
    __dirname,
    `/../../client/public/uploads/items/${fileName}`
  );

  try {
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    await pipeline(bufferStream, fs.createWriteStream(filePath));

    const updatedItem = await ItemModel.findByIdAndUpdate(
      req.body.itemId,
      { $set: { image: `/uploads/items/${fileName}` } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json(updatedItem);
  } catch (err) {
    console.error("File upload or database update error:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
