const ItemModel = require("../models/item.model");
const { createItemErrors } = require("../errors.utils");
const ObjectID = require("mongoose").Types.ObjectId;

module.exports.itemInfo = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).json({ message: "ID invalide" });

  try {
    const item = await ItemModel.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ message: "Article introuvable" });
    res.status(200).json(item);
  } catch (err) {
    console.error("Error fetching item:", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

// Lecture paginée avec filtres côté serveur
module.exports.readItem = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      fournisseur = "",
      etat = "",
      lowStock,
      sortBy = "denomination",
      sortOrder = "asc",
    } = req.query;

    const filter = {};

    if (search) {
      filter.denomination = { $regex: search, $options: "i" };
    }
    if (fournisseur) {
      filter.fournisseur = { $in: fournisseur.split(",") };
    }
    if (etat) {
      filter.etat = { $in: etat.split(",") };
    }
    if (lowStock === "true") {
      filter.quantite = { $lt: 5 };
    }

    const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [items, total] = await Promise.all([
      ItemModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ItemModel.countDocuments(filter),
    ]);

    res.status(200).json({
      items,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error("Error fetching items:", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

module.exports.createItem = async (req, res) => {
  const { denomination, quantite, fournisseur, etat, posterId, modifierName } =
    req.body;
  try {
    const item = await ItemModel.create({
      denomination,
      fournisseur,
      etat,
      quantite: parseInt(quantite, 10) || 0,
      posterId,
      modifierName,
    });

    return res.status(201).json({ item });
  } catch (err) {
    const errors = createItemErrors(err);
    return res.status(400).json({ errors });
  }
};

module.exports.updateItem = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send("ID Unknown : " + req.params.id);

  try {
    const item = await ItemModel.findById(req.params.id);

    if (!item) {
      return res.status(404).send("Item not found");
    }

    if (req.body.denomination) item.denomination = req.body.denomination;
    if (req.body.fournisseur) item.fournisseur = req.body.fournisseur;
    if (req.body.etat) item.etat = req.body.etat;

    if (req.body.hasOwnProperty("quantite")) {
      item.quantite = req.body.quantite < 0 ? 0 : req.body.quantite;
    }

    if (req.body.image) item.image = req.body.image;
    if (req.body.modifierName) item.modifierName = req.body.modifierName;

    const updatedItem = await item.save();

    return res.status(200).json({ item: updatedItem });
  } catch (err) {
    console.error("Error updating item:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal Server Error" });
  }
};

module.exports.deleteItem = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send("ID Unknown : " + req.params.id);

  try {
    await ItemModel.deleteOne({ _id: req.params.id }).exec();
    res.status(200).json({ message: "Sucessfully deleted." });
  } catch (err) {
    console.error("Error deleting item:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal Server Error" });
  }
};
