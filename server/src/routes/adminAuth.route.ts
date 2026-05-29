import { Router, Request, Response, NextFunction } from "express";
import { validate } from "../middlewares/validateResource";
import { loginAdminSchema } from "../dtos/admin.dto";
import * as adminAuthService from "../services/adminAuth.service";
import { adminAuthMiddleware, type AdminAuthRequest } from "../middlewares/adminAuthMiddleware";

const router = Router();

router.post(
  "/login",
  validate(loginAdminSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await adminAuthService.loginAdmin(email, password);

      if (!result.success) {
        return res.status(401).json({ error: result.message });
      }

      res.status(200).json({
        admin: result.admin,
        token: result.token,
      });
    } catch (error) {
      next(error);
    }
  },
);

router.post("/logout", (_req: Request, res: Response) => {
  res.status(200).json({ message: "Logged out successfully" });
});

router.get(
  "/me",
  adminAuthMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const adminId = (req as AdminAuthRequest).admin?._id;
      if (!adminId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const admin = await adminAuthService.getAdminById(adminId);
      if (!admin) {
        return res.status(404).json({ error: "Admin not found" });
      }

      res.status(200).json({ admin });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
