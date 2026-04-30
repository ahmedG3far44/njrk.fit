import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { subscriptionService } from '../../services/subscription'
import { Check, Shield, Crown, Loader2, Zap, Users, Star, X, ChevronRight, CreditCard } from 'lucide-react'

const useMockData = true

type PlanTier = 'BASIC' | 'PRO' | 'FAMILY'

interface Plan {
  id: string
  name: string
  price: number
  stripePriceId: string
  features: string[]
  icon: React.ReactNode
  tagline: string
  accentColor: string
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'BASIC',
    price: 0.00,
    stripePriceId: 'price_basic',
    tagline: 'Start your journey',
    icon: <Star className="w-5 h-5" />,
    accentColor: 'text-slate-600',
    features: [
      'Basic meal plans',
      'Basic workout plans',
      'Progress tracking',
      'Macro calculator',
      'Recipe database access',
    ],
  },
  {
    id: 'pro',
    name: 'PRO',
    price: 19.99,
    stripePriceId: 'price_pro',
    tagline: 'For serious athletes',
    icon: <Zap className="w-5 h-5" />,
    accentColor: 'text-violet-600',
    features: [
      'Advanced meal plans',
      'Custom workout plans',
      'Priority support',
      'Community access',
      'AI meal generation',
      'Nutrition insights',
      'Advanced analytics',
    ],
  },
  {
    id: 'family',
    name: 'FAMILY',
    price: 39.99,
    stripePriceId: 'price_family',
    tagline: 'Health for everyone',
    icon: <Users className="w-5 h-5" />,
    accentColor: 'text-violet-700',
    features: [
      'Everything in Pro',
      '1-on-1 coaching',
      'Custom nutrition plans',
      'Early access',
      'Family sharing (up to 4)',
      'Priority AI generation',
      'Unlimited history',
    ],
  },
]

const getPlanOrder = (tier: PlanTier): number => {
  if (tier === 'BASIC') return 1
  if (tier === 'PRO') return 2
  return 3
}

const mockSubscription = {
  status: 'active' as const,
  planId: 'price_pro',
  currentPeriodEnd: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
  cancelAtPeriodEnd: false,
  subscriptionTier: 'PRO' as PlanTier,
}

const getNextChargeDate = (dateStr?: string): string => {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const SubscriptionPage = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const { data: apiData, isLoading, refetch } = useQuery({
    queryKey: ['subscription'],
    queryFn: subscriptionService.getStatus,
    enabled: !useMockData,
  })

  const subscription = useMockData ? mockSubscription : apiData

  const currentPlan = useMemo(() => {
    if (!subscription?.planId) return null
    return plans.find(p => p.stripePriceId === subscription.planId)
  }, [subscription])

  const currentTier = subscription?.subscriptionTier || 'BASIC'

  const createMutation = useMutation({
    mutationFn: subscriptionService.create,
    onSuccess: () => { refetch() },
  })

  const cancelMutation = useMutation({
    mutationFn: subscriptionService.cancel,
    onSuccess: () => { refetch(); setShowCancelConfirm(false) },
  })

  const portalMutation = useMutation({
    mutationFn: subscriptionService.createPortalSession,
    onSuccess: (data) => { window.location.href = data.url },
  })

  const handleSubscribe = async (plan: Plan) => {
    setSelectedPlan(plan.id)
    try {
      await createMutation.mutateAsync(plan.stripePriceId)
    } catch (error) {
      console.error('Subscription error:', error)
    }
  }

  const isActive = subscription?.status === 'active'
  const isCancelled = subscription?.cancelAtPeriodEnd

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
          <p className="text-sm text-gray-500 font-medium">Loading your plan...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Subscription</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage your plan and billing details</p>
        </div>

        {/* Current Plan Card */}
        {isActive && (
          <div className="relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Top accent bar */}
            <div className="h-1 w-full" />

            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                {/* Plan Info */}
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-violet-600" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h2 className="text-xl font-bold text-gray-900">
                        {currentPlan?.name || subscription?.subscriptionTier || 'Free'} Plan
                      </h2>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${isCancelled
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-emerald-100 text-emerald-700'
                        }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isCancelled ? 'bg-orange-500' : 'bg-emerald-500'}`} />
                        {isCancelled ? 'Cancels Soon' : 'Active'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{currentPlan?.tagline}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3 sm:flex-shrink-0">

                  <button
                    onClick={() => portalMutation.mutate()}
                    disabled={portalMutation.isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-violet-200 text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-xl text-sm font-semibold transition-colors"
                  >
                    <CreditCard className="w-4 h-4" />
                    {portalMutation.isPending ? 'Loading...' : 'Manage Billing'}
                  </button>
                </div>
              </div>

              {/* Stats row */}
              <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Next Charge</p>
                  <p className="text-sm font-bold text-gray-900">{getNextChargeDate(subscription?.currentPeriodEnd)}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Amount</p>
                  <p className="text-sm font-bold text-gray-900">${currentPlan?.price.toFixed(2) || '0.00'}<span className="text-gray-400 font-normal">/mo</span></p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 col-span-2 sm:col-span-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Billing Cycle</p>
                  <p className="text-sm font-bold text-gray-900">Monthly</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancellation warning */}
        {isCancelled && (
          <div className="flex items-start gap-3 bg-orange-50 border border-orange-200 rounded-xl p-4">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mt-0.5">
              <Shield className="w-4 h-4 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-orange-800">Subscription ending soon</p>
              <p className="text-sm text-orange-700 mt-0.5">
                Your subscription cancels on <strong>{getNextChargeDate(subscription?.currentPeriodEnd)}</strong>. You'll keep full access until then.
              </p>
            </div>
          </div>
        )}

        {/* Plans Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Available Plans</h3>
              <p className="text-sm text-gray-500 mt-0.5">Upgrade or change your plan anytime</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {plans.map((plan) => {
              const planOrder = getPlanOrder(plan.name as PlanTier)
              const currentOrder = getPlanOrder(currentTier as PlanTier)
              const isCurrentPlan = plan.name === currentTier
              const isDowngrade = planOrder < currentOrder
              const isPopular = plan.name === 'PRO'
              const isProcessing = createMutation.isPending && selectedPlan === plan.id

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-2xl transition-all duration-200 ${isCurrentPlan
                    ? 'bg-gradient-to-br from-violet-600 to-purple-700 text-white shadow-lg shadow-violet-200 ring-2 ring-violet-400'
                    : isPopular && !isCurrentPlan
                      ? 'bg-white border-2 border-violet-200 shadow-md hover:shadow-lg hover:border-violet-300'
                      : 'bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                >
                  {/* Popular badge */}
                  {isPopular && !isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1  text-white text-xs font-bold rounded-full shadow-sm whitespace-nowrap">
                        ✦ MOST POPULAR
                      </span>
                    </div>
                  )}

                  {/* Current plan badge */}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-3 py-1 bg-white text-violet-700 text-xs font-bold rounded-full shadow-sm flex items-center gap-1 whitespace-nowrap">
                        <Crown className="w-3 h-3" />
                        CURRENT PLAN
                      </span>
                    </div>
                  )}

                  <div className="p-6 flex flex-col h-full">
                    {/* Plan header */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCurrentPlan ? 'bg-white/20' : 'bg-violet-100'
                        }`}>
                        <span className={isCurrentPlan ? 'text-white' : 'text-violet-600'}>
                          {plan.icon}
                        </span>
                      </div>
                      <div>
                        <p className={`text-xs font-medium uppercase tracking-widest ${isCurrentPlan ? 'text-violet-200' : 'text-gray-400'
                          }`}>
                          {plan.name}
                        </p>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mb-2">
                      <div className="flex items-baseline gap-1">
                        <span className={`text-4xl font-black tracking-tight ${isCurrentPlan ? 'text-white' : 'text-gray-900'
                          }`}>
                          ${plan.price}
                        </span>
                        <span className={`text-sm font-medium ${isCurrentPlan ? 'text-violet-200' : 'text-gray-400'
                          }`}>
                          /month
                        </span>
                      </div>
                      <p className={`text-sm mt-1 ${isCurrentPlan ? 'text-violet-200' : 'text-gray-500'}`}>
                        {plan.tagline}
                      </p>
                    </div>

                    {/* Divider */}
                    <div className={`my-5 border-t ${isCurrentPlan ? 'border-white/20' : 'border-gray-100'}`} />

                    {/* Features */}
                    <ul className="space-y-2.5 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <div className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5 ${isCurrentPlan ? 'bg-white/20' : 'bg-violet-100'
                            }`}>
                            <Check className={`w-2.5 h-2.5 ${isCurrentPlan ? 'text-white' : 'text-violet-600'}`} />
                          </div>
                          <span className={`text-sm leading-snug ${isCurrentPlan ? 'text-violet-100' : 'text-gray-600'
                            }`}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <div className="mt-6">
                      {isCurrentPlan ? (
                        <button
                          disabled
                          className="w-full py-3 rounded-xl text-sm font-semibold bg-white/20 text-white cursor-not-allowed"
                        >
                          Current Plan
                        </button>
                      ) : isDowngrade ? (
                        <button
                          onClick={() => handleSubscribe(plan)}
                          disabled={createMutation.isPending}
                          className="w-full py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          Downgrade to {plan.name}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSubscribe(plan)}
                          disabled={createMutation.isPending}
                          className={`w-full py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 ${isPopular
                            ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700 shadow-md shadow-violet-200'
                            : 'bg-violet-600 text-white hover:bg-violet-700'
                            }`}
                        >
                          {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                          {isProcessing ? 'Processing...' : (
                            <>
                              Upgrade to {plan.name}
                              <ChevronRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Trust footer */}
        <div className="flex items-center justify-center gap-2 py-2">
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-full shadow-sm">
            <Shield className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-medium text-gray-500">100% Satisfaction Guarantee — Cancel anytime, no questions asked</span>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal header */}
            <div className="p-6 pb-0 flex items-start justify-between">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Cancel your subscription?</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Your <strong className="text-gray-700">{currentPlan?.name} plan</strong> will remain active until{' '}
                <strong className="text-gray-700">{getNextChargeDate(subscription?.currentPeriodEnd)}</strong>.
                After that, you'll lose access to premium features.
              </p>

              {/* What you'll lose */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">You'll lose access to</p>
                <ul className="space-y-1.5">
                  {(currentPlan?.features.slice(0, 3) || []).map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <X className="w-3 h-3 text-red-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                  {(currentPlan?.features.length || 0) > 3 && (
                    <li className="text-sm text-gray-400 ml-5">
                      +{(currentPlan?.features.length || 0) - 3} more features
                    </li>
                  )}
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Keep my plan
                </button>
                <button
                  onClick={() => cancelMutation.mutate()}
                  disabled={cancelMutation.isPending}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cancelMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Cancelling...</>
                  ) : 'Yes, cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubscriptionPage