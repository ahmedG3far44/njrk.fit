import { Dashboard } from '../components/Dashboard';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export const InsightsPage = () => {
  const navigate = useNavigate();
  const [showFoodCam, setShowFoodCam] = useState(false);
  return (
    <Dashboard
      user={null}
      onChangeView={(v) => navigate(`/dashboard/${v}`)}
      onOpenCam={() => setShowFoodCam(true)}
    />
  );
};