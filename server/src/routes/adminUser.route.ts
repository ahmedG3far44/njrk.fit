import { Router, Request, Response, NextFunction } from "express";
import { validate } from "../middlewares/validateResource";
import { userQuerySchema, blockUserSchema } from "../dtos/admin.dto";
import * as adminUserService from "../services/adminUser.service";
import { adminAuthMiddleware } from "../middlewares/adminAuthMiddleware";

const router = Router();

router.use(adminAuthMiddleware);

router.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = userQuerySchema.parse(req.query);
      const result = await adminUserService.getUsers(query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const user = await adminUserService.getUserById(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.status(200).json({ user });
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  "/:id/block",
  validate(blockUserSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const result = await adminUserService.blockUser(id, req.body);
      if (!result.success) {
        return res.status(404).json({ error: result.message });
      }
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  "/:id/unblock",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const result = await adminUserService.unblockUser(id);
      if (!result.success) {
        return res.status(404).json({ error: result.message });
      }
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const result = await adminUserService.deleteUser(id);
      if (!result.success) {
        return res.status(404).json({ error: result.message });
      }
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
