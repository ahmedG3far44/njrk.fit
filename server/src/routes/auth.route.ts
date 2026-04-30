import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { validate } from '../middlewares/validateResource';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../dtos/auth.dto';
import * as authService from '../services/auth.service';
import { env } from '../configs/env';
import User from '../models/user.model';

const router = Router();

const initGoogleStrategy = () => {
    if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return;

    passport.use(new GoogleStrategy({
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            let user = await User.findOne({ googleId: profile.id });

            if (!user) {
                user = await User.findOne({ email: profile.emails?.[0].value });

                if (user) {
                    user.googleId = profile.id;
                    await user.save();
                } else {
                    user = await User.create({
                        email: profile.emails?.[0].value,
                        googleId: profile.id,
                        name: profile.displayName,
                    });
                }
            }

            return done(null, user);
        } catch (error) {
            return done(error);
        }
    }));
};

initGoogleStrategy();

router.post('/register', validate(registerSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password, name } = req.body;
        const result = await authService.registerUser(email, password, name);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
});

router.post('/login', validate(loginSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const result = await authService.loginUser(email, password);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

router.post('/refresh-token', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const refreshToken = req.headers.authorization?.replace('Bearer ', '');
        if (!refreshToken) {
            return res.status(401).json({ error: 'Refresh token required' });
        }
        const result = await authService.refreshTokens(refreshToken);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

router.post('/logout', async (req: Request, res: Response, next: NextFunction) => {
    try {
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
});

router.post('/forgot-password', validate(forgotPasswordSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        const result = await authService.forgotPassword(email);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

router.post('/reset-password', validate(resetPasswordSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { token, newPassword } = req.body;
        const result = await authService.resetPassword(token, newPassword);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
});

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

    router.get('/google/callback',
        passport.authenticate('google', { failureRedirect: '/login' }),
        (req: Request, res: Response) => {
            const user = req.user as any;
            const payload = { userId: user._id.toString(), email: user.email };
            const accessToken = authService.generateAccessToken(payload);
            const refreshToken = authService.generateRefreshToken(payload);
            res.redirect(`${env.allowedOrigins.split(',')[0]}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
        }
    );
}

export default router;