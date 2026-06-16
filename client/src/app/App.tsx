import { useEffect, lazy, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router";
import { AdminAuthProvider, useAdminAuth } from "./admin/context/AdminAuthProvider";

const DashboardLayout = lazy(() => import("./pages/DashboardLayout").then(m => ({ default: m.DashboardLayout })));
const InsightsPage = lazy(() => import("./pages/InsightsPage").then(m => ({ default: m.InsightsPage })));
const LandingPage = lazy(() => import("./pages/LandingPage").then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("./pages/RegisterPage").then(m => ({ default: m.RegisterPage })));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage").then(m => ({ default: m.OnboardingPage })));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage").then(m => ({ default: m.VerifyEmailPage })));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage").then(m => ({ default: m.ResetPasswordPage })));
const NutritionPage = lazy(() => import("./pages/NutritionPage").then(m => ({ default: m.NutritionPage })));
const FitnessPage = lazy(() => import("./pages/FitnessPage").then(m => ({ default: m.FitnessPage })));
const GroceryPage = lazy(() => import("./pages/GroceryPage").then(m => ({ default: m.GroceryPage })));
const ProgressPage = lazy(() => import("./pages/ProgressPage").then(m => ({ default: m.ProgressPage })));
const SchedulePage = lazy(() => import("./pages/SchedulePage").then(m => ({ default: m.SchedulePage })));
const StreaksPage = lazy(() => import("./pages/StreaksPage").then(m => ({ default: m.StreaksPage })));
const SettingsPage = lazy(() => import("./pages/SettingsPage").then(m => ({ default: m.SettingsPage })));
const SubscriptionsPage = lazy(() => import("./pages/SubscriptionsPage").then(m => ({ default: m.SubscriptionsPage })));
const PaymentSuccessPage = lazy(() => import("./pages/PaymentSuccessPage").then(m => ({ default: m.PaymentSuccessPage })));
const CommunityPage = lazy(() => import("./pages/CommunityPage").then(m => ({ default: m.CommunityPage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const AdminLayout = lazy(() => import("./admin/components/AdminLayout").then(m => ({ default: m.AdminLayout })));
const AdminLoginPage = lazy(() => import("./admin/pages/AdminLoginPage").then(m => ({ default: m.AdminLoginPage })));
const AdminDashboardPage = lazy(() => import("./admin/pages/AdminDashboardPage").then(m => ({ default: m.AdminDashboardPage })));
const AdminUsersPage = lazy(() => import("./admin/pages/AdminUsersPage").then(m => ({ default: m.AdminUsersPage })));
const AdminAnalyticsPage = lazy(() => import("./admin/pages/AdminAnalyticsPage").then(m => ({ default: m.AdminAnalyticsPage })));
const AdminSubscriptionsPage = lazy(() => import("./admin/pages/AdminSubscriptionsPage").then(m => ({ default: m.AdminSubscriptionsPage })));
const AdminSettingsPage = lazy(() => import("./admin/pages/AdminSettingsPage").then(m => ({ default: m.AdminSettingsPage })));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-green-700 border-t-transparent rounded-full animate-spin" />
    </div>
  </div>
);

const AdminApp = () => {
  const location = useLocation();
  const adminPath = location.pathname.replace(/^\/admin\/?/, '') || 'dashboard';

  if (adminPath === 'login') {
    return <Suspense fallback={<PageLoader />}><AdminLoginPage /></Suspense>;
  }

  return (
    <AdminGuard>
      <Suspense fallback={<PageLoader />}>
        <AdminLayout>
          {adminPath === '' || adminPath === 'dashboard' ? <AdminDashboardPage /> :
           adminPath === 'users' ? <AdminUsersPage /> :
           adminPath === 'analytics' ? <AdminAnalyticsPage /> :
           adminPath === 'subscriptions' ? <AdminSubscriptionsPage /> :
           adminPath === 'settings' ? <AdminSettingsPage /> :
           <AdminDashboardPage />}
        </AdminLayout>
      </Suspense>
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
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route index path="/" element={<Suspense fallback={<PageLoader />}><LandingPage /></Suspense>} />
          <Route path="/login" element={<Suspense fallback={<PageLoader />}><LoginPage /></Suspense>} />
          <Route path="/reset-password/:token" element={<Suspense fallback={<PageLoader />}><ResetPasswordPage /></Suspense>} />
          
          <Route path="/register" element={<Suspense fallback={<PageLoader />}><RegisterPage /></Suspense>} />
          
          <Route path="/onboarding" element={<Suspense fallback={<PageLoader />}><OnboardingPage /></Suspense>} />
          <Route path="/verify-email/:token" element={<Suspense fallback={<PageLoader />}><VerifyEmailPage /></Suspense>} />

          <Route path="/dashboard" element={<Suspense fallback={<PageLoader />}><DashboardLayout /></Suspense>}>
            <Route index element={<Suspense fallback={<PageLoader />}><InsightsPage /></Suspense>} />
            <Route path="insights" element={<Suspense fallback={<PageLoader />}><InsightsPage /></Suspense>} />
            <Route path="streaks" element={<Suspense fallback={<PageLoader />}><StreaksPage /></Suspense>} />
            <Route path="nutrition" element={<Suspense fallback={<PageLoader />}><NutritionPage /></Suspense>} />
            <Route path="community" element={<Suspense fallback={<PageLoader />}><CommunityPage /></Suspense>} />
            <Route path="fitness" element={<Suspense fallback={<PageLoader />}><FitnessPage /></Suspense>} />
            <Route path="progress" element={<Suspense fallback={<PageLoader />}><ProgressPage /></Suspense>} />
            <Route path="schedule" element={<Suspense fallback={<PageLoader />}><SchedulePage /></Suspense>} />
            <Route path="grocery" element={<Suspense fallback={<PageLoader />}><GroceryPage /></Suspense>} />
            <Route path="subscriptions" element={<Suspense fallback={<PageLoader />}><SubscriptionsPage /></Suspense>} />
            <Route path="settings" element={<Suspense fallback={<PageLoader />}><SettingsPage /></Suspense>} />
          </Route>

          <Route
            path="/admin/*"
            element={
              <AdminAuthProvider>
                <AdminApp />
              </AdminAuthProvider>
            }
          />

          <Route path="/payment/success" element={<Suspense fallback={<PageLoader />}><PaymentSuccessPage /></Suspense>} />
          <Route path="*" element={<Suspense fallback={<PageLoader />}><NotFoundPage /></Suspense>} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
