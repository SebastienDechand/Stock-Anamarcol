const express = require("express");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const userRoutes = require("./routes/user.routes");
const itemRoutes = require("./routes/item.routes");
const statisticsRoutes = require("./routes/statistics.routes");
const contactsRoutes = require("./routes/contacts.routes");
const { requireAuth } = require("./middleware/auth.middleware");
const cors = require("cors");

const app = express();

const corsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true,
  allowedHeaders: ["Content-Type", "sessionID"],
  exposedHeaders: ["sessionID"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
};

// Middlewares de performance et sécurité
app.use(helmet({ contentSecurityPolicy: false }));
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/user", userRoutes);
app.use("/api/item", itemRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/statistics", statisticsRoutes);

// JWT - retourne l'ID et le rôle de l'utilisateur
app.get("/jwtid", requireAuth, (req, res) => {
  res.status(200).json({
    _id: res.locals.user._id.toString(),
    role: res.locals.user.role || "user",
  });
});

module.exports = app;
