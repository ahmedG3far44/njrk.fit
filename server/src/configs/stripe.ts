import { env } from './env';
import Stripe from 'stripe';

const stripe = new Stripe(env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2026-03-25.dahlia',
});

export default stripe;