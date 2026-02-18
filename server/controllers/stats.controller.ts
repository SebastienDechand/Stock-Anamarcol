import { Request, Response } from "express";
import ItemModel from "../models/item.model";
import { LOW_STOCK_THRESHOLD } from "../constants";
import type { DashboardResult, LowStockItemResult } from "../types/stats";

// Simple in-memory cache (invalidated on each mutation)
let statsCache: DashboardResult | null = null;
let statsCacheTime = 0;
const CACHE_TTL = 30_000; // 30 seconds

const invalidateCache = (): void => {
  statsCache = null;
  statsCacheTime = 0;
};

// Unified endpoint: all stats in a single request
export const getDashboardStats = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const now = Date.now();
    if (statsCache && now - statsCacheTime < CACHE_TTL) {
      res.status(200).json(statsCache);
      return;
    }

    const [
      globalStats,
      fournisseursStats,
      etatsStats,
      lowStockItems,
      cgItems,
      tpvItems,
    ] = await Promise.all([
      ItemModel.aggregate([
        {
          $group: {
            _id: null,
            numberOfArticles: { $sum: 1 },
            totalStock: { $sum: "$quantite" },
            numberOfLowStockArticles: {
              $sum: { $cond: [{ $lt: ["$quantite", 5] }, 1, 0] },
            },
            fournisseurs: { $addToSet: "$fournisseur" },
          },
        },
      ]),
      ItemModel.aggregate([
        {
          $group: {
            _id: "$fournisseur",
            numberOfArticles: { $sum: 1 },
            totalStock: { $sum: "$quantite" },
            numberOfLowStockArticles: {
              $sum: { $cond: [{ $lt: ["$quantite", 5] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      ItemModel.aggregate([
        {
          $group: {
            _id: "$etat",
            numberOfArticles: { $sum: 1 },
            totalStock: { $sum: "$quantite" },
            numberOfLowStockArticles: {
              $sum: { $cond: [{ $lt: ["$quantite", 5] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      ItemModel.find({ quantite: { $lt: 5 } })
        .sort({ quantite: 1, denomination: 1 })
        .lean(),
      ItemModel.find({ prepaCG: true }).select("denomination quantite").lean(),
      ItemModel.find({ prepaTPV: true }).select("quantite").lean(),
    ]);

    const global = globalStats[0] || {
      numberOfArticles: 0,
      totalStock: 0,
      numberOfLowStockArticles: 0,
      fournisseurs: [],
    };

    // Complete CG prepa = min(qty) of each item, cassettes count qty/4
    const typedCgItems = cgItems as {
      denomination: string;
      quantite: number;
    }[];
    const completeCG =
      typedCgItems.length > 0
        ? Math.min(
            ...typedCgItems.map((item) => {
              const isCassette = item.denomination
                .toLowerCase()
                .includes("cassette");
              return isCassette ? Math.floor(item.quantite / 4) : item.quantite;
            }),
          )
        : 0;

    // Complete TPV prepa = min(qty) of each item (1 of each)
    const typedTpvItems = tpvItems as { quantite: number }[];
    const completeTPV =
      typedTpvItems.length > 0
        ? Math.min(...typedTpvItems.map((item) => item.quantite))
        : 0;

    const result: DashboardResult = {
      global: {
        numberOfArticles: global.numberOfArticles,
        totalStock: global.totalStock,
        numberOfSuppliers: global.fournisseurs.length,
        numberOfLowStockArticles: global.numberOfLowStockArticles,
        prepaCG: completeCG,
        prepaTPV: completeTPV,
      },
      fournisseurs: fournisseursStats.map((f: Record<string, unknown>) => ({
        nom: String(f._id),
        numberOfArticles: Number(f.numberOfArticles),
        totalStock: Number(f.totalStock),
        numberOfLowStockArticles: Number(f.numberOfLowStockArticles),
      })),
      etats: etatsStats.map((e: Record<string, unknown>) => ({
        nom: String(e._id),
        numberOfArticles: Number(e.numberOfArticles),
        totalStock: Number(e.totalStock),
        numberOfLowStockArticles: Number(e.numberOfLowStockArticles),
      })),
      lowStockItems: lowStockItems as unknown as LowStockItemResult[],
    };

    statsCache = result;
    statsCacheTime = now;

    res.status(200).json(result);
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const invalidateStatsCache = invalidateCache;

// === Legacy endpoints kept for backward compatibility ===

export const getNumberOfArticles = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const numberOfArticles = await ItemModel.countDocuments();
    res.status(200).json({ numberOfArticles });
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const getTotalStock = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const result = await ItemModel.aggregate([
      { $group: { _id: null, totalStock: { $sum: "$quantite" } } },
    ]);
    res.status(200).json({ totalStock: result[0]?.totalStock || 0 });
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const getNumberOfSuppliers = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const list = await ItemModel.distinct("fournisseur");
    res.status(200).json({ numberOfSuppliers: list.length });
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const getNumberOfArticlesWithStockBelow5 = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const count = await ItemModel.countDocuments({ quantite: { $lt: 5 } });
    res.status(200).json({ numberOfLowStockArticles: count });
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const getArticlesWithLowStock = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const articles = await ItemModel.find({ quantite: { $lt: 5 } })
      .sort({ quantite: 1, denomination: 1 })
      .lean();
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const getFournisseursList = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const fournisseursList = await ItemModel.distinct("fournisseur");
    res.status(200).json({ fournisseursList });
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const getStatisticsForFournisseur = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const fournisseur = req.params.fournisseur;
    const [count, stats] = await Promise.all([
      ItemModel.countDocuments({ fournisseur }),
      ItemModel.aggregate([
        { $match: { fournisseur } },
        {
          $group: {
            _id: null,
            totalStock: { $sum: "$quantite" },
            numberOfLowStockArticles: {
              $sum: { $cond: [{ $lt: ["$quantite", 5] }, 1, 0] },
            },
          },
        },
      ]),
    ]);
    const s = stats[0] || { totalStock: 0, numberOfLowStockArticles: 0 };
    res.status(200).json({ numberOfArticles: count, ...s });
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const getEtatsList = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const etatsList = await ItemModel.distinct("etat");
    res.status(200).json({ etatsList });
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const getStatisticsForEtat = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const etat = req.params.etat;
    const [count, stats] = await Promise.all([
      ItemModel.countDocuments({ etat }),
      ItemModel.aggregate([
        { $match: { etat } },
        {
          $group: {
            _id: null,
            totalStock: { $sum: "$quantite" },
            numberOfLowStockArticles: {
              $sum: { $cond: [{ $lt: ["$quantite", 5] }, 1, 0] },
            },
          },
        },
      ]),
    ]);
    const s = stats[0] || { totalStock: 0, numberOfLowStockArticles: 0 };
    res.status(200).json({ numberOfArticles: count, ...s });
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};
