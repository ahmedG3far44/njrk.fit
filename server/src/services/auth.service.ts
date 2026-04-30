import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../configs/env';
import User from '../models/user.model';
import { AppError } from '../middlewares/errorHandler';
import { sendEmail } from './email.service';

export const hashPassword = async (password: string): Promise<string> => {
    const salt = await bcrypt.genSalt(12);
    return bcrypt.hash(password, salt);
};

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
    return bcrypt.compare(password, hashedPassword);
};

interface TokenPayload {
    userId: string;
    email: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, env.jwtSecret, {
        expiresIn: env.jwtExpiration as jwt.SignOptions['expiresIn'],
    });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, env.jwtRefreshSecret, {
        expiresIn: env.jwtRefreshExpiration as jwt.SignOptions['expiresIn'],
    });
};

export const verifyAccessToken = (token: string): TokenPayload => {
    return jwt.verify(token, env.jwtSecret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
    return jwt.verify(token, env.jwtRefreshSecret) as TokenPayload;
};

export const registerUser = async (email: string, password: string, name: string) => {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
        throw new AppError('Email already exists', 409);
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
        email: email.toLowerCase(),
        passwordHash,
        name,
    });

    const payload = { userId: user._id.toString(), email: user.email };

    return {
        user: {
            _id: user._id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            currentStreak: user.currentStreak,
            longestStreak: user.longestStreak,
            availableFreezes: user.availableFreezes,
        },
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
    };
};

export const loginUser = async (email: string, password: string) => {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) {
        throw new AppError('Invalid credentials', 401);
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
        throw new AppError('Invalid credentials', 401);
    }

    const payload = { userId: user._id.toString(), email: user.email };

    return {
        user: {
            _id: user._id,
            email: user.email,
            name: user.name,
            avatarUrl: user.avatarUrl,
            currentStreak: user.currentStreak,
            longestStreak: user.longestStreak,
            availableFreezes: user.availableFreezes,
        },
        accessToken: generateAccessToken(payload),
        refreshToken: generateRefreshToken(payload),
    };
};

export const refreshTokens = async (refreshToken: string) => {
    const payload = verifyRefreshToken(refreshToken);
    
    const user = await User.findById(payload.userId);
    if (!user) {
        throw new AppError('User not found', 404);
    }

    const newPayload = { userId: user._id.toString(), email: user.email };

    return {
        accessToken: generateAccessToken(newPayload),
        refreshToken: generateRefreshToken(newPayload),
    };
};

export const forgotPassword = async (email: string) => {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        return { message: 'If that email exists, a reset link has been sent' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetUrl = `${env.allowedOrigins.split(',')[0]}/reset-password?token=${resetToken}`;
    const html = `
        <h1>Password Reset Request</h1>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link expires in 1 hour.</p>
    `;

    await sendEmail(html, user.email, 'Password Reset - Njerka.fit');

    return { message: 'If that email exists, a reset link has been sent' };
};

export const resetPassword = async (token: string, newPassword: string) => {
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
        resetPasswordToken: resetTokenHash,
        resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
        throw new AppError('Invalid or expired reset token', 400);
    }

    user.passwordHash = await hashPassword(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return { message: 'Password reset successfully' };
};
