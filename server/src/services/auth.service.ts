import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../configs/env';
import User from '../models/user.model';
import { jwtUtils } from '../utils/jwt';
import { UserProfile } from '../types';

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

export const registerUser = async (provider: 'google' | 'github' | 'email', userData: { email: string, password?: string, name: string, avatarUrl?: string, googleId?: string, githubId?: string }): Promise<{
    success: boolean;
    message?: string;
    user?: {
        _id: string;
        userId: string;
        email: string;
        name: string;
        avatarUrl?: string;
        onboardingCompleted: boolean;
        subscriptionTier: "BASIC" | "PRO" | "FAMILY";
    };
    accessToken?: string;
    refreshToken?: string;
}> => {

    const { email, password, name, avatarUrl, googleId, githubId } = userData;

    const placeholder = "https://imgs.search.brave.com/XTYb7aqQKvXRuwwA2RPI2PJEiFUM567kRggEPKviqC8/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9zdDMu/ZGVwb3NpdHBob3Rv/cy5jb20vNDExMTc1/OS8xMzQyNS92LzQ1/MC9kZXBvc2l0cGhv/dG9zXzEzNDI1NTUz/Mi1zdG9jay1pbGx1/c3RyYXRpb24tcHJv/ZmlsZS1wbGFjZWhv/bGRlci1tYWxlLWRl/ZmF1bHQtcHJvZmls/ZS5qcGc"

    if (provider === 'email' && !password) {
        return { success: false, message: 'Password is required' }
    } else if (provider === 'google' && !googleId) {
        return { success: false, message: 'Google ID is required' }
    } else if (provider === 'github' && !githubId) {
        return { success: false, message: 'Github ID is required' }
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
        return { success: false, message: 'Email already exists' }
    }

    let newUser;
    switch (provider) {
        case 'google':
            newUser = {
                name,
                email: email.toLowerCase(),
                avatarUrl,
                googleId,
            }
            break;
        case 'email':
            newUser = {
                name,
                email: email.toLowerCase(),
                passwordHash: await hashPassword(password as string),
                avatarUrl: placeholder,
            }
            break;
        default:
            newUser = {
                name,
                email: email.toLowerCase(),
                passwordHash: await hashPassword(password as string),
                avatarUrl: placeholder,
            }
            break;
    }
    const user = await User.create(newUser);

    const payload = {
        _id: user._id.toString(),
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        onboardingCompleted: user.onboardingCompleted,
        subscriptionTier: user.subscriptionTier
    };

    return {
        success: true,
        message: 'User registered successfully',
        user: payload,
        accessToken: jwtUtils.generateAccessToken(payload),
        refreshToken: jwtUtils.generateRefreshToken(payload),
    };
};

export const loginUser = async (email: string, password: string) => {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.passwordHash) {
        return { success: false, message: 'Invalid credentials' };
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
        return { success: false, message: 'Invalid credentials' };
    }

    const payload = {
        _id: user._id.toString(),
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        onboardingCompleted: user.onboardingCompleted,
        subscriptionTier: user.subscriptionTier
    };


    return {
        success: true,
        message: 'Login successful',
        user: payload,
        accessToken: jwtUtils.generateAccessToken(payload),
        refreshToken: jwtUtils.generateRefreshToken(payload),
    };
};



export const getUserByEmail = async (email: string) => {
    return await User.findOne({ email: email.toLowerCase() });
};
