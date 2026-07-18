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
      suppliersStats,
      statusesStats,
      lowStockItems,
      cgItems,
      tpvItems,
    ] = await Promise.all([
      ItemModel.aggregate([
        {
          $group: {
            _id: null,
            numberOfArticles: { $sum: 1 },
            totalStock: { $sum: "$quantity" },
            numberOfLowStockArticles: {
              $sum: { $cond: [{ $lt: ["$quantity", 5] }, 1, 0] },
            },
            suppliers: { $addToSet: "$supplier" },
          },
        },
      ]),
      ItemModel.aggregate([
        {
          $group: {
            _id: "$supplier",
            numberOfArticles: { $sum: 1 },
            totalStock: { $sum: "$quantity" },
            numberOfLowStockArticles: {
              $sum: { $cond: [{ $lt: ["$quantity", 5] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      ItemModel.aggregate([
        {
          $group: {
            _id: "$status",
            numberOfArticles: { $sum: 1 },
            totalStock: { $sum: "$quantity" },
            numberOfLowStockArticles: {
              $sum: { $cond: [{ $lt: ["$quantity", 5] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      ItemModel.find({ quantity: { $lt: 5 } })
        .sort({ quantity: 1, name: 1 })
        .lean(),
      ItemModel.find({ cgKit: true }).select("name quantity").lean(),
      ItemModel.find({ tpvKit: true }).select("quantity").lean(),
    ]);

    const global = globalStats[0] || {
      numberOfArticles: 0,
      totalStock: 0,
      numberOfLowStockArticles: 0,
      suppliers: [],
    };

    // Complete CG prepa = min(qty) of each item, cassettes count qty/4
    const typedCgItems = cgItems as {
      name: string;
      quantity: number;
    }[];
    const completeCG =
      typedCgItems.length > 0
        ? Math.min(
            ...typedCgItems.map((item) => {
              const isCassette = item.name
                .toLowerCase()
                .includes("cassette");
              return isCassette ? Math.floor(item.quantity / 4) : item.quantity;
            }),
          )
        : 0;

    // Complete TPV prepa = min(qty) of each item (1 of each)
    const typedTpvItems = tpvItems as { quantity: number }[];
    const completeTPV =
      typedTpvItems.length > 0
        ? Math.min(...typedTpvItems.map((item) => item.quantity))
        : 0;

    const result: DashboardResult = {
      global: {
        numberOfArticles: global.numberOfArticles,
        totalStock: global.totalStock,
        numberOfSuppliers: global.suppliers.length,
        numberOfLowStockArticles: global.numberOfLowStockArticles,
        cgKit: completeCG,
        tpvKit: completeTPV,
      },
      suppliers: suppliersStats.map((f: Record<string, unknown>) => ({
        name: String(f._id),
        numberOfArticles: Number(f.numberOfArticles),
        totalStock: Number(f.totalStock),
        numberOfLowStockArticles: Number(f.numberOfLowStockArticles),
      })),
      statuses: statusesStats.map((e: Record<string, unknown>) => ({
        name: String(e._id),
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
      { $group: { _id: null, totalStock: { $sum: "$quantity" } } },
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
    const list = await ItemModel.distinct("supplier");
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
    const count = await ItemModel.countDocuments({ quantity: { $lt: 5 } });
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
    const articles = await ItemModel.find({ quantity: { $lt: 5 } })
      .sort({ quantity: 1, name: 1 })
      .lean();
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const getSuppliersList = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const suppliersList = await ItemModel.distinct("supplier");
    res.status(200).json({ suppliersList });
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const getStatisticsForSupplier = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const supplier = req.params.supplier;
    const [count, stats] = await Promise.all([
      ItemModel.countDocuments({ supplier }),
      ItemModel.aggregate([
        { $match: { supplier } },
        {
          $group: {
            _id: null,
            totalStock: { $sum: "$quantity" },
            numberOfLowStockArticles: {
              $sum: { $cond: [{ $lt: ["$quantity", 5] }, 1, 0] },
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

export const getStatusesList = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const statusesList = await ItemModel.distinct("status");
    res.status(200).json({ statusesList });
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

export const getStatisticsForStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const status = req.params.status;
    const [count, stats] = await Promise.all([
      ItemModel.countDocuments({ status }),
      ItemModel.aggregate([
        { $match: { status } },
        {
          $group: {
            _id: null,
            totalStock: { $sum: "$quantity" },
            numberOfLowStockArticles: {
              $sum: { $cond: [{ $lt: ["$quantity", 5] }, 1, 0] },
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
