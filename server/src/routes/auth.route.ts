import { Router, Request, Response, NextFunction } from "express";
import { validate } from "../middlewares/validateResource";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../dtos/auth.dto";
import * as authService from "../services/auth.service";
import { env } from "../configs/env";
import { jwtUtils } from "../utils/jwt";
import {
  authMiddleware,
  type AuthRequest,
} from "../middlewares/authMiddleware";
import User from "../models/user.model";
import z from "zod";
import { ActivityLevel, Gender, Goal, Religion } from "../types";
import { sendSubscriptionEmail } from "../services/email.service";


const router = Router();

const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken: string,
  googleAccessToken?: string
) => {
  const isProduction = env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  if (googleAccessToken) {
    res.cookie("googleAccessToken", googleAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });
  }
};

const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.clearCookie("googleAccessToken");
};

interface GoogleUserProfile {
  id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

router.get("/google", (req: Request, res: Response) => {
  const redirectUri = `${(env.API_URL || "http://localhost:8080").replace(/\/api\/?$/, "")}/api/auth/google/callback`;
  const clientId = env.GOOGLE_CLIENT_ID;

  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent`;
  res.redirect(url);
});

router.get("/google/fit-connect", authMiddleware, (req: Request, res: Response) => {
  const redirectUri = `${(env.API_URL || "http://localhost:8080").replace(/\/api\/?$/, "")}/api/auth/google/callback`;
  const clientId = env.GOOGLE_CLIENT_ID;
  const userId = (req as AuthRequest).user?._id;

  const state = `fit_connect:${userId}`;
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=https://www.googleapis.com/auth/fitness.activity.read&include_granted_scopes=true&access_type=offline&prompt=consent&state=${state}`;
  res.redirect(url);
});

router.get("/google/callback", async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const state = req.query.state as string;
  const redirectUri = `${(env.API_URL || "http://localhost:8080").replace(/\/api\/?$/, "")}/api/auth/google/callback`;
  const clientUrl = env.CLIENT_URL;

  if (!code) {
    return res.status(400).json({ error: "Missing authorization code" });
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID!,
        client_secret: env.GOOGLE_CLIENT_SECRET!,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const data = await tokenRes.json();

    if (!tokenRes.ok) {
      console.error("Google OAuth Token Error:", data);
      throw new Error("Failed to fetch access token");
    }

    // --- FIT CONNECT flow (incremental authorization for fitness scope) ---
    if (state?.startsWith("fit_connect:")) {
      const userId = state.split(":")[1];
      if (!userId) {
        return res.redirect(`${clientUrl}/login`);
      }

      const fitUpdate: Record<string, any> = {
        googleTokenExpiry: new Date(Date.now() + (data.expires_in || 3600) * 1000),
      };
      if (data.refresh_token) {
        fitUpdate.googleRefreshToken = data.refresh_token;
      }
      await User.findByIdAndUpdate(userId, { $set: fitUpdate });

      res.cookie("googleAccessToken", data.access_token, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      });

      return res.redirect(`${clientUrl}/dashboard/progress`);
    }

    // --- LOGIN flow ---
    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${data.access_token}` },
      },
    );

    const profileData: GoogleUserProfile = await profileRes.json();

    if (!profileRes.ok) {
      return res
        .status(400)
        .json({ error: "Google login failed", details: profileData });
    }

    const { email, picture, family_name, given_name, id } = profileData;

    let user: any = await authService.getUserByEmail(email);

    if (!user) {
      const result = await authService.registerUser("google", {
        email,
        name: `${given_name} ${family_name}`,
        avatarUrl: picture,
        googleId: id,
      });
      user = result.user;
    }

    if (data.refresh_token) {
      await User.findByIdAndUpdate(user._id, {
        $set: {
          googleRefreshToken: data.refresh_token,
          googleTokenExpiry: new Date(Date.now() + data.expires_in * 1000),
        },
      });
    } else {
      await User.findByIdAndUpdate(user._id, {
        $set: {
          googleTokenExpiry: new Date(Date.now() + data.expires_in * 1000),
        },
      });
    }

    let userPayload = {
      _id: user._id.toString(),
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      onboardingCompleted: user.onboardingCompleted,
      subscriptionTier: user.subscriptionTier,
    };

    const accessToken = jwtUtils.generateAccessToken(userPayload);
    const refreshToken = jwtUtils.generateRefreshToken(userPayload);
    const googleAccessToken = data.access_token;


    setAuthCookies(res, accessToken, refreshToken, googleAccessToken);

    if (!user.onboardingCompleted) {
      res.redirect(`${clientUrl}/onboarding`);
    } else {
      res.redirect(`${clientUrl}/dashboard/insights`);
    }
  } catch (err) {
    console.error("Google OAuth Error:", err);
    res.status(500).send("Google login failed");
  }
});

router.post(
  "/register",
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, name, language } = req.body;
      const result = await authService.registerUser("email", {
        email,
        password,
        name,
        language,
      });

      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }

      setAuthCookies(res, result.accessToken!, result.refreshToken!);

      const clientUrl = env.CLIENT_URL;
      const redirectPath = !result.user!.onboardingCompleted
        ? "/onboarding"
        : "/dashboard/insights";

      res
        .status(201)
        .json({ ...result, redirect: `${clientUrl}${redirectPath}` });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/login",
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await authService.loginUser(email, password);

      if (!result?.success) {
        return res.status(400).json({ error: result.message });
      }

      setAuthCookies(res, result.accessToken!, result.refreshToken!);

      const clientUrl = env.CLIENT_URL;
      const redirectPath = !result.user!.onboardingCompleted
        ? "/onboarding"
        : "/dashboard/insights";

      // Changed to 200 OK (201 is usually for resource creation)
      res
        .status(200)
        .json({ ...result, redirect: `${clientUrl}${redirectPath}` });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/refresh-token",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        return res.status(401).json({ error: "Refresh token required" });
      }

      // Verify the existing token
      const payload = jwtUtils.verifyRefreshToken(refreshToken);

      // FIX: Generate a new access token (and optionally a new refresh token)
      // Assuming your payload contains the necessary user info (e.g., userId, email)
      const newAccessToken = jwtUtils.generateAccessToken(payload);

      // Update the access token cookie
      res.cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000,
      });

      res.status(200).json({ message: "Token refreshed successfully" });
    } catch (error) {
      // If the refresh token is expired or invalid, clear cookies
      clearAuthCookies(res);
      return res
        .status(401)
        .json({ error: "Invalid or expired refresh token" });
    }
  },
);

router.post(
  "/logout",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // FIX: Actually clear the cookies!
      clearAuthCookies(res);
      res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      console.log("Password reset requested for:", email);
      // TODO: Implement actual email sending logic
      res.status(200).json({ message: "Password reset email sent" });
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, newPassword } = req.body;
      console.log("Password reset with token:", token);
      // TODO: Implement actual password hashing and database update
      res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
      next(error);
    }
  },
);

interface IOnboardingRequest {
  age: number;
  gender: Gender;
  height: number;
  weight: number;
  allergies: string[];
  activityLevel: ActivityLevel;
  religion: Religion;
  dietaryRestrictions: string[];
  userGoal: Goal;
  targetWeight: number;
  fitnessGoal: string;
  language?: 'en' | 'ar';
}
const onboardingSchema = z.object({
  age: z
    .number()
    .min(13, {
      message: "You must be at least 13 years old",
    })
    .max(100, {
      message: "You must be at most 100 years old",
    }),
  gender: z.enum(["male", "female"]),
  height: z
    .number()
    .min(100, {
      message: "You must be at least 100cm tall",
    })
    .max(250, {
      message: "You must be at most 250cm tall",
    }),
  weight: z
    .number()
    .min(10, {
      message: "You must be at least 10kg heavy",
    })
    .max(200, {
      message: "You must be at most 200kg heavy",
    }),
  allergies: z.array(z.string()).optional(),
  activityLevel: z.enum([
    "sedentary",
    "light",
    "moderate",
    "active",
    "very_active",
  ]),
  religion: z.enum(["muslim", "christian"]),
  dietaryRestrictions: z.array(z.string()).optional(),
  userGoal: z.enum(["lose_weight", "gain_weight", "maintain_weight"]),
  targetWeight: z.number(),
  fitnessGoal: z.string(),
  goalDate: z.string().optional(),
  language: z.enum(['en', 'ar']).default('en'),
});

export type TOnboarding = z.infer<typeof onboardingSchema>;

router.post(
  "/onboarding",
  authMiddleware,
  async (req: Request, res: Response) => {
    try {
      console.log("onboarding request received");
      const userId = (req as AuthRequest).user?._id;

      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const payload = req.body;
      console.log("body", payload);

      const onboarding = onboardingSchema.safeParse(payload);

      console.log("passing schema validation of onboarding: ", onboarding);

      if (!onboarding.success) {
        console.log("schema validation failed", onboarding.error);
        return res.status(400).json({ error: onboarding.error });
      }

      console.log("onboarding", onboarding.data);

      const data = onboarding.data;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const result = await authService.onboardingUser(userId, data);

      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }
      console.log("redirecting user to: ", env.CLIENT_URL);

      res.status(201).json({
        message: "User onboarded successfully",
        redirect: `${env.CLIENT_URL}/dashboard/insights`,
      });
    } catch (error) {
      console.error("Onboarding error:", error);
      res.status(500).json({ error: "Failed to complete onboarding" });
    }
  },
);
router.post(
  "/test-email",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name } = req.body;

      if (!email || !name) {
        return res
          .status(400)
          .json({ error: "Email and name are required" });
      }

      await sendSubscriptionEmail(email, name);

      res.status(200).json({ message: "Test email sent successfully" });
    } catch (error) {
      next(error);
    }
  }
);
export default router;
