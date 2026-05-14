import { Layout } from '../components/Layout';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { useEffect } from 'react';

export const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  const currentPath = location.pathname.replace('/dashboard/', '') || 'dashboard';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  const handleChangeView = (view: string) => {
    navigate(`/dashboard/${view}`);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout currentView={currentPath} onChangeView={handleChangeView} onLogout={handleLogout}>
      <Outlet />
    </Layout>
  );
};