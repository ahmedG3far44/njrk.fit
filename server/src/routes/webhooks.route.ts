import { Router, Request, Response, NextFunction } from 'express';
import { env } from '../configs/env';
import stripe from '../configs/stripe';
import User from '../models/user.model';

const router = Router();

router.post('/stripe', async (req: Request, res: Response, next: NextFunction) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
            const subscription = event.data.object as any;
            const userId = subscription.metadata?.userId;

            if (userId) {
                await User.findByIdAndUpdate(userId, {
                    'subscription.status': subscription.status === 'active' ? 'active' :
                        subscription.cancel_at_period_end ? 'canceled' : 'past_due',
                    'subscription.currentPeriodEnd': new Date(subscription.current_period_end * 1000),
                    'subscription.cancelAtPeriodEnd': subscription.cancel_at_period_end || false,
                });
            }
            break;
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object as any;
            const userId = subscription.metadata?.userId;

            if (userId) {
                await User.findByIdAndUpdate(userId, {
                    'subscription.status': 'expired',
                    'subscription.cancelAtPeriodEnd': false,
                });
            }
            break;
        }

        case 'invoice.payment_succeeded': {
            const invoice = event.data.object as any;
            const customerId = invoice.customer;

            const subscriptionId = invoice.lines?.data[0]?.subscription;
            if (subscriptionId) {
                const sub = await stripe.subscriptions.retrieve(subscriptionId);
                await User.findOneAndUpdate(
                    { 'subscription.stripeCustomerId': customerId },
                    {
                        'subscription.status': 'active',
                        'subscription.currentPeriodEnd': new Date((sub as any).current_period_end * 1000),
                    }
                );
            }
            break;
        }

        case 'invoice.payment_failed': {
            const invoice = event.data.object as any;
            const customerId = invoice.customer;

            await User.findOneAndUpdate(
                { 'subscription.stripeCustomerId': customerId },
                { 'subscription.status': 'past_due' }
            );
            break;
        }
    }

    res.status(200).json({ received: true });
});

export default router;