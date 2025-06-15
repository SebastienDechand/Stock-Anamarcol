const ContactModel = require("../models/contact.model");
const ObjectID = require("mongoose").Types.ObjectId;

module.exports.getContacts = async (req, res) => {
  const contacts = await ContactModel.find();
  res.status(200).json(contacts);
};

module.exports.contactInfo = (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send("ID Unknown : " + req.params.id);

  ContactModel.findById(req.params.id)
    .then((docs) => {
      if (!docs) {
        res.status(404).send("Contact not found");
      } else {
        res.send(docs);
      }
    })
    .catch((err) => {
      console.error("ID Unknown : " + err);
      res.status(500).send("Internal Server Error");
    });
};

module.exports.createContact = async (req, res) => {
  console.log(req.body);
  const { nom, email, lien, poste, tel } = req.body;

  try {
    const contact = await ContactModel.create({ nom, email, lien, poste, tel });
    res.status(200).json({ contact: contact._id });
  } catch (err) {
    res.status(201).send(err);
  }
};

module.exports.updateContact = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send("ID Unknown : " + req.params.id);

  try {
    const contact = await ContactModel.findById(req.params.id);

    if (!contact) {
      return res.status(404).send("Contact not found");
    }

    // Mettre à jour les champs individuellement en respectant les middlewares
    if (req.body.nom) contact.nom = req.body.nom;
    if (req.body.email) contact.email = req.body.email;
    if (req.body.lien) contact.lien = req.body.lien;
    if (req.body.poste) contact.poste = req.body.poste;
    if (req.body.tel) contact.tel = req.body.tel;
    if (req.body.picture) contact.picture = req.body.picture;

    const updatedContact = await contact.save();

    return res.send(updatedContact);
  } catch (err) {
    console.error("Error updating contact:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal Server Error" });
  }
};

module.exports.deleteContact = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send("ID Unknown : " + req.params.id);

  try {
    await ContactModel.deleteOne({ _id: req.params.id }).exec();
    res.status(200).json({ message: "Sucessfully deleted." });
  } catch (err) {
    console.error("Error deleting contact:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal Server Error" });
  }
};
