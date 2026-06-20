import { Router } from "express";
import adminAuthRoutes from "./adminAuth.route";
import adminUserRoutes from "./adminUser.route";
import adminAnalyticsRoutes from "./adminAnalytics.route";
import adminPostRoutes from "./adminPost.route";

const router = Router();

router.use("/auth", adminAuthRoutes);
router.use("/users", adminUserRoutes);
router.use("/analytics", adminAnalyticsRoutes);
router.use("/posts", adminPostRoutes);

export default router;
