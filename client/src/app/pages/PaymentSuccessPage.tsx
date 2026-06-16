import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { motion } from 'motion/react';
import { CheckCircle, ArrowRight, LayoutDashboard, CreditCard } from 'lucide-react';
import { useAuth } from '../context/AuthProvider';

export const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const [countdown, setCountdown] = useState(8);
  const { refreshUser } = useAuth();

  useEffect(() => {
    // Proactively refresh the user profile on mount to sync the new subscription tier
    refreshUser().catch((err) => console.error('Failed to refresh user after payment:', err));
  }, [refreshUser]);

  useEffect(() => {
    if (!sessionId) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard/subscriptions', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionId, navigate]);

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-pebble flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-body text-gravel mb-4">No payment session found.</p>
          <Link
            to="/dashboard/subscriptions"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-canopy text-peak-white text-sm font-bold hover:bg-forest-dark transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            View Plans
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pebble flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="bg-peak-white rounded-container border border-limestone shadow-modal p-8 max-w-md w-full text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 16 }}
          className="w-16 h-16 rounded-full bg-forest-floor flex items-center justify-center mx-auto mb-5"
        >
          <CheckCircle className="w-8 h-8 text-forest-canopy" />
        </motion.div>

        <h1 className="text-title text-summit-black font-extrabold mb-2">
          Payment Successful!
        </h1>
        <p className="text-body text-gravel mb-8 leading-relaxed">
          Your subscription has been activated. You now have access to all the premium features included in your plan.
        </p>

        <div className="space-y-3">
          <Link
            to="/dashboard/subscriptions"
            className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-forest-canopy text-peak-white text-sm font-bold hover:bg-forest-dark transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            Manage Subscription
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            to="/dashboard"
            className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl border border-limestone text-summit-black text-sm font-bold hover:bg-pebble transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            Go to Dashboard
          </Link>
        </div>

        <p className="text-label text-dust mt-6">
          Redirecting in <span className="font-semibold text-gravel">{countdown}s</span>
        </p>
      </motion.div>
    </div>
  );
};
