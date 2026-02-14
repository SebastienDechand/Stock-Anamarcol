import express, { Request, Response } from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import userRoutes from "./routes/user.routes";
import itemRoutes from "./routes/item.routes";
import statisticsRoutes from "./routes/statistics.routes";
import contactsRoutes from "./routes/contacts.routes";
import { requireAuth } from "./middleware/auth.middleware";
import cors from "cors";

const app = express();

const corsOptions: cors.CorsOptions = {
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
app.use("/api/user", userRoutes);
app.use("/api/item", itemRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/statistics", statisticsRoutes);

// JWT - retourne l'ID et le rôle de l'utilisateur
app.get("/jwtid", requireAuth, (req: Request, res: Response) => {
  res.status(200).json({
    _id: res.locals.user._id.toString(),
    role: res.locals.user.role || "user",
  });
});

export default app;
