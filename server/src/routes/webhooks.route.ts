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

function mapSubscriptionStatus(stripeStatus: string): 'active' | 'trialing' | 'canceled' | 'expired' | 'past_due' {
  const statusMap: Record<string, 'active' | 'trialing' | 'canceled' | 'expired' | 'past_due'> = {
    active: 'active',
    trialing: 'trialing',
    canceled: 'canceled',
    expired: 'expired',
    past_due: 'past_due',
    unpaid: 'past_due',
    incomplete: 'past_due',
    incomplete_expired: 'expired',
  };
  return statusMap[stripeStatus] || 'past_due';
}

async function updateUserSubscription(userId: string, data: {
  status: 'active' | 'trialing' | 'canceled' | 'expired' | 'past_due';
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  subscriptionTier?: 'BASIC' | 'PRO' | 'FAMILY';
  paidPriceId?: string;
  planTier?: string;
}) {
  const user = await User.findById(userId);
  if (!user) {
    return null;
  }

  if (!user.subscription) {
    user.subscription = {
      subscriptionTier: 'BASIC',
      status: 'expired',
    } as any;
  }

  const currentStatus = user.subscription.status;
  if ((currentStatus === 'active' || currentStatus === 'trialing') && 
      (data.status === 'past_due' || data.status === 'expired')) {
  } else {
    user.subscription.status = data.status;
  }

  if (data.stripeSubscriptionId) user.subscription.stripeSubscriptionId = data.stripeSubscriptionId;
  if (data.stripeCustomerId) user.subscription.stripeCustomerId = data.stripeCustomerId;
  if (data.currentPeriodEnd) user.subscription.currentPeriodEnd = data.currentPeriodEnd;
  if (data.cancelAtPeriodEnd !== undefined) user.subscription.cancelAtPeriodEnd = data.cancelAtPeriodEnd;
  if (data.subscriptionTier) user.subscription.subscriptionTier = data.subscriptionTier;
  if (data.paidPriceId) user.subscription.paidPriceId = data.paidPriceId;
  if (data.planTier) user.subscription.planTier = data.planTier;

  await user.save();
  return user;
}

const router = Router();

router.post('/', raw({ type: 'application/json' }), async (req: Request, res: Response) => {
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
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        let userId = subscription.metadata?.userId;

        if (!userId && subscription.customer) {
          const user = await User.findOne({ 'subscription.stripeCustomerId': subscription.customer }).select('_id');
          if (user) userId = user._id.toString();
        }

        if (!userId) {
          break;
        }

        const priceId = subscription.items?.data[0]?.price?.id;
        const planTier = subscription.metadata?.planTier;
        const subscriptionTier = planTier
          ? (planTier.toUpperCase() as 'PRO' | 'FAMILY')
          : getSubscriptionTier(priceId);

        await updateUserSubscription(userId, {
          status: mapSubscriptionStatus(subscription.status),
          currentPeriodEnd: subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000)
            : undefined,
          cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer,
          paidPriceId: priceId,
          subscriptionTier,
          planTier,
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        let userId = subscription.metadata?.userId;

        if (!userId && subscription.customer) {
          const user = await User.findOne({ 'subscription.stripeCustomerId': subscription.customer }).select('_id');
          if (user) userId = user._id.toString();
        }

        if (userId) {
          await updateUserSubscription(userId, {
            status: 'expired',
            cancelAtPeriodEnd: false,
          });
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const userId = session.client_reference_id;
        const subscriptionId = session.subscription as string;

        if (!userId || !subscriptionId) {
          break;
        }

        const sub = await stripe.subscriptions.retrieve(subscriptionId) as any;
        const priceId = sub.items?.data[0]?.price?.id;
        const planTier = sub.metadata?.planTier;
        const subscriptionTier = planTier
          ? (planTier.toUpperCase() as 'PRO' | 'FAMILY')
          : getSubscriptionTier(priceId);

        await updateUserSubscription(userId, {
          status: 'active',
          stripeSubscriptionId: subscriptionId,
          stripeCustomerId: session.customer,
          currentPeriodEnd: sub.current_period_end
            ? new Date(sub.current_period_end * 1000)
            : undefined,
          cancelAtPeriodEnd: false,
          paidPriceId: priceId,
          subscriptionTier,
          planTier,
        });
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string;
        const invoiceStatus = invoice.status;

        if (!subscriptionId || invoiceStatus !== 'paid') break;

        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId) as any;
          let userId = sub.metadata?.userId;

          if (!userId && sub.customer) {
            const user = await User.findOne({ 'subscription.stripeCustomerId': sub.customer }).select('_id');
            if (user) userId = user._id.toString();
          }

          if (userId) {
            const priceId = sub.items?.data[0]?.price?.id;
            const planTier = sub.metadata?.planTier;
            const subscriptionTier = planTier
              ? (planTier.toUpperCase() as 'PRO' | 'FAMILY')
              : getSubscriptionTier(priceId);
            const amount = (sub.items?.data[0]?.price?.unit_amount || 0) / 100;

            await updateUserSubscription(userId, {
              status: 'active',
              stripeCustomerId: invoice.customer,
              stripeSubscriptionId: subscriptionId,
              currentPeriodEnd: sub.current_period_end
                ? new Date(sub.current_period_end * 1000)
                : undefined,
              cancelAtPeriodEnd: false,
              subscriptionTier,
              paidPriceId: priceId,
              planTier,
            });

            const userDoc = await User.findById(userId).select('email');
            await SubscriptionTransaction.create({
              userId,
              email: userDoc?.email || invoice.customer_email || 'unknown@njerka.fit',
              amount,
              currency: (sub.currency || 'usd').toUpperCase(),
              status: 'completed',
              planTier: subscriptionTier,
              stripeSubscriptionId: subscriptionId,
              stripeEventId: event.id,
              description: `Invoice paid: ${subscriptionTier} plan`,
            });
          }
        } catch (err) {
          break;
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const userId = sub.metadata?.userId;

          if (userId) {
            await updateUserSubscription(userId, {
              status: 'past_due',
            });
          }
        } catch (err) {
          break;
        }
        break;
      }
    }
  } catch (err) {
    res.status(200).json({ received: true });
    return;
  }

  res.status(200).json({ received: true });
});

export default router;
