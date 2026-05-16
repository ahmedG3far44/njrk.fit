import User from '../models/user.model';
import SubscriptionTransaction from '../models/subscriptionTransaction.model';

export const getDashboardStats = async () => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    activeUsers,
    newUsers30d,
    totalPlansAgg,
    revenueAgg,
    blockedUsers,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ lastCheckInDate: { $gte: thirtyDaysAgo } }),
    User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
    User.aggregate([
      { $match: { 'subscription.subscriptionTier': { $ne: null } } },
      { $group: { _id: '$subscription.subscriptionTier', count: { $sum: 1 } } },
    ]),
    SubscriptionTransaction.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    User.countDocuments({ isBlocked: true }),
  ]);

  const totalRevenuePeriod = revenueAgg[0]?.total || 0;
  const totalSalesPeriod = revenueAgg[0]?.count || 0;

  const totalPlans: Record<string, number> = { BASIC: 0, PRO: 0, FAMILY: 0 };
  for (const p of totalPlansAgg) {
    if (p._id in totalPlans) totalPlans[p._id] = p.count;
  }

  const churnedUsers = await User.countDocuments({
    'subscription.status': 'canceled',
    updatedAt: { $gte: thirtyDaysAgo },
  });

  const churnRate = totalUsers > 0 ? ((churnedUsers / totalUsers) * 100).toFixed(2) : '0.00';

  const totalSalesAllTime = await SubscriptionTransaction.countDocuments({ status: 'completed' });

  return {
    totalUsers,
    activeUsers,
    newUsers30d,
    blockedUsers,
    totalSalesPeriod,
    totalSalesAllTime,
    totalRevenue: totalRevenuePeriod,
    totalPlans,
    churnRate: parseFloat(churnRate),
  };
};

export const getRevenueData = async (days: number = 30) => {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

  const transactions = await SubscriptionTransaction.aggregate([
    {
      $match: {
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        revenue: { $sum: '$amount' },
        sales: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return transactions.map(t => ({
    date: t._id,
    revenue: t.revenue,
    sales: t.sales,
  }));
};

export const getUserGrowthData = async (days: number = 30) => {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

  const data = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return data.map(d => ({
    date: d._id,
    count: d.count,
  }));
};

export const getSubscriptionDistribution = async () => {
  const data = await User.aggregate([
    { $match: { 'subscription.subscriptionTier': { $ne: null } } },
    { $group: { _id: '$subscription.subscriptionTier', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);

  const total = data.reduce((acc, d) => acc + d.count, 0);
  return data.map(d => ({
    tier: d._id,
    count: d.count,
    percentage: total > 0 ? Math.round((d.count / total) * 100) : 0,
  }));
};

export const getRecentTransactions = async (limit: number = 50) => {
  const transactions = await SubscriptionTransaction.find()
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'name email')
    .lean();

  return transactions;
};
