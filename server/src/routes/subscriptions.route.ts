import { env } from '../configs/env';
import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, type AuthRequest } from '../middlewares/authMiddleware';

import User from '../models/user.model';
import stripe from '../configs/stripe';

const router = Router();


const TIER_PRICE_MAP: Record<string, { priceId: string; name: string; price: number }> = {
    PRO: {
        priceId: env.STRIPE_PRO_PRICE_ID,
        name: 'Pro',
        price: 19.99,
    },
    FAMILY: {
        priceId: env.STRIPE_FAMILY_PRICE_ID,
        name: 'Family',
        price: 29.99,
    },
};

router.post('/create', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId;

        const { planTier } = req.body;
        const normalizedTier = (planTier as string)?.toUpperCase();

        const tierConfig = TIER_PRICE_MAP[normalizedTier];
        if (!tierConfig) {
            return res.status(400).json({ error: `Invalid plan tier: ${planTier}` });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let stripeCustomerId = user.subscription?.stripeCustomerId;

        if (!stripeCustomerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name,
                metadata: { userId: user._id.toString() },
            });
            stripeCustomerId = customer.id;
            user.subscription.stripeCustomerId = customer.id;
            await user.save();
        }

        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            mode: 'subscription',

            client_reference_id: user._id.toString(),

            payment_method_types: ['card'],

            line_items: [
                {
                    price: tierConfig.priceId,
                    quantity: 1,
                },
            ],

            subscription_data: {
                metadata: {
                    userId: user._id.toString(),
                    planTier: normalizedTier,
                },
            },

            success_url: `${env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${env.CLIENT_URL}/dashboard/subscriptions`,
        });

        res.status(201).json({
            subscriptionId: session.id,
            checkoutUrl: session.url,
            status: 'pending',
        });
    } catch (error) {
        next(error);
    }
});

async function getSubscriptionDetails(stripeSubscriptionId: string) {
    try {
        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        const defaultPaymentMethodId = subscription.default_payment_method as string;

        let cardLast4: string | undefined;

        if (defaultPaymentMethodId) {
            const paymentMethod = await stripe.paymentMethods.retrieve(defaultPaymentMethodId);
            cardLast4 = paymentMethod.card?.last4;
        }

        return {
            cardLast4,
            subscriptionStartDate: new Date(subscription.created * 1000).toISOString(),
        };
    } catch (error) {
        console.error('Error fetching subscription details:', error);
        return { cardLast4: undefined, subscriptionStartDate: undefined };
    }
}

router.post('/cancel', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId;

        const user = await User.findById(userId);
        if (!user || !user.subscription?.stripeSubscriptionId) {
            return res.status(404).json({ error: 'No active subscription' });
        }

        await stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
            cancel_at_period_end: true,
        });

        user.subscription.cancelAtPeriodEnd = true;
        user.subscription.status = 'canceled';
        await user.save();

        res.status(200).json({ message: 'Subscription will cancel at period end' });
    } catch (error) {
        next(error);
    }
});

router.get('/status', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const planTier = user.subscription?.planTier;
        const planInfo = planTier ? TIER_PRICE_MAP[planTier] : undefined;

        let cardLast4: string | undefined;
        let subscriptionStartDate: string | undefined;

        if (user.subscription?.stripeSubscriptionId && user.subscription?.status === 'active') {
            const details = await getSubscriptionDetails(user.subscription.stripeSubscriptionId);
            cardLast4 = details.cardLast4;
            subscriptionStartDate = details.subscriptionStartDate;
        }

        res.status(200).json({
            status: user.subscription?.status || 'none',
            planTier: planTier,
            currentPeriodEnd: user.subscription?.currentPeriodEnd,
            cancelAtPeriodEnd: user.subscription?.cancelAtPeriodEnd || false,
            subscriptionTier: user.subscription?.subscriptionTier,
            cardLast4: cardLast4,
            subscriptionStartDate: subscriptionStartDate,
            planName: planInfo?.name,
            planPrice: planInfo?.price,
        });
    } catch (error) {
        next(error);
    }
});

router.post('/portal', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId;

        const user = await User.findById(userId);

        if (!user || !user.subscription?.stripeCustomerId) {
            return res.status(404).json({ error: 'No billing account found' });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: user.subscription.stripeCustomerId,
            return_url: `${env.CLIENT_URL}/dashboard/subscriptions`,
        });

        res.status(200).json({ url: session.url });
    } catch (error) {
        next(error);
    }
});

export default router;