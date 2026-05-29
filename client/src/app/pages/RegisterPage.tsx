import { Auth } from '../components/Auth';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user?.onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  if (user && !user.onboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <Auth
      initialView="register"
      onLogin={() => navigate('/dashboard')}
      onRegister={() => navigate('/onboarding')}
    />
  );
};