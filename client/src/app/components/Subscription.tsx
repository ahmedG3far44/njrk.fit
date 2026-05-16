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
import SubscriptionCard from './SubscriptionCard';



const FAMILY_PLAN_PRICE_ID = import.meta.env.VITE_FAMILY_PLAN_PRICE_ID as string
const PRO_PLAN_PRICE_ID = import.meta.env.VITE_PRO_PLAN_PRICE_ID as string

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
  priceId?: string;
}

function StatusBadge({ status, cancelAtPeriodEnd, currentPeriodEnd }: {
  status: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd?: string;
}) {
  const config: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
    active: {
      bg: 'bg-green-100', text: 'text-green-700',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: 'Active',
    },
    past_due: {
      bg: 'bg-orange-100', text: 'text-orange-700',
      icon: <AlertCircle className="w-3.5 h-3.5" />, label: 'Past Due',
    },
    canceled: {
      bg: 'bg-red-100', text: 'text-red-700',
      icon: <XCircle className="w-3.5 h-3.5" />, label: 'Canceled',
    },
    trialing: {
      bg: 'bg-blue-100', text: 'text-blue-700',
      icon: <Clock className="w-3.5 h-3.5" />, label: 'Trial',
    },
    incomplete: {
      bg: 'bg-slate-100', text: 'text-slate-700',
      icon: <Clock className="w-3.5 h-3.5" />, label: 'Incomplete',
    },
    none: {
      bg: 'bg-slate-100', text: 'text-slate-600',
      icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: 'Free',
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
          Ends {new Date(currentPeriodEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
      setError('Could not load subscription details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const plans: PricingPlan[] = [
    {
      id: 'BASIC',
      name: 'BASIC',
      price: 0,
      period: 'mo',
      tier: 'BASIC',
      isPopular: false,
      isCurrent: subscriptionStatus?.subscriptionTier?.toUpperCase() === 'BASIC',
      features: [
        { text: 'Basic AI Meal Suggestions', icon: <Sparkles className="w-4 h-4" /> },
        { text: 'Standard Workout Library', icon: <Dumbbell className="w-4 h-4" /> },
        { text: 'Basic Nutrition Tracking', icon: <BarChart3 className="w-4 h-4" /> },
        { text: 'Community Access', icon: <Users className="w-4 h-4" /> },
      ],
    },
    {
      id: 'PRO',
      name: 'Pro',
      price: 19.99,
      period: 'mo',
      tier: 'PRO',
      priceId: PRO_PLAN_PRICE_ID,
      features: [
        { text: 'Unlimited AI Meal Gen', icon: <Sparkles className="w-4 h-4" /> },
        { text: 'Full Workout Library', icon: <Dumbbell className="w-4 h-4" /> },
        { text: 'Advanced Food Scanner', icon: <Utensils className="w-4 h-4" /> },
        { text: 'Detailed Macro Analytics', icon: <BarChart3 className="w-4 h-4" /> },
        { text: 'Priority Support', icon: <Crown className="w-4 h-4" /> },
      ],
      isPopular: true,
      isCurrent: subscriptionStatus?.subscriptionTier?.toUpperCase() === 'PRO',
    },
    {
      id: 'family',
      name: 'Family',
      price: 29.99,
      period: 'mo',
      tier: 'family',
      priceId: FAMILY_PLAN_PRICE_ID,
      features: [
        { text: 'Up to 6 Family Members', icon: <Users className="w-4 h-4" /> },
        { text: 'Unified Grocery List', icon: <Utensils className="w-4 h-4" /> },
        { text: 'Family Challenges', icon: <Crown className="w-4 h-4" /> },
        { text: 'Individual Calorie Targets', icon: <BarChart3 className="w-4 h-4" /> },
        { text: 'Parental Controls', icon: <Shield className="w-4 h-4" /> },
        { text: 'Dietitian Consultation', icon: <Sparkles className="w-4 h-4" /> },
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
  const isFamilyPlan = currentTier === 'PRO';
  const isCanceled = subscriptionStatus?.cancelAtPeriodEnd;
  const isPastDue = subscriptionStatus?.status === 'past_due';

  const currentPlan = plans.find(p => p.tier.toUpperCase() === subscriptionStatus?.subscriptionTier?.toUpperCase()) || plans[0];
  const displayPlanName = subscriptionStatus?.planName || currentPlan.name;
  const displayPlanPrice = subscriptionStatus?.planPrice || currentPlan.price;

  const handleSubscribe = async (plan: PricingPlan) => {
    if (plan.price === 0 || plan.isCurrent) return;
    setSubscribing(true);
    try {
      const data: CreateSubscriptionData = { planId: plan.priceId! };
      const response = await subscriptionService.create(data);
      if (response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
      } else if (response.subscriptionId) {
        toast.success(`Subscribed to ${plan.name} successfully!`);
        await fetchSubscriptionStatus();
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to subscribe';
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
          const data: CreateSubscriptionData = { planId: 'price_1TJWzbRPSIjKJwi65DaSICYd' };
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
      toast.error('Failed to open billing portal');
    }
  };

  const handleCancelSubscription = async () => {
    setCanceling(true);
    try {
      await subscriptionService.cancel();
      toast.success('Subscription will be canceled at the end of the billing period');
      await fetchSubscriptionStatus();
      setShowCancelDetails(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to cancel subscription';
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
        <button
          onClick={fetchSubscriptionStatus}
          className="inline-flex items-center gap-2 bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-green-800 transition-colors"
        >
          <Loader2 className="w-4 h-4" />
          Try again
        </button>
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
            <p className="text-xs font-semibold text-slate-500 tracking-wide uppercase">Current Plan</p>
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
            <p className="font-semibold text-orange-900 text-sm">Payment past due</p>
            <p className="text-sm text-orange-700 mt-0.5">
              Your last payment failed. Update your payment method through the billing portal to continue using all features.
            </p>
          </div>
        </motion.div>
      )}

      {/* Metrics row */}
      <dl className="grid grid-cols-2 md:grid-cols-5 gap-px bg-slate-200 rounded-xl overflow-hidden">
        <div className="bg-white px-5 py-4">
          <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Started</dt>
          <dd className="text-sm font-bold text-slate-900 mt-1">
            {subscriptionStatus?.subscriptionStartDate
              ? formatDate(subscriptionStatus.subscriptionStartDate)
              : 'N/A'}
          </dd>
        </div>
        <div className="bg-white px-5 py-4">
          <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Next Charge</dt>
          <dd className="text-sm font-bold text-slate-900 mt-1">
            {subscriptionStatus?.currentPeriodEnd
              ? formatDate(subscriptionStatus.currentPeriodEnd)
              : 'N/A'}
          </dd>
        </div>
        <div className="bg-white px-5 py-4">
          <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</dt>
          <dd className="text-sm font-bold text-slate-900 mt-1">
            {displayPlanPrice === 0 ? 'Free' : `$${displayPlanPrice}/mo`}
          </dd>
        </div>
        <div className="bg-white px-5 py-4">
          <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Billing</dt>
          <dd className="text-sm font-bold text-slate-900 mt-1 capitalize">
            {subscriptionStatus?.status === 'active' ? 'Monthly' : 'N/A'}
          </dd>
        </div>
        <div className="bg-white px-5 py-4">
          <dt className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Payment</dt>
          <dd className="text-sm font-bold text-slate-900 mt-1">
            {subscriptionStatus?.cardLast4 ? `•••• ${subscriptionStatus.cardLast4}` : 'Stripe'}
          </dd>
        </div>
      </dl>

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {user?.subscription?.subscriptionTier !== "BASIC" && (
          <button
            onClick={handleManageSubscription}
            className="inline-flex items-center gap-2 bg-green-700 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-green-800 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Manage Stripe
          </button>
        )}
        {showCancelButton && !isCanceled && (
          <button
            onClick={() => setShowCancelDetails(v => !v)}
            className="inline-flex items-center gap-2 border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-colors"
          >
            <Pause className="w-4 h-4" />
            Cancel Plan
          </button>
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
                Your subscription will end on{' '}
                {subscriptionStatus?.currentPeriodEnd
                  ? formatDate(subscriptionStatus.currentPeriodEnd)
                  : 'the end of the billing period'}
              </p>
              <p className="text-sm text-orange-700 mt-0.5">You will keep access until then.</p>
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={handleCancelSubscription}
                  disabled={canceling}
                  className="inline-flex items-center gap-2 bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {canceling ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                  ) : (
                    <><Pause className="w-4 h-4" /> Yes, Cancel My Plan</>
                  )}
                </button>
                <button
                  onClick={() => setShowCancelDetails(false)}
                  className="inline-flex items-center gap-2 border border-orange-300 text-orange-800 px-5 py-2.5 rounded-xl font-bold hover:bg-orange-100 transition-colors"
                >
                  Keep My Plan
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Upgrade header */}
      <div className="pt-4 text-center">
        <h2 className="text-xl font-bold text-slate-900">
          {isPaidTier ? 'Upgrade your plan' : 'Choose your plan'}
        </h2>
        <p className="text-sm text-slate-500 mt-1 max-w-lg mx-auto">
          {isPaidTier
            ? `You are on the ${currentPlan.name} plan. Unlock more features with a higher tier.`
            : 'Unlock AI-powered meal plans, advanced analytics, and exclusive workouts.'}
        </p>
      </div>

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