import { env } from './env';
import Stripe from 'stripe';

const stripe = new Stripe(env.stripeSecretKey, {
    apiVersion: '2026-03-25.dahlia',
});

export default stripe;