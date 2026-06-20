import { Router, Request, Response, NextFunction } from "express";
import * as adminPostService from "../services/adminPost.service";
import { adminAuthMiddleware } from "../middlewares/adminAuthMiddleware";

const router = Router();

router.use(adminAuthMiddleware);

// المسار الجديد: جلب كل البوستات للوحة التحكم
router.get(
  "/",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await adminPostService.getPosts(page, limit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

// مسار الحذف
router.delete(
  "/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const result = await adminPostService.deletePost(id);
      
      if (!result.success) {
        return res.status(404).json({ error: result.message });
      }
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
);

export default router;