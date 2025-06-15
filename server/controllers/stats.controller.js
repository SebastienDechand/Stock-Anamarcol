const ItemModel = require("../models/item.model");

// Global Statistics
exports.getNumberOfArticles = async (req, res) => {
  try {
    const numberOfArticles = await ItemModel.countDocuments();
    res.status(200).json({ numberOfArticles: `${numberOfArticles}` });
  } catch (error) {
    console.error("Erreur lors du calcul du nombre d'articles :", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
exports.getTotalStock = async (req, res) => {
  try {
    const totalStock = await ItemModel.aggregate([
      {
        $match: { quantite: { $exists: true } },
      },
      {
        $group: {
          _id: null,
          totalStock: {
            $sum: { $toInt: "$quantite" },
          },
        },
      },
    ]);
    res.status(200).json({ totalStock: `${totalStock[0].totalStock}` || 0 });
  } catch (error) {
    console.error("Erreur lors du calcul du stock total :", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
exports.getNumberOfSuppliers = async (req, res) => {
  try {
    const distinctSuppliers = await ItemModel.distinct("fournisseur");
    const numberOfSuppliers = distinctSuppliers.length;
    res.status(200).json({ numberOfSuppliers: `${numberOfSuppliers}` || 0 });
  } catch (error) {
    console.error("Erreur lors du calcul du nombre de fournisseurs :", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
exports.getNumberOfArticlesWithStockBelow5 = async (req, res) => {
  try {
    const numberOfLowStockArticles = await ItemModel.countDocuments({
      $expr: {
        $lt: [{ $toInt: "$quantite" }, 5],
      },
    });
    res
      .status(200)
      .json({ numberOfLowStockArticles: `${numberOfLowStockArticles}` || 0 });
  } catch (error) {
    console.error(
      "Erreur lors du calcul du nombre d'articles avec un stock inférieur à 5 :",
      error
    );
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getArticlesWithLowStock = async (req, res) => {
  try {
    const articlesWithLowStock = await ItemModel.find({
      $expr: {
        $lt: [{ $toInt: "$quantite" }, 5],
      },
    }).sort({ denomination: 1 });
    res.json(articlesWithLowStock);
  } catch (error) {
    console.error("Error fetching articles with low stock:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Fournisseurs
exports.getFournisseursList = async (req, res) => {
  try {
    const fournisseursList = await ItemModel.distinct("fournisseur");
    res.status(200).json({ fournisseursList });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de la liste des fournisseurs :",
      error
    );
    res.status(500).json({ message: "Internal Server Error" });
  }
};
exports.getStatisticsForFournisseur = async (req, res) => {
  try {
    const fournisseur = req.params.fournisseur;
    const numberOfArticles = await ItemModel.countDocuments({ fournisseur });
    const stockStatistics = await ItemModel.aggregate([
      {
        $match: { fournisseur, quantite: { $exists: true } },
      },
      {
        $group: {
          _id: null,
          totalStock: {
            $sum: { $toInt: "$quantite" },
          },
          numberOfLowStockArticles: {
            $sum: {
              $cond: [{ $lt: [{ $toInt: "$quantite" }, 5] }, 1, 0],
            },
          },
        },
      },
    ]);
    const fournisseurStats =
      stockStatistics.length > 0
        ? stockStatistics[0]
        : { totalStock: 0, numberOfLowStockArticles: 0 };
    // console.log(`Data for ${fournisseur}:`, { numberOfArticles, ...fournisseurStats });

    res.status(200).json({
      numberOfArticles: `${numberOfArticles}`,
      ...fournisseurStats,
    });
  } catch (error) {
    console.error(
      `Erreur lors du calcul des statistiques pour le fournisseur ${req.params.fournisseur} :`,
      error
    );
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// État
exports.getEtatsList = async (req, res) => {
  try {
    const etatsList = await ItemModel.distinct("etat");
    res.status(200).json({ etatsList });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de la liste des états :",
      error
    );
    res.status(500).json({ message: "Erreur interne du serveur" });
  }
};
exports.getStatisticsForEtat = async (req, res) => {
  try {
    const etat = req.params.etat;
    const numberOfArticles = await ItemModel.countDocuments({ etat });
    const stockStatistics = await ItemModel.aggregate([
      {
        $match: { etat, quantite: { $exists: true } },
      },
      {
        $group: {
          _id: null,
          totalStock: {
            $sum: { $toInt: "$quantite" },
          },
          numberOfLowStockArticles: {
            $sum: {
              $cond: [{ $lt: [{ $toInt: "$quantite" }, 5] }, 1, 0],
            },
          },
        },
      },
    ]);
    const etatStats =
      stockStatistics.length > 0
        ? stockStatistics[0]
        : { totalStock: 0, numberOfLowStockArticles: 0 };

    res.status(200).json({
      numberOfArticles: `${numberOfArticles}`,
      ...etatStats,
    });
  } catch (error) {
    console.error(
      `Erreur lors du calcul des statistiques pour l'état ${req.params.etat} :`,
      error
    );
    res.status(500).json({ message: "Internal Server Error" });
  }
};
