import { Auth } from '../components/Auth';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user?.onboardingCompleted) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  if (user && !user.onboardingCompleted) {
    navigate('/onboarding', { replace: true });
    return null;
  }

  return (
    <Auth
      initialView="register"
      onLogin={() => navigate('/dashboard')}
      onRegister={() => navigate('/onboarding')}
    />
  );
};