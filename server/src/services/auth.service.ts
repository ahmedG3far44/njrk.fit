import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../configs/env';
import User from '../models/user.model';

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
        throw new Error('Email already exists');
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
        throw new Error('Invalid credentials');
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
        throw new Error('Invalid credentials');
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
        throw new Error('User not found');
    }

    const newPayload = { userId: user._id.toString(), email: user.email };

    return {
        accessToken: generateAccessToken(newPayload),
        refreshToken: generateRefreshToken(newPayload),
    };
};