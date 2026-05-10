import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.model';

// import { UserProfile } from '../types';

import { env } from '../configs/env';
import { jwtUtils } from '../utils/jwt';
import { TOnboarding } from '../routes/auth.route';
import stripe from '../configs/stripe';

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
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: env.JWT_EXPIRATION as jwt.SignOptions['expiresIn'],
    });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        expiresIn: env.JWT_REFRESH_EXPIRATION as jwt.SignOptions['expiresIn'],
    });
};

export const verifyAccessToken = (token: string): TokenPayload => {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
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
        stripCustomerId: string;
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

    const customer = await stripe.customers.create({
        email: email,
        name: name,
    });

    let newUser;
    switch (provider) {
        case 'google':
            newUser = {
                name,
                email: email.toLowerCase(),
                avatarUrl,
                googleId,
                subscription: {
                    stripCustomerId: customer.id,
                    subscriptionTier: "BASIC",
                    subscriptionStatus: "trialing",
                    subscriptionId: null,
                    subscriptionStartDate: new Date(),
                    subscriptionEndDate: null
                }
            }
            break;
        case 'email':
            newUser = {
                name,
                email: email.toLowerCase(),
                passwordHash: await hashPassword(password as string),
                avatarUrl: placeholder,
                subscription: {
                    stripCustomerId: customer.id,
                    subscriptionTier: "BASIC",
                    subscriptionStatus: "trialing",
                    subscriptionId: null,
                    subscriptionStartDate: new Date(),
                    subscriptionEndDate: null
                }
            }
            break;
        default:
            newUser = {
                name,
                email: email.toLowerCase(),
                passwordHash: await hashPassword(password as string),
                avatarUrl: placeholder,
                subscription: {
                    stripCustomerId: customer.id,
                    subscriptionTier: "BASIC",
                    subscriptionStatus: "active",
                    subscriptionId: null,
                    subscriptionStartDate: new Date(),
                    subscriptionEndDate: null
                }
            }
            break;
    }

    console.log("Stripe customer created: ", customer.id);


    const user = await User.create(newUser);

    const payload = {
        _id: user._id.toString(),
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        onboardingCompleted: user.onboardingCompleted,
        stripCustomerId: customer.id,
        subscriptionTier: "BASIC" as const
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
        subscriptionTier: user.subscription?.subscriptionTier as "BASIC" | "PRO" | "FAMILY"
    };


    return {
        success: true,
        message: 'Login successful',
        user: payload,
        accessToken: jwtUtils.generateAccessToken(payload),
        refreshToken: jwtUtils.generateRefreshToken(payload),
    };
};


export const onboardingUser = async (userId: string, data: TOnboarding) => {
    try {
        console.log("updatting user onboarding data: ", data)
        const user = await User.findById(userId);
        if (!user) {
            return { success: false, message: 'User not found' };
        }
        user.weight = data.weight;
        user.height = data.height;
        user.age = data.age;
        user.gender = data.gender;
        user.activityLevel = data.activityLevel;
        user.dietaryRestrictions = data.dietaryRestrictions || [];
        user.religion = data.religion;
        user.allergies = data.allergies;
        user.goal = data.userGoal;
        user.targetWeight = data.targetWeight;
        user.fitnessGoals = data.fitnessGoal;
        user.onboardingCompleted = true;
        await user.save();
        return { success: true, message: 'User onboarded successfully' };
    } catch (error) {
        console.error('User onboarding failed:', error);
        return { success: false, message: 'User onboarding failed', error: error };
    }
}


export const getUserByEmail = async (email: string) => {
    return await User.findOne({ email: email.toLowerCase() });
};
