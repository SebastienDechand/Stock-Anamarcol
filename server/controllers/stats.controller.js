const ItemModel = require("../models/item.model");

// Cache simple en mémoire (invalidé à chaque mutation)
let statsCache = null;
let statsCacheTime = 0;
const CACHE_TTL = 30000; // 30 secondes

const invalidateCache = () => {
  statsCache = null;
  statsCacheTime = 0;
};

// Endpoint unifié : toutes les stats en 1 seule requête (4 agrégations parallèles au lieu de 6+ séquentielles)
exports.getDashboardStats = async (req, res) => {
  try {
    const now = Date.now();
    if (statsCache && now - statsCacheTime < CACHE_TTL) {
      return res.status(200).json(statsCache);
    }

    const [globalStats, fournisseursStats, etatsStats, lowStockItems] =
      await Promise.all([
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
      ]);

    const global = globalStats[0] || {
      numberOfArticles: 0,
      totalStock: 0,
      numberOfLowStockArticles: 0,
      fournisseurs: [],
    };

    const result = {
      global: {
        numberOfArticles: global.numberOfArticles,
        totalStock: global.totalStock,
        numberOfSuppliers: global.fournisseurs.length,
        numberOfLowStockArticles: global.numberOfLowStockArticles,
      },
      fournisseurs: fournisseursStats.map((f) => ({
        nom: f._id,
        numberOfArticles: f.numberOfArticles,
        totalStock: f.totalStock,
        numberOfLowStockArticles: f.numberOfLowStockArticles,
      })),
      etats: etatsStats.map((e) => ({
        nom: e._id,
        numberOfArticles: e.numberOfArticles,
        totalStock: e.totalStock,
        numberOfLowStockArticles: e.numberOfLowStockArticles,
      })),
      lowStockItems,
    };

    statsCache = result;
    statsCacheTime = now;

    res.status(200).json(result);
  } catch (error) {
    console.error("Erreur stats dashboard:", error);
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

exports.invalidateStatsCache = invalidateCache;

// === Anciens endpoints conservés pour rétrocompatibilité ===

exports.getNumberOfArticles = async (req, res) => {
  try {
    const numberOfArticles = await ItemModel.countDocuments();
    res.status(200).json({ numberOfArticles });
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

exports.getTotalStock = async (req, res) => {
  try {
    const result = await ItemModel.aggregate([
      { $group: { _id: null, totalStock: { $sum: "$quantite" } } },
    ]);
    res.status(200).json({ totalStock: result[0]?.totalStock || 0 });
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

exports.getNumberOfSuppliers = async (req, res) => {
  try {
    const list = await ItemModel.distinct("fournisseur");
    res.status(200).json({ numberOfSuppliers: list.length });
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

exports.getNumberOfArticlesWithStockBelow5 = async (req, res) => {
  try {
    const count = await ItemModel.countDocuments({ quantite: { $lt: 5 } });
    res.status(200).json({ numberOfLowStockArticles: count });
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

exports.getArticlesWithLowStock = async (req, res) => {
  try {
    const articles = await ItemModel.find({ quantite: { $lt: 5 } })
      .sort({ quantite: 1, denomination: 1 })
      .lean();
    res.json(articles);
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

exports.getFournisseursList = async (req, res) => {
  try {
    const fournisseursList = await ItemModel.distinct("fournisseur");
    res.status(200).json({ fournisseursList });
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

exports.getStatisticsForFournisseur = async (req, res) => {
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

exports.getEtatsList = async (req, res) => {
  try {
    const etatsList = await ItemModel.distinct("etat");
    res.status(200).json({ etatsList });
  } catch (error) {
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};

exports.getStatisticsForEtat = async (req, res) => {
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
