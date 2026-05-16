import { Request, Response, NextFunction } from "express";
import Admin from "../models/admin.model";
import { adminJwtUtils } from "../utils/adminJwt";

export interface AdminAuthRequest extends Request {
  admin?: {
    _id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const adminAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "Admin authentication required" });
    }

    const payload = adminJwtUtils.verifyAdminToken(token);

    const admin = await Admin.findById(payload._id).select("_id email name role isActive");
    if (!admin) {
      return res.status(401).json({ error: "Admin not found" });
    }
    if (!admin.isActive) {
      return res.status(403).json({ error: "Admin account is deactivated" });
    }

    (req as AdminAuthRequest).admin = {
      _id: admin._id.toString(),
      email: admin.email,
      name: admin.name,
      role: admin.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired admin token" });
  }
};

export const superAdminOnly = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const admin = (req as AdminAuthRequest).admin;
  if (!admin || admin.role !== 'super_admin') {
    return res.status(403).json({ error: "Super admin access required" });
  }
  next();
};
