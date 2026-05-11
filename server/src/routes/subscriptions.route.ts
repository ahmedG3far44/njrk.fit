import { env } from '../configs/env';
import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, type AuthRequest } from '../middlewares/authMiddleware';

import stripe from '../configs/stripe';
import User from '../models/user.model';

const router = Router();

router.post('/create', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authReq = req as AuthRequest;
        const userId = authReq.user?.userId;
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

        // Create a Stripe Checkout session for new subscriptions or upgrades
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
            success_url: `${env.CLIENT_URL}/dashboard/subscriptions?success=true`,
            cancel_url: `${env.CLIENT_URL}/dashboard/subscriptions?canceled=true`,
            metadata: {
                userId: userId!,
                planId: planId,
            },
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

router.post('/create-portal-session', authMiddleware, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user._id; // Adjust based on how your auth payload is structured

        // 2. Find the user in your database
        const user = await User.findById(userId);

        // 3. Ensure they actually have a Stripe Customer ID
        if (!user || !user.subscription?.stripeCustomerId) {
            return res.status(400).json({ error: 'No Stripe customer associated with this user.' });
        }

        // 4. Create the Customer Portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: user.subscription.stripeCustomerId,
            // The URL Stripe will send them back to when they click "Return to Njerka.fit"
            return_url: `${env.CLIENT_URL}/dashboard/subscription`,
        });

        // 5. Return the URL to the frontend
        res.status(200).json({ url: session.url });

    } catch (error: any) {
        console.error('Error creating portal session:', error.message);
        res.status(500).json({ error: 'Failed to create billing portal session' });
    }
});

const PRICE_ID_MAP: Record<string, { name: string; price: number }> = {
    'price_1TJWzbRPSIjKJwi65DaSICYd': { name: 'Pro', price: 12 },
    'price_1TJX1mRPSIjKJwi6YpH18JNr': { name: 'Family', price: 24 },
};

function getPlanTier(planName: string): number {
    const name = planName.toLowerCase();
    if (name.includes('family') || name.includes('elite')) return 3;
    if (name.includes('pro')) return 2;
    return 1;
}

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
            return_url: `${env.CLIENT_URL}/dashboard/subscription`,
        });

        res.status(200).json({ url: session.url });
    } catch (error) {
        next(error);
    }
});

export default router;