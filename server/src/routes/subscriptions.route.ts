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

        // Handle upgrade/downgrade with proration
        if (user.subscription?.stripeSubscriptionId && user.subscription.planId !== planId) {
            const currentSub = await stripe.subscriptions.retrieve(user.subscription.stripeSubscriptionId);

            // Calculate proration
            const currentPeriodEnd = new Date((currentSub as any).current_period_end * 1000);
            const now = new Date();
            const daysRemaining = Math.ceil((currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const totalDays = Math.ceil((currentPeriodEnd.getTime() - new Date((currentSub as any).current_period_start * 1000).getTime()) / (1000 * 60 * 60 * 24));
            const prorationFraction = daysRemaining / totalDays;

            // Get new price to calculate prorated amount
            const newPrice = await stripe.prices.retrieve(planId);
            const newAmount = newPrice.unit_amount || 0;

            // Calculate prorated charge (only for upgrades)
            const currentPrice = await stripe.prices.retrieve(user.subscription.planId as string);
            const currentAmount = currentPrice.unit_amount || 0;

            const currentPlanTier = getPlanTier(currentPrice.nickname || '');
            const newPlanTier = getPlanTier(newPrice.nickname || '');

            if (newPlanTier > currentPlanTier) {
                const priceDiff = newAmount - currentAmount;
                const proratedAmount = Math.round(priceDiff * prorationFraction / 100);

                // Create invoice item for prorated charge
                await stripe.invoiceItems.create({
                    customer: stripeCustomerId,
                    currency: 'usd',
                    amount: proratedAmount,
                    description: `Prorated charge for upgrade (${daysRemaining} days remaining)`,
                });
            }

            // Update subscription
            const subscription = await stripe.subscriptions.update(user.subscription.stripeSubscriptionId, {
                items: [{ price: planId }],
                proration_behavior: 'create_prorations',
            });

            user.subscription = {
                ...user.subscription,
                planId,
                status: 'active',
                stripeCustomerId,
                stripeSubscriptionId: subscription.id,
                currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
            };
            await user.save();

            res.status(201).json({
                subscriptionId: subscription.id,
                status: 'active',
                prorated: newPlanTier > currentPlanTier,
            });
            return;
        }

        // New subscription
        const subscription = await stripe.subscriptions.create({
            customer: stripeCustomerId,
            items: [{ price: planId }],
            metadata: { userId: userId! },
        });

        user.subscription = {
            planId,
            status: 'active',
            stripeCustomerId,
            stripeSubscriptionId: subscription.id,
            subscriptionTier: "BASIC",
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        };
        await user.save();

        res.status(201).json({
            subscriptionId: subscription.id,
            status: 'active',
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

function getPlanTier(planName: string): number {
    const name = planName.toLowerCase();
    if (name.includes('family') || name.includes('elite')) return 3;
    if (name.includes('pro')) return 2;
    return 1;
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

        res.status(200).json({
            status: user.subscription?.status || 'none',
            planId: user.subscription?.planId,
            currentPeriodEnd: user.subscription?.currentPeriodEnd,
            cancelAtPeriodEnd: user.subscription?.cancelAtPeriodEnd || false,
            subscriptionTier: user.subscription?.subscriptionTier,
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