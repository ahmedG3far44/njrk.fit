import mongoose from 'mongoose';
import User from '../models/user.model';
import Activity from '../models/activity.model';
import UserReward, { getRewardCatalog, getRewardById } from '../models/reward.model';

interface CheckInResult {
    currentStreak: number;
    longestStreak: number;
    availableFreezes: number;
    isFirstCheckIn: boolean;
    isFrozen: boolean;
    didCheckIn: boolean;
}

interface InsightsResult {
    currentStreak: number;
    longestStreak: number;
    totalPoints: number;
    pointsToRedeem: number;
    estimatedSteps: number;
    estimatedSleepHours: number;
    estimatedWaterMl: number;
    userEstimatedSteps: number;
}

interface ActivityResult {
    activities: Array<{
        date: string;
        type: string;
    }>;
    totalCheckIns: number;
}

interface RewardWithStatus {
    rewardId: string;
    name: string;
    description: string;
    requiredStreak: number;
    pointsReward: number;
    badgeIcon: string;
    isUnlocked: boolean;
    isClaimed: boolean;
    progress: number;
}

const ACTIVITY_LEVEL_STEPS: Record<string, number> = {
    sedentary: 3000,
    light: 5000,
    moderate: 7000,
    active: 9000,
    very_active: 11000,
};

const calculateEstimatedSteps = (activityLevel: string, workoutsCompleted: number): number => {
    const baseSteps = ACTIVITY_LEVEL_STEPS[activityLevel] || 5000;
    const workoutBonus = workoutsCompleted * 500;
    return baseSteps + workoutBonus;
};

const getLocalDateString = (date: Date, timezoneOffsetMinutes: number): string => {
    // Shift the UTC time of the date object by the user's timezone offset in minutes.
    // e.g. standard getTimezoneOffset() is -180 for GMT+3.
    // We expect the client to pass either positive offset (+180) or negative (-180).
    // Let's standardise: if the user passes positive timezoneOffset (e.g. +180), we add it.
    // To be completely robust and support both, we shift the date correctly.
    const shiftedTime = date.getTime() + (timezoneOffsetMinutes * 60 * 1000);
    const shiftedDate = new Date(shiftedTime);
    
    const year = shiftedDate.getUTCFullYear();
    const month = String(shiftedDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(shiftedDate.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getDaysBetween = (dateStr1: string, dateStr2: string): number => {
    const d1 = new Date(`${dateStr1}T00:00:00.000Z`);
    const d2 = new Date(`${dateStr2}T00:00:00.000Z`);
    const diffMs = d1.getTime() - d2.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
};

const getLocalMonthBounds = (
    month: number,
    year: number,
    timezoneOffsetMinutes: number
): { start: Date; end: Date } => {
    const offsetMs = timezoneOffsetMinutes * 60 * 1000;
    return {
        start: new Date(Date.UTC(year, month, 1, 0, 0, 0, 0) - offsetMs),
        end: new Date(Date.UTC(year, month + 1, 1, 0, 0, 0, 0) - offsetMs - 1),
    };
};

export const getInsights = async (userId: string): Promise<InsightsResult> => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    const workoutPlan = await require('../models/fitness.model').default.findOne({
        userId,
        isActive: true,
    });

    const today = new Date().toISOString().split('T')[0];
    const todaysWorkoutsCompleted = workoutPlan?.sessions.filter(
        (s: any) => s.isCompleted && new Date(s.completedAt || '').toISOString().split('T')[0] === today
    ).length || 0;

    const estimatedSteps = calculateEstimatedSteps(user.activityLevel || 'moderate', todaysWorkoutsCompleted);
    const estimatedWater = Math.round(((user.weight || 150) * 0.5 + (user.activityLevel === 'very_active' ? 16 : user.activityLevel === 'active' ? 8 : 0)) * 29.5735);

    return {
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        totalPoints: user.totalPoints || 0,
        pointsToRedeem: user.pointsToRedeem || 0,
        estimatedSteps,
        estimatedSleepHours: user.estimatedSleepHours || 7.5,
        estimatedWaterMl: estimatedWater,
        userEstimatedSteps: user.estimatedSteps || 5000,
    };
};

export const awardPoints = async (userId: string, amount: number, reason: string): Promise<{ totalPoints: number; pointsToRedeem: number }> => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    user.totalPoints = (user.totalPoints || 0) + amount;
    user.pointsToRedeem = (user.pointsToRedeem || 0) + amount;

    await user.save();

    return {
        totalPoints: user.totalPoints,
        pointsToRedeem: user.pointsToRedeem,
    };
};

export const recordActivity = async (
    userId: string,
    type: 'check-in' | 'freeze' | 'reward-claimed',
    timezoneOffset: number = 0
): Promise<void> => {
    const dateKey = getLocalDateString(new Date(), timezoneOffset);
    const localDate = new Date(`${dateKey}T00:00:00.000Z`);

    const existing = await Activity.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        date: localDate,
    });

    if (existing) {
        if (type === 'check-in' || existing.type === 'reward-claimed') {
            existing.type = type;
            await existing.save();
        }
    } else {
        await Activity.create({
            userId: new mongoose.Types.ObjectId(userId),
            date: localDate,
            timezoneOffset,
            type,
        });
    }
};

export const getActivityHistory = async (
    userId: string,
    timezoneOffset: number = 0,
    month?: number,
    year?: number
): Promise<ActivityResult> => {
    const now = new Date();
    const localNow = getLocalDateString(now, timezoneOffset);
    const [localYear, localMonth] = localNow.split('-').map(Number);
    const targetYear = year !== undefined ? year : localYear;
    const targetMonth = month !== undefined ? month : localMonth - 1;

    const { start, end } = getLocalMonthBounds(targetMonth, targetYear, timezoneOffset);

    const activities = await Activity.find({
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: start, $lte: end },
        type: { $in: ['check-in', 'freeze'] },
    });

    const activityMap = activities.reduce((acc, act) => {
        const key = getLocalDateString(act.date, timezoneOffset);
        acc[key] = act.type;
        return acc;
    }, {} as Record<string, string>);

    const totalCheckIns = await Activity.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
        type: 'check-in',
    });

    return {
        activities: Object.entries(activityMap).map(([date, type]) => ({ date, type })),
        totalCheckIns,
    };
};

export const checkIn = async (
    userId: string,
    timezoneOffset: number = 0
): Promise<CheckInResult> => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    const now = new Date();
    const lastCheckIn = user.lastCheckInDate;

    const isFirstCheckIn = !lastCheckIn;

    const todayStr = getLocalDateString(now, timezoneOffset);

    let newStreak = 1;

    if (lastCheckIn) {
        const lastStr = getLocalDateString(lastCheckIn, timezoneOffset);
        const diffDays = getDaysBetween(todayStr, lastStr);

        // Already checked in today
        if (diffDays === 0) {
            console.log("User already checked in today");
            return {
                currentStreak: user.currentStreak,
                longestStreak: user.longestStreak,
                availableFreezes: user.availableFreezes,
                isFirstCheckIn: false,
                isFrozen: false,
                didCheckIn: false,
            };
        }

        // Consecutive day
        console.log("User checked in yesterday", diffDays);
        if (diffDays === 1) {
            newStreak = user.currentStreak + 1;
        } else {
            // Missed days
            newStreak = 1;
        }
    }

    user.currentStreak = newStreak;

    if (newStreak > user.longestStreak) {
        user.longestStreak = newStreak;
    }

    user.lastCheckInDate = now;

    // Reward freeze every 7 days
    if (newStreak % 7 === 0) {
        user.availableFreezes += 1;
    }

    await user.save();

    await recordActivity(userId, 'check-in', timezoneOffset);

    return {
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        availableFreezes: user.availableFreezes,
        isFirstCheckIn,
        isFrozen: false,
        didCheckIn: true,
    };
};

export const useFreeze = async (userId: string, timezoneOffset: number = 0): Promise<{ success: boolean; availableFreezes: number }> => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    if (user.availableFreezes <= 0) {
        return { success: false, availableFreezes: 0 };
    }

    user.availableFreezes -= 1;
    user.lastCheckInDate = new Date();
    await user.save();

    await recordActivity(userId, 'freeze', timezoneOffset);

    return { success: true, availableFreezes: user.availableFreezes };
};

export const applyStreakFreeze = async (userId: string): Promise<{ success: boolean; currentStreak: number }> => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    if (user.availableFreezes <= 0) {
        return { success: false, currentStreak: user.currentStreak };
    }

    user.availableFreezes -= 1;
    await user.save();

    await recordActivity(userId, 'freeze', 0);

    return { success: true, currentStreak: user.currentStreak };
};

export const resetStreakIfNeeded = async (): Promise<number> => {
    const users = await User.find({ currentStreak: { $gt: 0 } });

    let resetCount = 0;

    for (const user of users) {
        if (!user.lastCheckInDate) continue;

        const now = new Date();
        const hoursSince = (now.getTime() - user.lastCheckInDate.getTime()) / (1000 * 60 * 60);

        if (hoursSince < 48) continue;

        const twoDaysAgo = new Date(now);
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const frozenActivity = await Activity.findOne({
            userId: user._id,
            date: { $gte: twoDaysAgo },
            type: 'freeze',
        });

        if (frozenActivity || user.availableFreezes > 0) {
            if (user.availableFreezes > 0) {
                user.availableFreezes -= 1;
            }
            user.lastCheckInDate = now;
            await user.save();
        } else {
            user.currentStreak = 0;
            await user.save();
            resetCount++;
        }
    }

    return resetCount;
};

export const getRewards = async (userId: string): Promise<RewardWithStatus[]> => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    const catalog = getRewardCatalog();
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const claimedRewards = await UserReward.find({ userId: userObjectId });
    const claimedIds = new Set(claimedRewards.map(r => r.rewardId));

    return catalog.map(reward => {
        const isUnlocked = user.currentStreak >= reward.requiredStreak;
        const isClaimed = claimedIds.has(reward.rewardId);
        const progress = Math.min((user.currentStreak / reward.requiredStreak) * 100, 100);

        return {
            ...reward,
            isUnlocked,
            isClaimed,
            progress,
        };
    });
};

export const claimReward = async (
    userId: string,
    rewardId: string,
    idempotencyKey: string
): Promise<{ success: boolean; message: string; pointsAwarded?: number }> => {
    const user = await User.findById(userId);

    if (!user) {
        throw new Error('User not found');
    }

    const reward = getRewardById(rewardId);

    if (!reward) {
        return { success: false, message: 'Reward not found' };
    }

    if (user.currentStreak < reward.requiredStreak) {
        return { success: false, message: 'Streak requirement not met' };
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const existingClaim = await UserReward.findOne({
        userId: userObjectId,
        rewardId,
    });

    if (existingClaim) {
        return { success: false, message: 'Reward already claimed' };
    }

    try {
        await UserReward.create({
            userId: userObjectId,
            rewardId,
            claimedAt: new Date(),
            idempotencyKey,
        });

        user.totalPoints = (user.totalPoints || 0) + reward.pointsReward;
        user.pointsToRedeem = (user.pointsToRedeem || 0) + reward.pointsReward;
        await user.save();

        await recordActivity(userId, 'reward-claimed', 0);

        return {
            success: true,
            message: `Claimed ${reward.name}!`,
            pointsAwarded: reward.pointsReward
        };
    } catch (error: any) {
        if (error.code === 11000) {
            return { success: false, message: 'Reward already claimed' };
        }
        throw error;
    }
};
