import { Request, Response } from "express";
import ItemModel from "../models/item.model";
import { createItemErrors } from "../errors.utils";
import { validateObjectId } from "../utils/validate.utils";
import {
  logItemCreate,
  logItemChanges,
  logItemDelete,
} from "../utils/history.utils";
import { logEvent } from "../utils/audit.utils";
import { invalidateStatsCache } from "./stats.controller";

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
      prepaCG,
      prepaTPV,
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
    if (prepaCG === "true") {
      filter.prepaCG = true;
    }
    if (prepaTPV === "true") {
      filter.prepaTPV = true;
    }

    const sort: Record<string, 1 | -1> = {
      [sortBy as string]: sortOrder === "desc" ? -1 : 1,
    };
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const queries: Promise<unknown>[] = [
      ItemModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit as string))
        .lean(),
      ItemModel.countDocuments(filter),
    ];

    // Si un filtre prépa est actif, vérifier si le decrement est possible
    const prepaFields: string[] = [];
    if (prepaCG === "true") prepaFields.push("prepaCG");
    if (prepaTPV === "true") prepaFields.push("prepaTPV");

    if (prepaFields.length > 0) {
      for (const field of prepaFields) {
        // Un item bloque le decrement s'il a qty=0, ou pour CG+cassette si qty<4
        queries.push(
          ItemModel.countDocuments({
            [field]: true,
            $or: [
              { quantite: { $lte: 0 } },
              ...(field === "prepaCG"
                ? [{ denomination: { $regex: /cassette/i }, quantite: { $lt: 4 } }]
                : []),
            ],
          }),
        );
      }
    }

    const results = await Promise.all(queries);
    const items = results[0];
    const totalCount = results[1] as number;

    const response: Record<string, unknown> = {
      items,
      total: totalCount,
      page: parseInt(page as string),
      totalPages: Math.ceil(totalCount / parseInt(limit as string)),
    };

    if (prepaFields.length > 0) {
      const canDecrement: Record<string, boolean> = {};
      prepaFields.forEach((field, i) => {
        canDecrement[field] = (results[2 + i] as number) === 0;
      });
      response.canDecrement = canDecrement;
    }

    res.status(200).json(response);
  } catch (err) {
    console.error("Error fetching items:", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const createItem = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const {
    denomination,
    quantite,
    fournisseur,
    etat,
    posterId,
    modifierName,
    prepaCG,
    prepaTPV,
  } = req.body;
  try {
    const item = await ItemModel.create({
      denomination,
      fournisseur,
      etat,
      quantite: parseInt(quantite, 10) || 0,
      posterId,
      modifierName,
      prepaCG: prepaCG || false,
      prepaTPV: prepaTPV || false,
    });

    try {
      logItemCreate(
        String(item._id),
        res.locals.user?.pseudo || modifierName || "Inconnu",
      );
    } catch (err) {
      console.error("logItemCreate error:", err);
    }

    invalidateStatsCache();
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

    // Snapshot old values before mutation (guard for mocked objects)
    const oldItem =
      typeof (item as any).toObject === "function"
        ? (item as any).toObject()
        : { ...(item as any) };

    if (req.body.denomination) item.denomination = req.body.denomination;
    if (req.body.fournisseur) item.fournisseur = req.body.fournisseur;
    if (req.body.etat) item.etat = req.body.etat;

    if (Object.prototype.hasOwnProperty.call(req.body, "quantite")) {
      item.quantite = req.body.quantite < 0 ? 0 : req.body.quantite;
    }

    if (req.body.image) item.image = req.body.image;
    if (req.body.modifierName) item.modifierName = req.body.modifierName;

    if (Object.prototype.hasOwnProperty.call(req.body, "prepaCG")) {
      item.prepaCG = req.body.prepaCG;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "prepaTPV")) {
      item.prepaTPV = req.body.prepaTPV;
    }

    const updatedItem = await item.save();

    try {
      logItemChanges(
        req.params.id as string,
        oldItem,
        req.body,
        res.locals.user?.pseudo ||
          req.body.modifierName ||
          oldItem.modifierName ||
          "Inconnu",
      );
    } catch (err) {
      console.error("logItemChanges error:", err);
    }

    invalidateStatsCache();
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
    const maybeQuery = ItemModel.findById(req.params.id as string);
    let item: any = undefined;
    if (maybeQuery) {
      if (typeof (maybeQuery as any).lean === "function") {
        item = await (maybeQuery as any).lean();
      } else if (typeof (maybeQuery as any).then === "function") {
        item = await maybeQuery;
      }
    }

    await ItemModel.deleteOne({ _id: req.params.id }).exec();

    if (item) {
      try {
        logItemDelete(
          req.params.id as string,
          item.denomination,
          res.locals.user?.pseudo || "Admin",
        );
      } catch (err) {
        console.error("logItemDelete error:", err);
      }
    }

    invalidateStatsCache();
    res.status(200).json({ message: "Sucessfully deleted." });
  } catch (err) {
    console.error("Error deleting item:", err);
    res
      .status(500)
      .json({ message: (err as Error).message || "Internal Server Error" });
  }
};

// Opération batch sur une prépa : +1/-1 sur tous les articles (CG : cassettes HV = -4/+4)
export const prepaBatch = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { prepa, operation, count: rawCount } = req.body as {
    prepa?: string;
    operation?: string;
    count?: number;
  };
  // count uniquement pour l'increment (remise en stock)
  const count = operation === "increment" ? Math.max(1, Math.floor(Number(rawCount) || 1)) : 1;

  if (!prepa || !["prepaCG", "prepaTPV"].includes(prepa)) {
    res.status(400).json({ message: "Prépa invalide" });
    return;
  }
  if (!operation || !["increment", "decrement"].includes(operation)) {
    res.status(400).json({ message: "Opération invalide" });
    return;
  }

  try {
    const items = await ItemModel.find({ [prepa]: true });
    const userName = res.locals.user?.pseudo || "Admin";
    let updated = 0;

    for (const item of items) {
      const oldQty = item.quantite;

      // Pour CG : les cassettes HV changent de 4, le reste de 1 — multiplié par count
      let delta = 1 * count;
      if (
        prepa === "prepaCG" &&
        item.denomination.toLowerCase().includes("cassette")
      ) {
        delta = 4 * count;
      }

      const newQty =
        operation === "increment"
          ? oldQty + delta
          : Math.max(0, oldQty - delta);

      if (newQty !== oldQty) {
        item.quantite = newQty;
        await item.save();

        logItemChanges(
          String(item._id),
          { ...item.toObject(), quantite: oldQty } as any,
          { quantite: newQty },
          userName,
        );
        updated++;
      }
    }

    const prepaLabel = prepa === "prepaCG" ? "CashGuard" : "Caisse TPV";
    await logEvent("update", "item", undefined, userName, {
      batch: true,
      prepa: prepaLabel,
      operation,
      count: updated,
    });

    invalidateStatsCache();
    res
      .status(200)
      .json({ message: `${updated} articles mis à jour`, updated });
  } catch (err) {
    console.error("Error in prepa batch:", err);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};
