import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import { env } from "./config/env";
import { connectDB } from "./config/db";
import { logger } from "./utils/logger";
import { errorHandler } from "./middleware/errorHandler.middleware";
import { apiLimiter } from "./middleware/rateLimiter.middleware";
import { authenticate, authorize } from "./middleware/auth.middleware";
import { sanitizeRequest } from "./middleware/mongoSanitize.middleware";
import { startWorkers } from "./jobs/worker";

// Route imports
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/user/user.routes";
import projectRoutes from "./modules/project/project.routes";
import analyzerRoutes from "./modules/seo-analyzer/seo-analyzer.routes";
import aiReportsRoutes from "./modules/ai-reports/ai-reports.routes";
import rankTrackingRoutes from "./modules/rank-tracking/rank-tracking.routes";
import gscRoutes from "./modules/gsc/gsc.routes";
import backlinksRoutes from "./modules/backlinks/backlinks.routes";
import keywordResearchRoutes from "./modules/keyword-research/keyword-research.routes";

const app = express();

// ── Security Middleware ─────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(sanitizeRequest);

// ── Body Parsing ────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Logging ─────────────────────────────────────────────
if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ── Rate Limiting ───────────────────────────────────────
app.use("/api", apiLimiter);

// ── Health Check ────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
  });
});

// ── API Routes ──────────────────────────────────────────
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/analyzer", analyzerRoutes);
app.use("/api/v1/ai", aiReportsRoutes);
app.use("/api/v1/keywords", rankTrackingRoutes);
app.use("/api/v1/rank-tracking", rankTrackingRoutes);
app.use("/api/v1/gsc", gscRoutes);
app.use("/api/v1/backlinks", backlinksRoutes);
app.use("/api/v1/research", keywordResearchRoutes);

// Queue dashboard. Keep this behind admin auth.
app.use(
  "/admin/queues",
  authenticate,
  authorize("admin"),
  async (req, res, next) => {
    const { bullBoardRouter } = await import("./jobs/bullBoard");
    return bullBoardRouter(req, res, next);
  }
);

// ── 404 Handler ─────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: `Route not found`,
  });
});

// ── Global Error Handler ────────────────────────────────
app.use(errorHandler);

// ── Start Server ────────────────────────────────────────
const startServer = async () => {
  await connectDB();

  if (env.ENABLE_WORKERS) {
    startWorkers();
    logger.info("Inline workers enabled");
  }

  app.listen(env.PORT, () => {
    logger.info(
      `🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`
    );
  });
};

startServer().catch((error) => {
  logger.error("Failed to start server:", error);
  process.exit(1);
});

export default app;
