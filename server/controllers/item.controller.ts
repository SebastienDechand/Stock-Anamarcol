import { Request, Response } from "express";
import ItemModel from "../models/item.model";
import { createItemErrors } from "../errors.utils";
import { validateObjectId } from "../utils/validate.utils";

export const itemInfo = async (req: Request, res: Response): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    const item = await ItemModel.findById(req.params.id).lean();
    if (!item) {
      res.status(404).json({ message: "Article introuvable" });
      return;
    }
    res.status(200).json(item);
  } catch (err) {
    console.error("Error fetching item:", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

// Lecture paginée avec filtres côté serveur
export const readItem = async (req: Request, res: Response): Promise<void> => {
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

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.denomination = { $regex: search, $options: "i" };
    }
    if (fournisseur) {
      filter.fournisseur = { $in: (fournisseur as string).split(",") };
    }
    if (etat) {
      filter.etat = { $in: (etat as string).split(",") };
    }
    if (lowStock === "true") {
      filter.quantite = { $lt: 5 };
    }

    const sort: Record<string, 1 | -1> = {
      [sortBy as string]: sortOrder === "desc" ? -1 : 1,
    };
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [items, total] = await Promise.all([
      ItemModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit as string))
        .lean(),
      ItemModel.countDocuments(filter),
    ]);

    res.status(200).json({
      items,
      total,
      page: parseInt(page as string),
      totalPages: Math.ceil(total / parseInt(limit as string)),
    });
  } catch (err) {
    console.error("Error fetching items:", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const createItem = async (
  req: Request,
  res: Response,
): Promise<void> => {
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

    res.status(201).json({ item });
  } catch (err) {
    const errors = createItemErrors(err as Error);
    res.status(400).json({ errors });
  }
};

export const updateItem = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    const item = await ItemModel.findById(req.params.id);

    if (!item) {
      res.status(404).json({ message: "Article introuvable" });
      return;
    }

    if (req.body.denomination) item.denomination = req.body.denomination;
    if (req.body.fournisseur) item.fournisseur = req.body.fournisseur;
    if (req.body.etat) item.etat = req.body.etat;

    if (Object.prototype.hasOwnProperty.call(req.body, "quantite")) {
      item.quantite = req.body.quantite < 0 ? 0 : req.body.quantite;
    }

    if (req.body.image) item.image = req.body.image;
    if (req.body.modifierName) item.modifierName = req.body.modifierName;

    const updatedItem = await item.save();
    res.status(200).json({ item: updatedItem });
  } catch (err) {
    console.error("Error updating item:", err);
    res
      .status(500)
      .json({ message: (err as Error).message || "Internal Server Error" });
  }
};

export const deleteItem = async (
  req: Request,
  res: Response,
): Promise<void> => {
  if (!validateObjectId(req.params.id as string, res)) return;

  try {
    await ItemModel.deleteOne({ _id: req.params.id }).exec();
    res.status(200).json({ message: "Sucessfully deleted." });
  } catch (err) {
    console.error("Error deleting item:", err);
    res
      .status(500)
      .json({ message: (err as Error).message || "Internal Server Error" });
  }
};
