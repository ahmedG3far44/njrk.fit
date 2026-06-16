import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router";
import {
  DashboardLayout,
  FitnessPage,
  GroceryPage,
  InsightsPage,
  LandingPage,
  LoginPage,
  VerifyEmailPage,
  NutritionPage,
  OnboardingPage,
  ProgressPage,
  RegisterPage,
  SchedulePage,
  SettingsPage,
  StreaksPage,
  SubscriptionsPage,
  CommunityPage,
  ResetPasswordPage,
  
} from "./pages";

 
import NotFoundPage from "./pages/NotFoundPage";


import { AdminAuthProvider, useAdminAuth } from "./admin/context/AdminAuthProvider";
import { AdminLayout } from "./admin/components/AdminLayout";
import { AdminLoginPage } from "./admin/pages/AdminLoginPage";
import { AdminDashboardPage } from "./admin/pages/AdminDashboardPage";
import { AdminUsersPage } from "./admin/pages/AdminUsersPage";
import { AdminAnalyticsPage } from "./admin/pages/AdminAnalyticsPage";
import { AdminSubscriptionsPage } from "./admin/pages/AdminSubscriptionsPage";
import { AdminSettingsPage } from "./admin/pages/AdminSettingsPage";

const AdminApp = () => {
  const location = useLocation();
  const adminPath = location.pathname.replace(/^\/admin\/?/, '') || 'dashboard';

  if (adminPath === 'login') {
    return <AdminLoginPage />;
  }

  return (
    <AdminGuard>
      <AdminLayout>
        {adminPath === '' || adminPath === 'dashboard' ? <AdminDashboardPage /> :
         adminPath === 'users' ? <AdminUsersPage /> :
         adminPath === 'analytics' ? <AdminAnalyticsPage /> :
         adminPath === 'subscriptions' ? <AdminSubscriptionsPage /> :
         adminPath === 'settings' ? <AdminSettingsPage /> :
         <AdminDashboardPage />}
      </AdminLayout>
    </AdminGuard>
  );
};

const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAdminAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-forest-canopy border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gravel">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
};

const LanguageWatcher = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en';
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [i18n.language]);

  return null;
};

const App = () => {
  return (
    <BrowserRouter>
      <LanguageWatcher />
      <Routes>
        <Route index path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        
        <Route path="/register" element={<RegisterPage />} />
        
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<InsightsPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="streaks" element={<StreaksPage />} />
          <Route path="nutrition" element={<NutritionPage />} />
          <Route path="community" element={<CommunityPage />} />
          <Route path="fitness" element={<FitnessPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="grocery" element={<GroceryPage />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route
          path="/admin/*"
          element={
            <AdminAuthProvider>
              <AdminApp />
            </AdminAuthProvider>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
