const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const userRoutes = require("./routes/user.routes");
const itemRoutes = require("./routes/item.routes");
const statisticsRoutes = require("./routes/statistics.routes");
const contactsRoutes = require("./routes/contacts.routes");
require("dotenv").config({ path: "./config/.env" });
require("./config/db");
const { checkUser, requireAuth } = require("./middleware/auth.middleware");
const cors = require("cors");
const app = express();

const corsOptions = {
  origin: process.env.CLIENT_URL,
  // origin: "https://anamarcol.vercel.app",
  credentials: true,
  allowedHeaders: ["Content-Type", "sessionID"],
  exposedHeaders: ["sessionID"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cookieParser({
    sameSite: "None",
    secure: true,
  })
);
app.get("*", checkUser);

// Routes
app.use("/api/user", userRoutes);
app.use("/api/item", itemRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/statistics", statisticsRoutes);

// JWT
app.get("/jwtid", requireAuth, (req, res) => {
  res.status(200).send(res.locals.user._id);
});

// Server
app.listen(process.env.PORT, () => {
  console.log(`Listening on port ${process.env.PORT}`);
});
