import { env } from '../configs/env';
import { Router, Request, Response, raw } from 'express';

import User from '../models/user.model';
import stripe from '../configs/stripe';


const PRICE_ID_TIER_MAP: Record<string, 'PRO' | 'FAMILY'> = {
    'price_1TJWzbRPSIjKJwi65DaSICYd': 'PRO',
    'price_1TJX1mRPSIjKJwi6YpH18JNr': 'FAMILY',
};

function getSubscriptionTier(priceId?: string): 'PRO' | 'FAMILY' | 'BASIC' {
    if (!priceId) return 'BASIC';
    return PRICE_ID_TIER_MAP[priceId] || 'BASIC';
}

const router = Router();

router.post('/', raw({ type: "application/json" }), async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = env.STRIPE_WEBHOOK_SECRET as string;
    const payload = req.body;

    if (!sig) {
        return res.status(400).send('Missing Stripe signature');
    }

    let event: any;

    try {
        event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
            const subscription = event.data.object as any;
            const userId = subscription.metadata?.userId;
            const planId = subscription.metadata?.planId;
            const priceId = subscription.items?.data[0]?.price?.id;
            const subscriptionTier = getSubscriptionTier(priceId);

            if (!userId) break;

            await User.findOneAndUpdate(
                { _id: userId },
                {
                    $set: {
                        'subscription.status': subscription.status === 'active' ? 'active' :
                            subscription.cancel_at_period_end ? 'canceled' : 'past_due',
                        'subscription.currentPeriodEnd': subscription.current_period_end
                            ? new Date(subscription.current_period_end * 1000)
                            : undefined,
                        'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end || false,
                        'subscription.stripeSubscriptionId': subscription.id,

                        'subscription.stripeCustomerId': subscription.customer as string,
                        'subscription.paidPriceId': priceId,
                        'subscription.subscriptionTier': subscriptionTier,
                        'subscription.planId': planId,
                    }
                }
            );

            console.log("updated user subscription with new plan to: ", subscriptionTier);
            break;
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object as any;
            const userId = subscription.metadata?.userId;

            if (userId) {
                await User.findByIdAndUpdate(userId, {
                    $set: {
                        'subscription.status': 'expired',
                        'subscription.cancelAtPeriodEnd': false,
                    }
                });
            }
            console.log("updated user subscription to: expired");
            break;
        }
        case 'checkout.session.completed': {
            const session = event.data.object as any;
            const userId = session.client_reference_id;

            if (userId && session.customer) {
                await User.findByIdAndUpdate(userId, {
                    $set: {
                        'subscription.stripeCustomerId': session.customer as string
                    }
                });
            }
            break;
        }
        case 'invoice.payment_succeeded': {
            const session = event.data.object as any;
            const subscriptionId = session.subscription as string;

            if (subscriptionId) {
                const sub = await stripe.subscriptions.retrieve(subscriptionId);
                const userId = sub.metadata?.userId;

                if (userId) {
                    const priceId = sub.items?.data[0]?.price?.id;
                    const subscriptionTier = getSubscriptionTier(priceId);

                    await User.findByIdAndUpdate(userId, {
                        $set: {
                            'subscription.planId': sub.metadata?.planId,
                            'subscription.status': 'active',
                            'subscription.stripeCustomerId': session.customer as string,
                            'subscription.stripeSubscriptionId': subscriptionId,
                            'subscription.cancelAtPeriodEnd': false,
                            'subscription.subscriptionTier': subscriptionTier,
                        }
                    });

                    console.log("updated user subscription to: ", subscriptionTier);
                }
            }
            break;
        }

        case 'invoice.payment_failed': {
            const session = event.data.object as any;
            const subscriptionId = session.subscription as string;

            if (subscriptionId) {
                const sub = await stripe.subscriptions.retrieve(subscriptionId);
                const userId = sub.metadata?.userId;

                if (userId) {
                    await User.findByIdAndUpdate(userId, {
                        $set: {
                            'subscription.status': 'past_due',
                            'subscription.cancelAtPeriodEnd': false,
                        }
                    });
                    console.log("updated user subscription to: past_due");
                }
            }
            break;
        }
    }

    res.status(200).json({ received: true });
});

export default router;