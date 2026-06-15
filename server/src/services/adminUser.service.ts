import User from '../models/user.model';
import type { UserQueryInput, BlockUserInput } from '../dtos/admin.dto';

export const getUsers = async (query: UserQueryInput) => {
  const { page, limit, search, tier, status, sort, order, startDate, endDate } = query;

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

export const updateUser = async (id: string, data: { language?: 'en' | 'ar' }) => {
  const user = await User.findById(id);
  if (!user) return { success: false, message: 'User not found' };

  if (data.language) {
    user.language = data.language;
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
    },
  };
};

export const deleteUser = async (id: string) => {
  const user = await User.findById(id);
  if (!user) return { success: false, message: 'User not found' };

  await User.findByIdAndDelete(id);
  return { success: true, message: 'User deleted successfully' };
};
