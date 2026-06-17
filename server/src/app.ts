import cors from "cors";
import express from "express";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import dbConnection from "./configs/db";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.route";
import userRoutes from "./routes/user.route";
import familyRoutes from "./routes/family.route";
import googleFitRoutes from "./routes/googleFit.route";
import exportRoutes from "./routes/export.route";
import fitnessRoutes from "./routes/fitness.route";
import groceryRoutes from "./routes/grocery.route";
import progressRoutes from "./routes/progress.route";
import scheduleRoutes from "./routes/schedule.route";
import webhooksRoutes from "./routes/webhooks.route";
import communityRoutes from "./routes/community.route";
import nutritionRoutes from "./routes/nutrition.route";
import gamificationRoutes from "./routes/gamification.route";
import subscriptionsRoutes from "./routes/subscriptions.route";
import leaderboardRoutes from "./routes/leaderboard.route";
import adminRoutes from "./routes/admin.routes";

import { corsOptions, env } from "./configs/env";
import { errorHandler } from "./middlewares/errorHandler";
import { requestLogger } from "./middlewares/requestLogger";

const app = express();
dbConnection;

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());
app.use(requestLogger);
app.use(cors(corsOptions));
app.use(cookieParser());

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many authentication attempts, please try again later." },
});

app.use("/api", generalLimiter);
app.use("/api/auth", authLimiter);

app.use("/api/webhook", webhooksRoutes);
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    name: "Njerak.fit API",
    version: "1.0.0",
    environment: env.NODE_ENV,
  });
});

app.get("/health", async (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/nutrition", nutritionRoutes);
app.use("/api/fitness", fitnessRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/community", communityRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/subscriptions", subscriptionsRoutes);
app.use("/api/groceries", groceryRoutes);
app.use("/api/family", familyRoutes);
app.use("/api/google-fit", googleFitRoutes);
app.use("/api/admin", adminRoutes);

app.use(errorHandler);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

export default app;
