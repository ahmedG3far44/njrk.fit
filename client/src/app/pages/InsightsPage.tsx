import { Dashboard } from '../components/Dashboard';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthProvider';

export const InsightsPage = () => {
  const navigate = useNavigate();
  const [showFoodCam, setShowFoodCam] = useState(false);
  const { user } = useAuth();
  return (
    <Dashboard
      user={user}
      onChangeView={(v) => navigate(`/dashboard/${v}`)}
      onOpenCam={() => setShowFoodCam(true)}
    />
  );
};