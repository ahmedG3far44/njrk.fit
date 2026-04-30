import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../middlewares/validateResource';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../dtos/auth.dto';
import * as authService from '../services/auth.service';
import { env } from '../configs/env';
import { jwtUtils } from '../utils/jwt';
import { authMiddleware, type AuthRequest } from '../middlewares/authMiddleware';
import User from '../models/user.model';
import z from 'zod';


const router = Router();


const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
    const isProduction = env.NODE_ENV === "production";

    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
};

const clearAuthCookies = (res: Response) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
};


interface GoogleUserProfile {
    id: string;
    email: string;
    name: string;
    given_name: string;
    family_name: string;
    picture: string;
}

router.get('/google', (req: Request, res: Response) => {
    const redirectUri = `${env.API_URL || 'http://localhost:8080'}/api/auth/google/callback`;
    const clientId = env.GOOGLE_CLIENT_ID;

    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent`;
    res.redirect(url);
});

router.get('/google/callback', async (req: Request, res: Response) => {
    const code = req.query.code;
    const redirectUri = `${env.API_URL || 'http://localhost:8080'}/api/auth/google/callback`;

    if (!code) {
        return res.status(400).json({ error: 'Missing authorization code' });
    }

    try {
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: env.GOOGLE_CLIENT_ID!,
                client_secret: env.GOOGLE_CLIENT_SECRET!,
                code: code as string,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code'
            }),
        });

        const data = await tokenRes.json();

        if (!tokenRes.ok) {
            console.error('Google OAuth Token Error:', data);
            throw new Error('Failed to fetch access token');
        }

        const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${data.access_token}` },
        });

        const profileData: GoogleUserProfile = await profileRes.json();

        if (!profileRes.ok) {
            return res.status(400).json({ error: 'Google login failed', details: profileData });
        }

        const { email, picture, family_name, given_name, id } = profileData;

        let user: any = await authService.getUserByEmail(email);

        if (!user) {
            const result = await authService.registerUser("google", {
                email,
                name: `${given_name} ${family_name}`,
                avatarUrl: picture,
                googleId: id
            });
            user = result.user;
        }

        let userPayload = {
            _id: user._id.toString(),
            userId: user._id.toString(),
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            onboardingCompleted: user.onboardingCompleted,
            subscriptionTier: user.subscriptionTier
        }

        // FIX: Generate and set cookies REGARDLESS of onboarding status
        const accessToken = jwtUtils.generateAccessToken(userPayload);
        const refreshToken = jwtUtils.generateRefreshToken(userPayload);

        setAuthCookies(res, accessToken, refreshToken);

        // Now redirect based on onboarding status
        const clientUrl = env.CLIENT_URL;
        console.log("redirect client url", clientUrl)
        console.log("user onboarding completed", user.onboardingCompleted)
        if (!user.onboardingCompleted) {
            res.redirect(`${clientUrl}/onboarding/welcome`);
        } else {
            res.redirect(`${clientUrl}/dashboard/insights`);
        }
    } catch (err) {
        console.error('Google OAuth Error:', err);
        res.status(500).send('Google login failed');
    }
});

router.post('/register', validate(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password, name } = req.body;
        const result = await authService.registerUser("email", { email, password, name });

        if (!result.success) {
            return res.status(400).json({ error: result.message });
        }

        setAuthCookies(res, result.accessToken!, result.refreshToken!);

        const clientUrl = env.CLIENT_URL;
        const redirectPath = !result.user!.onboardingCompleted ? '/onboarding/welcome' : '/dashboard/insights';

        res.status(201).json({ ...result, redirect: `${clientUrl}${redirectPath}` });
    } catch (error) {
        next(error);
    }
});

router.post('/login', validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const result = await authService.loginUser(email, password);

        if (!result?.success) {
            return res.status(400).json({ error: result.message });
        }

        setAuthCookies(res, result.accessToken!, result.refreshToken!);

        const clientUrl = env.CLIENT_URL;
        const redirectPath = !result.user!.onboardingCompleted ? '/onboarding/welcome' : '/dashboard/insights';

        // Changed to 200 OK (201 is usually for resource creation)
        res.status(200).json({ ...result, redirect: `${clientUrl}${redirectPath}` });
    } catch (error) {
        next(error);
    }
});

router.post('/refresh-token', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token required' });
        }

        // Verify the existing token
        const payload = jwtUtils.verifyRefreshToken(refreshToken);

        // FIX: Generate a new access token (and optionally a new refresh token)
        // Assuming your payload contains the necessary user info (e.g., userId, email)
        const newAccessToken = jwtUtils.generateAccessToken(payload);

        // Update the access token cookie
        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: env.NODE_ENV === "production",
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });

        res.status(200).json({ message: 'Token refreshed successfully' });
    } catch (error) {
        // If the refresh token is expired or invalid, clear cookies
        clearAuthCookies(res);
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
});

router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
    try {
        // FIX: Actually clear the cookies!
        clearAuthCookies(res);
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
});

router.post('/forgot-password', validate(forgotPasswordSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        console.log('Password reset requested for:', email);
        // TODO: Implement actual email sending logic
        res.status(200).json({ message: 'Password reset email sent' });
    } catch (error) {
        next(error);
    }
});

router.post('/reset-password', validate(resetPasswordSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token, newPassword } = req.body;
        console.log('Password reset with token:', token);
        // TODO: Implement actual password hashing and database update
        res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        next(error);
    }
});


interface IOnboardingRequest {
    age: number;
    gender: "male" | "female";
    height: number;
    weight: number;
    allergies: string[];
    activityLevel: {
        value: number;
        title: string;
        slug: string;
        emoji: string;
    };
    religion: "muslim" | "christian";
    dietaryRestrictions: string[];
    medicalDocuments?: string[];
    userGoal: "lose_weight" | "gain_weight" | "healthy_lifestyle";
    targetWeight: number;
    fitnessGoal: string;
}
const onboardingSchema = z.object({
    age: z.number().min(13, {
        message: "You must be at least 13 years old",
    }).max(100, {
        message: "You must be at most 100 years old",
    }),
    gender: z.enum(["male", "female"]),
    height: z.number().min(100, {
        message: "You must be at least 100cm tall",
    }).max(250, {
        message: "You must be at most 250cm tall",
    }),
    weight: z.number().min(10, {
        message: "You must be at least 10kg heavy",
    }).max(200, {
        message: "You must be at most 200kg heavy",
    }),
    allergies: z.array(z.string()).optional(),
    activityLevel: z.enum(["sedentary", "light", "moderate", "active", "very_active"]),
    religion: z.enum(["muslim", "christian"]),
    dietaryRestrictions: z.array(z.string()).optional(),
    medicalDocuments: z.array(z.string()).optional(),
    userGoal: z.enum(["lose_weight", "gain_weight", "maintain_weight"]),
    targetWeight: z.number(),
    fitnessGoal: z.string(),
});

export type TOnboarding = z.infer<typeof onboardingSchema>;

router.post("/onboarding", authMiddleware, async (req: Request, res: Response) => {
    try {

        console.log("onboarding request received");
        const userId = (req as AuthRequest).user?._id;

        if (!userId) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        const payload = req.body;
        console.log("body", payload);

        const onboarding = onboardingSchema.safeParse(payload);

        console.log("passing schema validation of onboarding: ", onboarding)

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
        console.log("redirecting user to: ", env.CLIENT_URL)

        res.status(201).json({ message: 'User onboarded successfully', redirect: `${env.CLIENT_URL}/dashboard/insights` });
    }
    catch (error) {
        console.error('Onboarding error:', error);
        res.status(500).json({ error: 'Failed to complete onboarding' });
    }
});

export default router;