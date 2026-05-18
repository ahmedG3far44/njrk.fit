import { Request, Response, NextFunction } from "express";

import User from "../models/user.model";
import { jwtUtils } from "../utils/jwt";

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    userId: string;
    email: string;
    name: string;
    avatarUrl?: string;
    onboardingCompleted: boolean;
    subscriptionTier: string;
    googleId?: string;
    googleAccessToken?: string;
  };
}


export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    let accessToken = req.cookies.accessToken;
    let refreshToken = req.cookies.refreshToken;
    let googleAccessToken = req.cookies.googleAccessToken;

    if (!accessToken && !refreshToken) {
      const authHeader = req.headers.authorization?.replace("Bearer ", "");
      if (authHeader) {
        accessToken = authHeader;
        if (!accessToken) {
          return res.status(401).json({ error: "Authentication required" });
        }
      } else {
        return res.status(401).json({ error: "Authentication required" });
      }
    }


    if (accessToken) {
      try {
        const payload = jwtUtils.verifyAccessToken(accessToken);
        (req as AuthRequest).user = payload;
        return next();
      } catch (accessError) {
        console.log("access token verification failed", accessError);
      }
    }

    if (!refreshToken) {
      return res
        .status(401)
        .json({ error: "Authentication required", code: "AUTH_REQUIRED" });
    }

    try {
      const refreshPayload = jwtUtils.verifyRefreshToken(refreshToken);
      const user = await User.findById(refreshPayload?._id);

      if (!user) {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        return res.status(401).json({ error: "User not found" });
      }

      const userPayload = {
        _id: user._id.toString(),
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        onboardingCompleted: user.onboardingCompleted,
        subscriptionTier: user.subscription?.subscriptionTier,
        googleAccessToken: googleAccessToken || null,
      };

      const newAccessToken = jwtUtils.generateAccessToken(userPayload);

      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      });

      (req as AuthRequest).user = userPayload;
      return next();
    } catch (refreshError) {
      res.clearCookie("accessToken");
      res.clearCookie("refreshToken");
      return res.status(401).json({
        error: "Session expired. Please log in again.",
        code: "SESSION_EXPIRED",
      });
    }
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
