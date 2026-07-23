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

// Paginated read with server-side filters
export const readItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      supplier = "",
      status = "",
      lowStock,
      cgKit,
      tpvKit,
      sortBy = "name",
      sortOrder = "asc",
    } = req.query;

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }
    if (supplier) {
      filter.supplier = { $in: (supplier as string).split(",") };
    }
    if (status) {
      filter.status = { $in: (status as string).split(",") };
    }
    if (lowStock === "true") {
      filter.quantity = { $lt: 5 };
    }
    if (cgKit === "true") {
      filter.cgKit = true;
    }
    if (tpvKit === "true") {
      filter.tpvKit = true;
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

    // If a prepa filter is active, check if decrement is possible
    const prepaFields: string[] = [];
    if (cgKit === "true") prepaFields.push("cgKit");
    if (tpvKit === "true") prepaFields.push("tpvKit");

    if (prepaFields.length > 0) {
      for (const field of prepaFields) {
        // An item blocks decrement if qty=0, or for CG+cassette if qty<4
        queries.push(
          ItemModel.countDocuments({
            [field]: true,
            $or: [
              { quantity: { $lte: 0 } },
              ...(field === "cgKit"
                ? [
                    {
                      name: { $regex: /cassette/i },
                      quantity: { $lt: 4 },
                    },
                  ]
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
    name,
    quantity,
    supplier,
    status,
    posterId,
    modifierName,
    cgKit,
    tpvKit,
  } = req.body;
  try {
    const item = await ItemModel.create({
      name,
      supplier,
      status,
      quantity: parseInt(quantity, 10) || 0,
      posterId,
      modifierName,
      cgKit: cgKit || false,
      tpvKit: tpvKit || false,
    });

    try {
      logItemCreate(
        String(item._id),
        res.locals.user?.username || modifierName || "Inconnu",
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
    const oldItem: Record<string, unknown> =
      typeof item.toObject === "function"
        ? (item.toObject() as unknown as Record<string, unknown>)
        : { ...item };

    if (req.body.name) item.name = req.body.name;
    if (req.body.supplier) item.supplier = req.body.supplier;
    if (req.body.status) item.status = req.body.status;

    if (Object.prototype.hasOwnProperty.call(req.body, "quantity")) {
      item.quantity = req.body.quantity < 0 ? 0 : req.body.quantity;
    }

    if (req.body.image) item.image = req.body.image;
    if (req.body.modifierName) item.modifierName = req.body.modifierName;

    if (Object.prototype.hasOwnProperty.call(req.body, "cgKit")) {
      item.cgKit = req.body.cgKit;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "tpvKit")) {
      item.tpvKit = req.body.tpvKit;
    }

    const updatedItem = await item.save();

    try {
      logItemChanges(
        req.params.id as string,
        oldItem,
        req.body,
        res.locals.user?.username ||
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
    let item: Record<string, unknown> | undefined = undefined;
    if (maybeQuery) {
      if (typeof maybeQuery.lean === "function") {
        item = (await maybeQuery.lean()) as unknown as Record<string, unknown>;
      } else if (
        typeof (maybeQuery as { then?: unknown }).then === "function"
      ) {
        item = (await maybeQuery) as unknown as Record<string, unknown>;
      }
    }

    await ItemModel.deleteOne({ _id: req.params.id }).exec();

    if (item) {
      try {
        logItemDelete(
          req.params.id as string,
          String(item.name ?? ""),
          res.locals.user?.username || "Admin",
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

// Batch operation on a prepa set: +1/-1 on all items (CG: cassettes = -4/+4)
export const prepaBatch = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const {
    prepa,
    operation,
    count: rawCount,
  } = req.body as {
    prepa?: string;
    operation?: string;
    count?: number;
  };
  // count only for increment (restocking)
  const count =
    operation === "increment"
      ? Math.max(1, Math.floor(Number(rawCount) || 1))
      : 1;

  if (!prepa || !["cgKit", "tpvKit"].includes(prepa)) {
    res.status(400).json({ message: "Prépa invalide" });
    return;
  }
  if (!operation || !["increment", "decrement"].includes(operation)) {
    res.status(400).json({ message: "Opération invalide" });
    return;
  }

  try {
    const items = await ItemModel.find({ [prepa]: true });
    const userName = res.locals.user?.username || "Admin";
    let updated = 0;

    for (const item of items) {
      const oldQty = item.quantity;

      // For CG: cassettes change by 4, the rest by 1 - multiplied by count
      let delta = 1 * count;
      if (prepa === "cgKit" && item.name.toLowerCase().includes("cassette")) {
        delta = 4 * count;
      }

      const newQty =
        operation === "increment"
          ? oldQty + delta
          : Math.max(0, oldQty - delta);

      if (newQty !== oldQty) {
        item.quantity = newQty;
        await item.save();

        logItemChanges(
          String(item._id),
          { ...item.toObject(), quantity: oldQty },
          { quantity: newQty },
          userName,
        );
        updated++;
      }
    }

    const prepaLabel = prepa === "cgKit" ? "CashGuard" : "Caisse TPV";
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
