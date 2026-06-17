import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import {
  Shield,
  Crown,
  Sparkles,
  AlertCircle,
  Pause,
  Settings,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Utensils,
  Dumbbell,
  BarChart3,
} from 'lucide-react';
import { subscriptionService, SubscriptionStatus, CreateSubscriptionData } from '../services/subscriptionService';
import { useAuth } from '../context/AuthProvider';
import { useTranslation } from 'react-i18next';
import SubscriptionCard from './SubscriptionCard';
import { Button } from './ui/button';

interface PlanFeature {
  text: string;
  icon: React.ReactNode;
}

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: PlanFeature[];
  isPopular?: boolean;
  isCurrent?: boolean;
  tier: string;
  planTier?: string;
}

function StatusBadge({ status, cancelAtPeriodEnd, currentPeriodEnd }: {
  status: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string;
}) {
  const { t } = useTranslation();
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
    active: {
      bg: 'bg-green-100', text: 'text-green-700',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: t('subscriptions.statusActive'),
    },
    past_due: {
      bg: 'bg-orange-100', text: 'text-orange-700',
      icon: <AlertCircle className="w-3.5 h-3.5" />, label: t('subscriptions.statusPastDue'),
    },
    canceled: {
      bg: 'bg-red-100', text: 'text-red-700',
      icon: <XCircle className="w-3.5 h-3.5" />, label: t('subscriptions.statusCanceled'),
    },
    trialing: {
      bg: 'bg-blue-100', text: 'text-blue-700',
      icon: <Clock className="w-3.5 h-3.5" />, label: t('subscriptions.statusTrial'),
    },
    incomplete: {
      bg: 'bg-slate-100', text: 'text-slate-700',
      icon: <Clock className="w-3.5 h-3.5" />, label: t('subscriptions.statusIncomplete'),
    },
    none: {
      bg: 'bg-slate-100', text: 'text-slate-600',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: t('subscriptions.statusFree'),
    },
  };

  const c = config[status] || config.incomplete;

  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${c.bg} ${c.text}`}>
        {c.icon}
        {c.label}
      </span>
      {cancelAtPeriodEnd && currentPeriodEnd && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
          <Clock className="w-3.5 h-3.5" />
          {t('common.ends')} {new Date(currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-pulse">
      <div className="bg-slate-100 rounded-2xl h-20" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-slate-200 rounded-xl overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-white px-5 py-4">
            <div className="h-3 w-16 bg-slate-200 rounded mb-2" />
            <div className="h-4 w-24 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
      <div className="h-10 w-40 bg-slate-200 rounded-xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        <div className="border border-slate-200 rounded-xl p-8 space-y-4">
          <div className="h-5 w-12 bg-slate-200 rounded" />
          <div className="h-8 w-24 bg-slate-200 rounded" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 w-48 bg-slate-200 rounded" />
            ))}
          </div>
          <div className="h-12 w-full bg-slate-200 rounded-xl" />
        </div>
        <div className="border border-slate-200 rounded-xl p-8 space-y-4">
          <div className="h-5 w-16 bg-slate-200 rounded" />
          <div className="h-8 w-24 bg-slate-200 rounded" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 w-48 bg-slate-200 rounded" />
            ))}
          </div>
          <div className="h-12 w-full bg-slate-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export const Subscription: React.FC = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [showCancelDetails, setShowCancelDetails] = useState(false);
  const { user } = useAuth();
  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await subscriptionService.getStatus();
      setSubscriptionStatus(status);
    } catch (err) {
      console.error('Failed to fetch subscription status:', err);
      setError(t('subscriptions.failedToOpen'));
    } finally {
      setLoading(false);
    }
  };

  const plans: PricingPlan[] = [
    {
      id: 'BASIC',
      name: t('subscriptions.basicTier'),
      price: 0,
      period: t('subscriptions.perMonth'),
      tier: 'BASIC',
      isPopular: false,
      isCurrent: subscriptionStatus?.subscriptionTier?.toUpperCase() === 'BASIC',
      features: [
        { text: t('subscriptions.basicAIMeal'), icon: <Sparkles className="w-4 h-4" /> },
        { text: t('subscriptions.basicWorkoutLib'), icon: <Dumbbell className="w-4 h-4" /> },
        { text: t('subscriptions.basicTracking'), icon: <BarChart3 className="w-4 h-4" /> },
        { text: t('subscriptions.basicCommunity'), icon: <Users className="w-4 h-4" /> },
      ],
    },
    {
      id: import.meta.env.VITE_PRO_PLAN_PRICE_ID as string || 'PRO',
      name: t('subscriptions.proTier'),
      price: 19.99,
      period: t('subscriptions.perMonth'),
      tier: 'PRO',
      planTier: 'PRO',
      features: [
        { text: t('subscriptions.proAIMeal'), icon: <Sparkles className="w-4 h-4" /> },
        { text: t('subscriptions.proWorkoutLib'), icon: <Dumbbell className="w-4 h-4" /> },
        { text: t('subscriptions.proFoodScanner'), icon: <Utensils className="w-4 h-4" /> },
        { text: t('subscriptions.proAnalytics'), icon: <BarChart3 className="w-4 h-4" /> },
        { text: t('subscriptions.proPrioritySupport'), icon: <Crown className="w-4 h-4" /> },
      ],
      isPopular: true,
      isCurrent: subscriptionStatus?.subscriptionTier?.toUpperCase() === 'PRO',
    },
    {
      id: import.meta.env.VITE_FAMILY_PLAN_PRICE_ID as string || 'family',
      name: t('subscriptions.familyTier'),
      price: 29.99,
      period: t('subscriptions.perMonth'),
      tier: 'family',
      planTier: 'family',
      features: [
        { text: t('subscriptions.familyMembers'), icon: <Users className="w-4 h-4" /> },
        { text: t('subscriptions.familyGrocery'), icon: <Utensils className="w-4 h-4" /> },
        { text: t('subscriptions.familyChallenges'), icon: <Crown className="w-4 h-4" /> },
        { text: t('subscriptions.familyCalories'), icon: <BarChart3 className="w-4 h-4" /> },
        { text: t('subscriptions.familyControls'), icon: <Shield className="w-4 h-4" /> },
        { text: t('subscriptions.familyDietitian'), icon: <Sparkles className="w-4 h-4" /> },
      ],
      isCurrent: subscriptionStatus?.subscriptionTier?.toUpperCase() === 'FAMILY',
    },
  ];

  const currentTier = subscriptionStatus?.subscriptionTier?.toUpperCase();

  const availablePlans = plans.filter(plan => {
    if (plan.tier === 'BASIC') return false;
    if (currentTier === 'PRO') return plan.tier === 'family';
    if (currentTier === 'FAMILY') return false;
    return true;
  });

  const isPaidTier = ['PRO', 'FAMILY'].includes(currentTier ?? '');
  const showCancelButton = isPaidTier;
  const isFamilyPlan = currentTier === 'FAMILY';
  const isCanceled = subscriptionStatus?.cancelAtPeriodEnd;
  const isPastDue = subscriptionStatus?.status === 'past_due';

  const currentPlan = plans.find(p => p.tier.toUpperCase() === subscriptionStatus?.subscriptionTier?.toUpperCase()) || plans[0];
  const displayPlanName = subscriptionStatus?.planName || currentPlan.name;
  const displayPlanPrice = subscriptionStatus?.planPrice || currentPlan.price;

  const handleSubscribe = async (plan: PricingPlan) => {
    if (plan.price === 0 || plan.isCurrent) return;
    setSubscribing(true);
    try {
      const data: CreateSubscriptionData = { planTier : plan.planTier? plan.planTier : "FAMILY" };
      const response = await subscriptionService.create(data);
      if (response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      } else if (response.subscriptionId) {
        toast.success(`${t('subscriptions.subscribe')} ${plan.name}`);
        await fetchSubscriptionStatus();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || t('subscriptions.failedToOpen');
      toast.error(msg);
    } finally {
      setSubscribing(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const isBasic = currentTier === 'BASIC';
      if (isBasic) {
        try {
          const { url } = await subscriptionService.getPortal();
          window.location.href = url;
          return;
        } catch {
          const data: CreateSubscriptionData = { planTier: "BASIC" };
          const response = await subscriptionService.create(data);
          if (response.checkoutUrl) {
            window.location.href = response.checkoutUrl;
            return;
          }
        }
      }
      const { url } = await subscriptionService.getPortal();
      window.location.href = url;
    } catch {
      toast.error(t('subscriptions.failedToOpen'));
    }
  };

  const handleCancelSubscription = async () => {
    setCanceling(true);
    try {
      await subscriptionService.cancel();
      toast.success(t('subscriptions.cancelEndOfPeriod'));
      await fetchSubscriptionStatus();
      setShowCancelDetails(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || t('subscriptions.failedToCancel');
      toast.error(msg);
    } finally {
      setCanceling(false);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <p className="text-slate-600 font-medium mb-4">{error}</p>
        <Button variant="primary" onClick={fetchSubscriptionStatus}>
          <Loader2 className="w-4 h-4" />
          {t('common.tryAgain')}
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Status header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-100 rounded-2xl px-6 py-5 flex items-center justify-between flex-wrap gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-700 flex items-center justify-center">
            <Crown className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">{t('subscriptions.currentPlan')}</p>
            <h2 className="text-lg font-bold text-slate-900">{displayPlanName}</h2>
          </div>
        </div>
        <StatusBadge
          status={subscriptionStatus?.status || 'none'}
          cancelAtPeriodEnd={isCanceled}
          currentPeriodEnd={subscriptionStatus?.currentPeriodEnd}
        />
      </motion.div>

      {/* Past due banner */}
      {isPastDue && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-orange-900 text-sm">{t('subscriptions.pastDueTitle')}</p>
            <p className="text-sm text-orange-700 mt-0.5">
              {t('subscriptions.pastDueDesc')}
            </p>
          </div>
        </motion.div>
      )}

      {/* Metrics row */}
      <dl className="grid grid-cols-2 md:grid-cols-5 gap-px bg-slate-200 rounded-xl overflow-hidden">
        <div className="bg-white px-5 py-4">
          <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('subscriptions.started')}</dt>
          <dd className="text-sm font-bold text-slate-900 mt-1">
            {subscriptionStatus?.subscriptionStartDate
              ? formatDate(subscriptionStatus.subscriptionStartDate)
              : t('subscriptions.na')}
          </dd>
        </div>
        <div className="bg-white px-5 py-4">
          <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('subscriptions.nextCharge')}</dt>
          <dd className="text-sm font-bold text-slate-900 mt-1">
            {subscriptionStatus?.currentPeriodEnd
              ? formatDate(subscriptionStatus.currentPeriodEnd)
              : t('subscriptions.na')}
          </dd>
        </div>
        <div className="bg-white px-5 py-4">
          <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('subscriptions.amount')}</dt>
          <dd className="text-sm font-bold text-slate-900 mt-1">
            {displayPlanPrice === 0 ? t('subscriptions.statusFree') : `$${displayPlanPrice}/mo`}
          </dd>
        </div>
        <div className="bg-white px-5 py-4">
          <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('subscriptions.billing')}</dt>
          <dd className="text-sm font-bold text-slate-900 mt-1 capitalize">
            {subscriptionStatus?.status === 'active' ? t('subscriptions.monthly') : t('subscriptions.na')}
          </dd>
        </div>
        <div className="bg-white px-5 py-4">
          <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{t('subscriptions.payment')}</dt>
          <dd className="text-sm font-bold text-slate-900 mt-1">
            {subscriptionStatus?.cardLast4 ? `•••• ${subscriptionStatus.cardLast4}` : 'Stripe'}
          </dd>
        </div>
      </dl>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {user?.subscription?.subscriptionTier !== "BASIC" && (
          <Button variant="primary" onClick={handleManageSubscription}>
            <Settings className="w-4 h-4" />
            {t('subscriptions.manageStripe')}
          </Button>
        )}
        {showCancelButton && !isCanceled && (
          <Button variant="secondary" onClick={() => setShowCancelDetails(v => !v)}>
            <Pause className="w-4 h-4" />
            {t('subscriptions.cancelPlan')}
          </Button>
        )}
      </div>

      {/* Inline cancel confirmation */}
      {showCancelDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-orange-50 border border-orange-200 rounded-xl p-5 overflow-hidden"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-orange-900">
                {t('subscriptions.yourSubEnds')}{' '}
                {subscriptionStatus?.currentPeriodEnd
                  ? formatDate(subscriptionStatus.currentPeriodEnd)
                  : t('subscriptions.na')}
              </p>
              <p className="text-sm text-orange-700 mt-0.5">{t('subscriptions.keepAccessUntil')}</p>
              <div className="flex flex-wrap gap-3 mt-4">
                <Button variant="destructive" loading={canceling} onClick={handleCancelSubscription}>
                  {canceling ? t('subscriptions.processing') : <><Pause className="w-4 h-4" /> {t('subscriptions.yesCancel')}</>}
                </Button>
                <Button variant="secondary" className="border-orange-300 text-orange-800 hover:bg-orange-100" onClick={() => setShowCancelDetails(false)}>
                  {t('subscriptions.keepMyPlan')}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Upgrade header */}
      {isFamilyPlan ? (
        <div className="pt-4 text-center">
          <h2 className="text-xl font-bold text-slate-900">
            {t('subscriptions.manageYourPlan')}
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-lg mx-auto">
            {t('subscriptions.manageYourPlanDesc')}
          </p>
        </div>
      ) : (
        <div className="pt-4 text-center">
          <h2 className="text-xl font-bold text-slate-900">
            {isPaidTier ? t('subscriptions.upgradePlan') : t('subscriptions.choosePlan')}
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-lg mx-auto">
            {isPaidTier
              ? `${t('subscriptions.onPlan')} ${currentPlan.name}. ${t('subscriptions.unlockMore')}`
              : t('subscriptions.unlockFeatures')}
          </p>
        </div>
      )}

      {/* Plan grid */}
      <PricingSection availablePlans={availablePlans} isFamilyPlan={isFamilyPlan} subscribing={subscribing} handleSubscribe={handleSubscribe} />
    </div>
  );
};


export function PricingSection({
  availablePlans,
  isFamilyPlan,
  subscribing,
  handleSubscribe
}: {
  availablePlans: any[];
  isFamilyPlan: boolean;
  subscribing: boolean;
  handleSubscribe: (plan: any) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
      {availablePlans.map((plan, index) => (
        <SubscriptionCard
          key={plan.id}
          plan={plan}
          index={index}
          subscribing={subscribing}
          isFamilyPlan={isFamilyPlan}
          onSubscribe={handleSubscribe}
        />
      ))}
    </div>
  );
}
