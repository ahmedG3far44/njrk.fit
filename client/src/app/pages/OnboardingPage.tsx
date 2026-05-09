import { Onboarding as OnboardingComponent } from '../components/Onboarding';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { useEffect } from 'react';

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    } else if (!isLoading && user?.onboardingCompleted) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/30">
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || user?.onboardingCompleted) {
    return null;
  }

  return <OnboardingComponent onComplete={() => navigate('/dashboard')} />;
};