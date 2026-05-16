import { env } from '../configs/env';
import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, type AuthRequest } from '../middlewares/authMiddleware';

import User from '../models/user.model';
import stripe from '../configs/stripe';

const router = Router();


const PRICE_ID_MAP: Record<string, { name: string; price: number }> = {
    'price_1TJWzbRPSIjKJwi65DaSICYd': { name: 'Pro', price: 19.99 },
    'price_1TJX1mRPSIjKJwi6YpH18JNr': { name: 'Family', price: 29.99 },
};

router.post('/create', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId;

        console.log("userId", userId);

        const { planId } = req.body;

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
        }

        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            mode: 'subscription',

            payment_method_types: ['card'],

            line_items: [
                {
                    price: planId,
                    quantity: 1,
                },
            ],

            subscription_data: {
                metadata: {
                    userId: user._id.toString(),
                    planId: planId,
                },
            },

            success_url: `${env.CLIENT_URL}/dashboard/subscriptions?success=true`,
            cancel_url: `${env.CLIENT_URL}/dashboard/subscriptions?canceled=true`,
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

        const planId = user.subscription?.planId;
        const planInfo = planId ? PRICE_ID_MAP[planId] : undefined;

        let cardLast4: string | undefined;
        let subscriptionStartDate: string | undefined;

        if (user.subscription?.stripeSubscriptionId && user.subscription?.status === 'active') {
            const details = await getSubscriptionDetails(user.subscription.stripeSubscriptionId);
            cardLast4 = details.cardLast4;
            subscriptionStartDate = details.subscriptionStartDate;
        }

        res.status(200).json({
            status: user.subscription?.status || 'none',
            planId: planId,
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