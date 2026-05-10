import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { 
  Check, 
  Shield, 
  Crown,
  Sparkles,
  Calendar,
  CreditCard,
  AlertCircle,
  Pause,
  Play,
  Settings,
  Loader2,
  ChevronRight,
  X,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Users,
  Utensils,
  Dumbbell,
  BarChart3
} from 'lucide-react';
import { subscriptionService, SubscriptionStatus, CreateSubscriptionData } from '../services/subscriptionService';

interface PlanFeature {
  text: string;
  icon?: React.ReactNode;
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

export const Subscription: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  const fetchSubscriptionStatus = async () => {
    setLoading(true);
    try {
      const status = await subscriptionService.getStatus();
      setSubscriptionStatus(status);
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      period: 'mo',
      tier: 'free',
      features: [
        { text: 'Basic Meal Tracking', icon: <Utensils className="w-4 h-4" /> },
        { text: '3 Workouts per Week', icon: <Dumbbell className="w-4 h-4" /> },
        { text: 'Community Access', icon: <Users className="w-4 h-4" /> },
        { text: 'Daily Progress Log', icon: <BarChart3 className="w-4 h-4" /> },
      ],
      isCurrent: subscriptionStatus?.subscriptionTier === 'free',
    },
    {
      id: 'pro',
      name: 'Pro',
      price: 12,
      period: 'mo',
      tier: 'pro',
      priceId: 'price_pro_monthly',
      features: [
        { text: 'Unlimited AI Meal Gen', icon: <Sparkles className="w-4 h-4" /> },
        { text: 'Full Workout Library', icon: <Dumbbell className="w-4 h-4" /> },
        { text: 'Advanced Food Scanner', icon: <Utensils className="w-4 h-4" /> },
        { text: 'Detailed Macro Analytics', icon: <BarChart3 className="w-4 h-4" /> },
        { text: 'Priority Support', icon: <Crown className="w-4 h-4" /> },
      ],
      isPopular: true,
      isCurrent: subscriptionStatus?.subscriptionTier === 'pro',
    },
    {
      id: 'family',
      name: 'Family',
      price: 24,
      period: 'mo',
      tier: 'family',
      priceId: 'price_family_monthly',
      features: [
        { text: 'Up to 6 Family Members', icon: <Users className="w-4 h-4" /> },
        { text: 'Unified Grocery List', icon: <Utensils className="w-4 h-4" /> },
        { text: 'Family Challenges', icon: <Crown className="w-4 h-4" /> },
        { text: 'Individual Calorie Targets', icon: <BarChart3 className="w-4 h-4" /> },
        { text: 'Parental Controls', icon: <Shield className="w-4 h-4" /> },
        { text: 'Dietitian Consultation', icon: <Sparkles className="w-4 h-4" /> },
      ],
      isCurrent: subscriptionStatus?.subscriptionTier === 'family',
    },
  ];

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
    } catch (error: any) {
      console.error('Failed to subscribe:', error);
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to subscribe';
      toast.error(errorMsg);
    } finally {
      setSubscribing(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const { url } = await subscriptionService.getPortal();
      window.location.href = url;
    } catch (error) {
      console.error('Failed to open portal:', error);
      toast.error('Failed to open billing portal');
    }
  };

  const handleCancelSubscription = async () => {
    setCanceling(true);
    try {
      await subscriptionService.cancel();
      toast.success('Subscription will be canceled at the end of billing period');
      await fetchSubscriptionStatus();
      setShowCancelModal(false);
    } catch (error: any) {
      console.error('Failed to cancel:', error);
      const errorMsg = error?.response?.data?.message || error?.message || 'Failed to cancel subscription';
      toast.error(errorMsg);
    } finally {
      setCanceling(false);
    }
  };

  const getStatusBadge = () => {
    if (!subscriptionStatus) return null;
    
    const statusConfig: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
      active: { 
        bg: 'bg-green-100', 
        text: 'text-green-700', 
        icon: <CheckCircle2 className="w-4 h-4" />,
        label: 'Active' 
      },
      past_due: { 
        bg: 'bg-orange-100', 
        text: 'text-orange-700', 
        icon: <AlertCircle className="w-4 h-4" />,
        label: 'Past Due' 
      },
      canceled: { 
        bg: 'bg-red-100', 
        text: 'text-red-700', 
        icon: <XCircle className="w-4 h-4" />,
        label: 'Canceled' 
      },
      trialing: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-700', 
        icon: <Play className="w-4 h-4" />,
        label: 'Trial' 
      },
      incomplete: { 
        bg: 'bg-slate-100', 
        text: 'text-slate-700', 
        icon: <Clock className="w-4 h-4" />,
        label: 'Incomplete' 
      },
    };

    const config = statusConfig[subscriptionStatus.status] || statusConfig.incomplete;
    const isCanceled = subscriptionStatus.cancelAtPeriodEnd;

    return (
      <div className="flex items-center gap-2">
        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${config.bg} ${config.text}`}>
          {config.icon}
          {config.label}
        </span>
        {isCanceled && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
            <Clock className="w-4 h-4" />
            Ends on {new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString()}
          </span>
        )}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const currentPlan = plans.find(p => p.tier === subscriptionStatus?.subscriptionTier) || plans[0];
  const isPaidTier = subscriptionStatus?.subscriptionTier === 'pro' || subscriptionStatus?.subscriptionTier === 'family';

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      ) : (
        <>
          {/* Current Subscription Status Card */}
          {isPaidTier && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-500/20 to-transparent rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-green-600/10 to-transparent rounded-full blur-2xl" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <Crown className="w-6 h-6 text-yellow-400" />
                      <span className="text-green-400 font-medium text-sm tracking-wide">CURRENT PLAN</span>
                    </div>
                    <h2 className="text-3xl font-bold">{currentPlan.name}</h2>
                  </div>
                  {getStatusBadge()}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                    <p className="text-slate-400 text-xs font-medium mb-1">Next Charge</p>
                    <p className="font-bold text-lg">
                      {subscriptionStatus?.currentPeriodEnd 
                        ? formatDate(subscriptionStatus.currentPeriodEnd)
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                    <p className="text-slate-400 text-xs font-medium mb-1">Amount</p>
                    <p className="font-bold text-lg">${currentPlan.price}/mo</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                    <p className="text-slate-400 text-xs font-medium mb-1">Billing</p>
                    <p className="font-bold text-lg capitalize">{subscriptionStatus?.status === 'active' ? 'Monthly' : 'N/A'}</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                    <p className="text-slate-400 text-xs font-medium mb-1">Payment</p>
                    <p className="font-bold text-lg flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Stripe
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleManageSubscription}
                    className="flex items-center gap-2 bg-white text-slate-900 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-100 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Manage Billing
                  </button>
                  {!subscriptionStatus?.cancelAtPeriodEnd && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="flex items-center gap-2 bg-white/10 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-white/20 transition-colors"
                    >
                      <Pause className="w-4 h-4" />
                      Cancel Plan
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-slate-900">
              {isPaidTier ? 'Upgrade Your Plan' : 'Choose Your Journey'}
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              {isPaidTier 
                ? `You're on the ${currentPlan.name} plan. Unlock more features or manage your subscription below.`
                : 'Unlock advanced AI insights, unlimited meal generation, and exclusive workout plans.'
              }
            </p>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-8 rounded-3xl border-2 transition-all hover:shadow-xl ${
                  plan.isPopular 
                    ? 'border-green-500 bg-gradient-to-b from-green-50 to-white shadow-lg' 
                    : plan.isCurrent
                    ? 'border-green-300 bg-green-50/50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-600 to-green-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    MOST POPULAR
                  </div>
                )}
                
                {plan.isCurrent && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3" />
                    CURRENT PLAN
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-slate-900">${plan.price}</span>
                    <span className="text-slate-500">/{plan.period}</span>
                  </div>
                </div>
                
                <ul className="space-y-4 mb-8">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-3 text-slate-600">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        plan.isPopular ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {feat.icon || <Check className="w-4 h-4" />}
                      </div>
                      <span className="text-sm">{feat.text}</span>
                    </li>
                  ))}
                </ul>
                
                <button 
                  onClick={() => handleSubscribe(plan)}
                  disabled={plan.isCurrent || subscribing}
                  className={`w-full py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    plan.isCurrent
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : plan.isPopular
                      ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-200'
                      : 'border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {plan.isCurrent ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Current Plan
                    </>
                  ) : subscribing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {plan.price === 0 ? 'Get Started' : 'Subscribe'}
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </motion.div>
            ))}
          </div>

          {/* Trust Badges */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-6 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Secure Payments</h4>
                <p className="text-sm text-slate-500">Powered by Stripe</p>
              </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">14-Day Free Trial</h4>
                <p className="text-sm text-slate-500">Pro plans come with trial</p>
              </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Crown className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900">Cancel Anytime</h4>
                <p className="text-sm text-slate-500">No hidden fees</p>
              </div>
            </div>
          </div>

          {/* Cancel Modal */}
          <AnimatePresence>
            {showCancelModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                onClick={() => setShowCancelModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-slate-900">Cancel Subscription?</h3>
                    <button 
                      onClick={() => setShowCancelModal(false)}
                      className="p-2 hover:bg-slate-100 rounded-xl"
                    >
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-orange-900">Your subscription will end on {subscriptionStatus?.currentPeriodEnd ? formatDate(subscriptionStatus.currentPeriodEnd) : 'the end of billing period'}</p>
                        <p className="text-sm text-orange-700 mt-1">You'll keep access until then.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={handleCancelSubscription}
                      disabled={canceling}
                      className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {canceling ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Pause className="w-5 h-5" />
                          Yes, Cancel My Plan
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowCancelModal(false)}
                      className="w-full py-3 border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                    >
                      Keep My Plan
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};