import jwt from "jsonwebtoken";
import { env } from "../configs/env";

interface AdminTokenPayload {
  _id: string;
  email: string;
  name: string;
  role: string;
}

export const adminJwtUtils = {
  generateAdminToken: (payload: AdminTokenPayload) => {
    return jwt.sign(payload, env.JWT_ADMIN_SECRET, {
      expiresIn: env.JWT_ADMIN_EXPIRATION as jwt.SignOptions['expiresIn'],
    });
  },
  verifyAdminToken: (token: string) => {
    return jwt.verify(token, env.JWT_ADMIN_SECRET) as AdminTokenPayload;
  },
};
