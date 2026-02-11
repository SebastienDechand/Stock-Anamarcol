const jwt = require("jsonwebtoken");
const UserModel = require("../models/user.model");

// Vérifie si l'utilisateur est connecté (non bloquant)
module.exports.checkUser = (req, res, next) => {
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, process.env.TOKEN_SECRET, async (err, decodedToken) => {
      if (err) {
        res.locals.user = null;
        next();
      } else {
        let user = await UserModel.findById(decodedToken.id)
          .select("-password")
          .lean();
        res.locals.user = user;
        next();
      }
    });
  } else {
    res.locals.user = null;
    next();
  }
};

// Authentification requise (bloquant - renvoie 401)
module.exports.requireAuth = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(401).json({ message: "Authentification requise" });
  }

  jwt.verify(token, process.env.TOKEN_SECRET, async (err, decodedToken) => {
    if (err) {
      return res.status(401).json({ message: "Token invalide ou expiré" });
    }

    const user = await UserModel.findById(decodedToken.id)
      .select("-password")
      .lean();
    if (!user) {
      return res.status(401).json({ message: "Utilisateur introuvable" });
    }

    res.locals.user = user;
    next();
  });
};

// Vérifie que l'utilisateur est admin
module.exports.requireAdmin = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(401).json({ message: "Authentification requise" });
  }

  jwt.verify(token, process.env.TOKEN_SECRET, async (err, decodedToken) => {
    if (err) {
      return res.status(401).json({ message: "Token invalide ou expiré" });
    }

    const user = await UserModel.findById(decodedToken.id)
      .select("-password")
      .lean();
    if (!user) {
      return res.status(401).json({ message: "Utilisateur introuvable" });
    }
    if (user.role !== "admin") {
      return res.status(403).json({ message: "Accès refusé - admin requis" });
    }

    res.locals.user = user;
    next();
  });
};
