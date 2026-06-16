import User from '../models/user.model';
import Activity from '../models/activity.model';
import WeeklyFitnessPlan from '../models/fitness.model';
import NutritionPlan from '../models/nutrition.model';
import ProgressLog from '../models/progress.model';
import { Post, Like, Comment, Squad } from '../models/community.model';
import Notification from '../models/notification.model';
import GroceryList from '../models/groceryList.model';
import SharedList from '../models/sharedList.model';
import FamilyInvitation from '../models/familyInvitation.model';
import UserReward from '../models/reward.model';
import SubscriptionTransaction from '../models/subscriptionTransaction.model';
import type { UserQueryInput, BlockUserInput } from '../dtos/admin.dto';

export const getUsers = async (query: UserQueryInput) => {
  const { page, limit, search, tier, provider, status, sort, order, startDate, endDate } = query;

  const filter: Record<string, unknown> = {};

  if (search) {
    const regex = new RegExp(search, 'i');
    filter.$or = [
      { name: regex },
      { email: regex },
    ];
  }

  if (tier) {
    filter['subscription.subscriptionTier'] = tier;
  }

  if (provider === 'google') {
    filter.googleId = { $ne: null };
  } else if (provider === 'email') {
    filter.googleId = null;
  }

  if (status === 'active') {
    filter.isBlocked = { $ne: true };
  } else if (status === 'blocked') {
    filter.isBlocked = true;
  }

  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) (filter.createdAt as Record<string, unknown>).$gte = new Date(startDate);
    if (endDate) (filter.createdAt as Record<string, unknown>).$lte = new Date(endDate);
  }

  const sortObj: Record<string, 1 | -1> = {};
  sortObj[sort] = order === 'asc' ? 1 : -1;

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .select('-passwordHash -googleRefreshToken -googleAccessToken')
      .lean(),
    User.countDocuments(filter),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getUserById = async (id: string) => {
  const user = await User.findById(id)
    .select('-passwordHash -googleRefreshToken -googleAccessToken')
    .lean();
  return user;
};

export const blockUser = async (id: string, data: BlockUserInput) => {
  const user = await User.findById(id);
  if (!user) return { success: false, message: 'User not found' };

  user.isBlocked = true;
  user.blockedAt = new Date();
  user.blockedReason = data.reason;

  const existing: Record<string, unknown> = {};

  if (user.subscription?.stripeSubscriptionId) {
    existing.canceledSubscription = user.subscription.stripeSubscriptionId;
  }
  if (user.subscription) {
    user.subscription.status = 'canceled';
  }

  await user.save();

  return {
    success: true,
    message: 'User blocked successfully',
    user: {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      isBlocked: true,
      ...existing,
    },
  };
};

export const unblockUser = async (id: string) => {
  const user = await User.findById(id);
  if (!user) return { success: false, message: 'User not found' };

  user.isBlocked = false;
  user.blockedAt = null as unknown as Date | undefined;
  user.blockedReason = null as unknown as string | undefined;
  await user.save();

  return {
    success: true,
    message: 'User unblocked successfully',
    user: {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      isBlocked: false,
    },
  };
};

export const updateUser = async (id: string, data: { language?: 'en' | 'ar'; subscriptionTier?: 'BASIC' | 'PRO' | 'FAMILY' }) => {
  const user = await User.findById(id);
  if (!user) return { success: false, message: 'User not found' };

  if (data.language) {
    user.language = data.language;
  }

  if (data.subscriptionTier) {
    if (!user.subscription) {
      user.subscription = {} as NonNullable<typeof user.subscription>;
    }
    user.subscription.subscriptionTier = data.subscriptionTier;
  }

  await user.save();

  return {
    success: true,
    message: 'User updated successfully',
    user: {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      language: user.language,
      subscriptionTier: user.subscription?.subscriptionTier,
    },
  };
};

export const deleteUser = async (id: string) => {
  const user = await User.findByIdAndDelete(id);
  if (!user) return { success: false, message: 'User not found' };

  await Promise.all([
    Activity.deleteMany({ userId: id }),
    WeeklyFitnessPlan.deleteMany({ userId: id }),
    NutritionPlan.deleteMany({ userId: id }),
    ProgressLog.deleteMany({ userId: id }),
    Post.deleteMany({ userId: id }),
    Like.deleteMany({ userId: id }),
    Comment.deleteMany({ userId: id }),
    Squad.deleteMany({ creatorId: id }),
    Squad.updateMany({ members: id }, { $pull: { members: id } }),
    Notification.deleteMany({ userId: id }),
    GroceryList.deleteMany({ userId: id }),
    SharedList.deleteMany({ userId: id }),
    FamilyInvitation.deleteMany({ $or: [{ fromUserId: id }, { toUserId: id }] }),
    UserReward.deleteMany({ userId: id }),
    SubscriptionTransaction.deleteMany({ userId: id }),
    User.updateMany({ familyMembers: id }, { $pull: { familyMembers: id } }),
  ]);

  return { success: true, message: 'User deleted successfully' };
};
