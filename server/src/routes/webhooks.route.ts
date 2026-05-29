import { env } from '../configs/env';
import { Router, Request, Response, raw } from 'express';

import User from '../models/user.model';
import SubscriptionTransaction from '../models/subscriptionTransaction.model';
import stripe from '../configs/stripe';


const PRICE_ID_TIER_MAP: Record<string, 'PRO' | 'FAMILY'> = {
    [env.STRIPE_PRO_PRICE_ID]: 'PRO',
    [env.STRIPE_FAMILY_PRICE_ID]: 'FAMILY',
};

function getSubscriptionTier(priceId?: string): 'PRO' | 'FAMILY' | 'BASIC' {
    if (!priceId) return 'BASIC';
    return PRICE_ID_TIER_MAP[priceId] || 'BASIC';
}

const TIER_PRICE_MAP: Record<string, { priceId: string; name: string; price: number }> = {
    PRO: {
        priceId: env.STRIPE_PRO_PRICE_ID,
        name: 'Pro',
        price: 19.99,
    },
    family: {
        priceId: env.STRIPE_FAMILY_PRICE_ID,
        name: 'Family',
        price: 29.99,
    },
};

const router = Router();

router.post('/', raw({ type: "application/json" }), async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = env.STRIPE_WEBHOOK_SECRET as string;
    const payload = req.body;

    console.log("webhook payload: ", payload);

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
            const planTier = subscription.metadata?.planTier;
            const priceId = subscription.items?.data[0]?.price?.id;
            const subscriptionTier = planTier
                ? (planTier.toUpperCase() as 'PRO' | 'FAMILY')
                : getSubscriptionTier(priceId);

            if (!userId) break;

            await User.findOneAndUpdate(
                { _id: userId },
                {
                    subscription: {
                        status: subscription.status === 'active' ? 'active' :
                            subscription.cancel_at_period_end ? 'canceled' : 'past_due',
                        currentPeriodEnd: subscription.current_period_end
                            ? new Date(subscription.current_period_end * 1000)
                            : undefined,
                        cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
                        stripeSubscriptionId: subscription.id,
                        stripeCustomerId: subscription.customer,
                        paidPriceId: priceId,
                        subscriptionTier: subscriptionTier,
                        planTier: planTier,
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
                    subscription: {
                        status: 'expired',
                        cancelAtPeriodEnd: false,
                    }
                });
            }
            console.log("updated user subscription to: expired");
            break;
        }
        case 'checkout.session.completed': {
            const session = event.data.object as any;
            const userId = session.client_reference_id;
            const subscriptionId = session.subscription as string;

            console.log("checkout.session.completed: ", session);
            console.log("checkout.session.completed: ", userId);
            console.log("checkout.session.completed: ", subscriptionId);
            console.log("checkout.session.completed: ", session.customer);
            break;
        }
        case 'invoice.payment_succeeded': {
            const invoice = event.data.object as any;
            const subscriptionId = invoice.subscription as string;
            const invoiceStatus = invoice.status;

            if (subscriptionId && invoiceStatus === 'paid') {
                try {
                    const sub = await stripe.subscriptions.retrieve(subscriptionId) as any;
                    const userId = sub.metadata?.userId;

                    if (userId) {
                        const priceId = sub.items?.data[0]?.price?.id;
                        const planTier = sub.metadata?.planTier;
                        const subscriptionTier = planTier
                            ? (planTier.toUpperCase() as 'PRO' | 'FAMILY')
                            : getSubscriptionTier(priceId);
                        const amount = (sub.items?.data[0]?.price?.unit_amount || 0) / 100;

                        await User.findByIdAndUpdate(userId, {
                            subscription: {
                                planTier: planTier,
                                status: 'active',
                                stripeCustomerId: invoice.customer,
                                stripeSubscriptionId: subscriptionId,
                                currentPeriodEnd: sub.currentPeriodEnd
                                    ? new Date(sub.currentPeriodEnd * 1000)
                                    : undefined,
                                cancelAtPeriodEnd: false,
                                subscriptionTier: subscriptionTier,
                                paidPriceId: priceId,
                            }
                        });

                        const user = await User.findById(userId);
                        if (user) {
                            await SubscriptionTransaction.create({
                                userId: user._id,
                                email: user.email,
                                amount,
                                currency: (sub.currency || 'usd').toUpperCase(),
                                status: 'completed',
                                planTier: subscriptionTier,
                                stripeSubscriptionId: subscriptionId,
                                stripeEventId: event.id,
                                description: `Invoice paid: ${subscriptionTier} plan`,
                            });
                        }

                        console.log("invoice.payment_succeeded: updated user subscription to: ", subscriptionTier);
                    }
                } catch (err) {
                    console.error('Failed to process invoice.payment_succeeded:', err);
                }
            }
            break;
        }

        case 'invoice.payment_failed': {
            const session = event.data.object as any;
            const subscriptionId = session.subscription as string;

            if (subscriptionId) {
                try {
                    const sub = await stripe.subscriptions.retrieve(subscriptionId);
                    const userId = sub.metadata?.userId;

                    if (userId) {
                        await User.findByIdAndUpdate(userId, {
                            subscription: {
                                status: 'past_due',
                                cancelAtPeriodEnd: false,
                            }
                        });
                        console.log("updated user subscription to: past_due");
                    }
                } catch (err) {
                    console.error('Failed to process invoice.payment_failed:', err);
                }
            }
            break;
        }
    }

    res.status(200).json({ received: true });
});

export default router;