import express, { Request, Response, NextFunction } from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import mongoose from "mongoose";
import { mongoSanitize } from "./middleware/sanitize";
import { globalLimiter } from "./middleware/rateLimiter";
import userRoutes from "./routes/user.routes";
import itemRoutes from "./routes/item.routes";
import statisticsRoutes from "./routes/statistics.routes";
import contactsRoutes from "./routes/contacts.routes";
import historyRoutes from "./routes/history.routes";
import shipmentsRoutes from "./routes/shipments.routes";
import { requireAuth } from "./middleware/auth.middleware";
import cors from "cors";

const app = express();

// o2switch (and most hosts) run behind a reverse proxy;
// trust the first proxy so rate-limiters see the real client IP.
app.set("trust proxy", 1);

const corsOptions: cors.CorsOptions = {
  origin: process.env.CLIENT_URL,
  credentials: true,
  allowedHeaders: ["Content-Type", "sessionID"],
  exposedHeaders: ["sessionID"],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
};

// Performance and security middlewares
app.use(
  helmet({
    contentSecurityPolicy: false,
    // "no-referrer" (helmet default) breaks ImgBB hotlinking in dev and prod.
    // "strict-origin-when-cross-origin" sends the origin (no path) for
    // cross-origin requests, which ImgBB accepts.
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);
app.use(compression());
app.use(cors(corsOptions));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
// Sanitize user input against NoSQL injection ($gt, $ne, etc.)
app.use(mongoSanitize);

// Reject requests gracefully when MongoDB is not connected
app.use((_req: Request, res: Response, next: NextFunction) => {
  if (mongoose.connection.readyState !== 1) {
    res
      .status(503)
      .json({
        message:
          "Service temporairement indisponible — reconnexion à la base de données en cours",
      });
    return;
  }
  next();
});

// Swagger (dev only)
if (process.env.NODE_ENV !== "production") {
  import("./config/swagger").then(({ swaggerSpec }) => {
    import("swagger-ui-express").then((swaggerUi) => {
      app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
      console.log("Swagger UI: http://localhost:4000/api-docs");
    });
  });
}

// Routes
app.use(globalLimiter);
app.use("/api/user", userRoutes);
app.use("/api/item", itemRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use("/api/history", historyRoutes);
app.use("/api/shipments", shipmentsRoutes);

// JWT — returns the user ID and role
app.get("/jwtid", requireAuth, (req: Request, res: Response) => {
  res.status(200).json({
    _id: res.locals.user._id.toString(),
    role: res.locals.user.role || "user",
  });
});

export default app;
