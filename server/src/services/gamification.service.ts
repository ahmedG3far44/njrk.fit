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
}

interface InsightsResult {
    currentStreak: number;
    longestStreak: number;
    totalPoints: number;
    pointsToRedeem: number;
    estimatedSteps: number;
    estimatedSleepHours: number;
    estimatedWaterOz: number;
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

const getUserLocalDate = (timezoneOffset: number): Date => {
    const now = new Date();
    const utc = now.getTime();
    const localTime = utc + (timezoneOffset * 60000);
    return new Date(localTime);
};

const getDateKey = (date: Date, timezoneOffset: number): string => {
    const localDate = getUserLocalDate(timezoneOffset);
    return localDate.toISOString().split('T')[0];
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
    const estimatedWater = Math.round((user.weight || 150) * 0.5) + (user.activityLevel === 'very_active' ? 16 : user.activityLevel === 'active' ? 8 : 0);

    return {
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        totalPoints: user.totalPoints || 0,
        pointsToRedeem: user.pointsToRedeem || 0,
        estimatedSteps,
        estimatedSleepHours: user.estimatedSleepHours || 7.5,
        estimatedWaterOz: estimatedWater,
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
    const dateKey = getDateKey(new Date(), timezoneOffset);
    const localDate = new Date(dateKey);

    const existing = await Activity.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        date: localDate,
    });

    if (existing) {
        existing.type = type;
        await existing.save();
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
    const targetYear = year || now.getFullYear();
    const targetMonth = month || now.getMonth();

    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59);

    const activities = await Activity.find({
        userId: new mongoose.Types.ObjectId(userId),
        date: { $gte: startOfMonth, $lte: endOfMonth },
        type: { $in: ['check-in', 'freeze'] },
    });

    const activityMap = activities.reduce((acc, act) => {
        const key = act.date.toISOString().split('T')[0];
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

    // Convert dates to user's local timezone
    const nowLocal = new Date(now.getTime() + timezoneOffset * 60 * 1000);

    let newStreak = 1;

    if (lastCheckIn) {
        const lastLocal = new Date(
            lastCheckIn.getTime() + timezoneOffset * 60 * 1000
        );

        // Remove time part
        const nowDate = new Date(
            nowLocal.getFullYear(),
            nowLocal.getMonth(),
            nowLocal.getDate()
        );

        const lastDate = new Date(
            lastLocal.getFullYear(),
            lastLocal.getMonth(),
            lastLocal.getDate()
        );

        const diffMs = nowDate.getTime() - lastDate.getTime();

        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        // Already checked in today
        if (diffDays === 0) {
            console.log("User already checked in today");
            return {
                currentStreak: user.currentStreak,
                longestStreak: user.longestStreak,
                availableFreezes: user.availableFreezes,
                isFirstCheckIn: false,
                isFrozen: false,
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