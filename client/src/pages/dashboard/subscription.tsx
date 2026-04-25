import { useState, useMemo } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { subscriptionService } from '../../services/subscription'
import { Check, Shield, Crown, Loader2 } from 'lucide-react'
// import { useAuth } from '../../contexts/AuthContext'

const useMockData = true

type PlanTier = 'BASIC' | 'PRO' | 'FAMILY'

interface Plan {
  id: string
  name: PlanTier
  price: number
  stripePriceId: string
  features: string[]
}

const plans: Plan[] = [
  {
    id: 'basic',
    name: 'BASIC',
    price: 9.99,
    stripePriceId: 'price_basic',
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
  subscriptionTier: 'PRO' as const,
}

const getNextChargeDate = (dateStr?: string): string => {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const SubscriptionPage = () => {
  // const { user } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  console.log("selected plan")
  console.log(selectedPlan);

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
    onSuccess: () => {
      refetch()
    },
  })

  const cancelMutation = useMutation({
    mutationFn: subscriptionService.cancel,
    onSuccess: () => {
      refetch()
      setShowCancelConfirm(false)
    },
  })

  const portalMutation = useMutation({
    mutationFn: subscriptionService.createPortalSession,
    onSuccess: (data) => {
      window.location.href = data.url
    },
  })

  const handleSubscribe = async (plan: Plan) => {
    setSelectedPlan(plan.id)
    try {
      await createMutation.mutateAsync(plan.stripePriceId)
    } catch (error) {
      console.error('Subscription error:', error)
    }
  }

  const handleCancel = () => {
    cancelMutation.mutate()
  }

  const handleManageBilling = () => {
    portalMutation.mutate()
  }

  const isActive = subscription?.status === 'active'
  const isCancelled = subscription?.cancelAtPeriodEnd

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subscription</h1>
      </div>

      {isActive && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold">
                  Current Plan: {currentPlan?.name || subscription?.subscriptionTier || 'Free'}
                </h2>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {isCancelled ? 'Cancels Soon' : 'Active'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-6 mt-4">
                <div>
                  <p className="text-sm text-gray-500">Next Charge Date</p>
                  <p className="font-medium">{getNextChargeDate(subscription?.currentPeriodEnd)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium">${currentPlan?.price.toFixed(2) || '0.00'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Billing Cycle</p>
                  <p className="font-medium">Monthly</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCancelConfirm(true)}
                className="px-4 py-2 text-red-600 font-medium hover:underline"
              >
                Cancel Subscription
              </button>
              <button
                onClick={handleManageBilling}
                disabled={portalMutation.isPending}
                className="px-4 py-2 border border-purple-600 text-purple-600 rounded-xl font-medium hover:bg-purple-50"
              >
                {portalMutation.isPending ? 'Loading...' : 'Manage Billing'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <p className="text-orange-700">
            Your subscription will cancel on {getNextChargeDate(subscription?.currentPeriodEnd)}.
            You'll keep access until then.
          </p>
        </div>
      )}

      <div>
        <h3 className="text-lg font-semibold mb-4">Available Plans</h3>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const planOrder = getPlanOrder(plan.name as PlanTier)
            const currentOrder = getPlanOrder(currentTier)
            const isCurrentPlan = plan.name === currentTier
            const isDowngrade = planOrder < currentOrder
            const isPopular = plan.name === 'PRO'

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl p-6 ${isCurrentPlan
                    ? 'border-2 border-purple-500 bg-purple-50'
                    : isPopular
                      ? 'bg-gradient-to-br from-purple-600 to-purple-800 text-white'
                      : 'bg-white border border-gray-200'
                  }`}
              >
                {isPopular && !isCurrentPlan && (
                  <div className="absolute -top-3 right-4">
                    <span className="px-3 py-1 bg-yellow-400 text-purple-900 text-xs font-bold rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-3 left-4">
                    <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                      <Crown className="w-3 h-3" />
                      CURRENT
                    </span>
                  </div>
                )}

                <div className={`text-2xl font-bold ${isPopular && !isCurrentPlan ? 'text-white' : ''}`}>
                  {plan.name}
                </div>
                <div className={`text-4xl font-bold mt-2 ${isPopular && !isCurrentPlan ? 'text-white' : ''}`}>
                  ${plan.price}
                  <span className={`text-sm font-normal ${isPopular && !isCurrentPlan ? 'text-purple-200' : 'text-gray-500'}`}>
                    /month
                  </span>
                </div>

                <ul className={`mt-6 space-y-3 ${isPopular && !isCurrentPlan ? 'text-purple-100' : ''}`}>
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className={`w-4 h-4 ${isPopular && !isCurrentPlan ? 'text-purple-200' : 'text-green-500'}`} />
                      <span className={isPopular && !isCurrentPlan ? 'text-purple-100' : ''}>{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <button
                    disabled
                    className="w-full mt-6 px-4 py-3 bg-gray-200 text-gray-500 rounded-xl font-medium cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : isDowngrade ? (
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={createMutation.isPending}
                    className="w-full mt-6 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
                  >
                    Downgrade
                  </button>
                ) : (
                  <button
                    onClick={() => handleSubscribe(plan)}
                    disabled={createMutation.isPending}
                    className={`w-full mt-6 px-4 py-3 rounded-xl font-medium ${isPopular
                        ? 'bg-white text-purple-700 hover:bg-gray-100'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                  >
                    {createMutation.isPending ? 'Processing...' : 'Upgrade'}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-gray-500 py-4">
        <Shield className="w-5 h-5" />
        <span className="text-sm">100% Satisfaction Guarantee - Cancel anytime, no questions asked</span>
      </div>

      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">Cancel Subscription?</h3>
            <p className="text-gray-500 mb-6">
              Your subscription will remain active until the end of your current billing period ({getNextChargeDate(subscription?.currentPeriodEnd)}).
              You'll lose access to premium features after that.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50"
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700"
              >
                {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default SubscriptionPage