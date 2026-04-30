import { BrowserRouter, Route, Routes } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "./contexts/AuthContext"
// import { ProtectedRoute } from "./components/ProtectedRoute"
import { OnboardingRoute } from "./components/OnboardingRoute"

import LoginPage from "./pages/login"
import RegisterPage from "./pages/register"
import ForgotPasswordPage from "./pages/forgot-password"
import ResetPasswordPage from "./pages/reset-password"
import HomePage from "./pages/home"
import OnboardingWizard from "./pages/onboarding/OnboardingWizard"
import DashboardLayout from "./layouts/DashboardLayout"
import ProfilePage from "./pages/dashboard/profile"
import ProfileEditPage from "./pages/dashboard/profile-edit"
import SettingsPage from "./pages/dashboard/settings"
import SchedulePage from "./pages/dashboard/schedule"
import NutritionPage from "./pages/dashboard/nutrition"
import FitnessPage from "./pages/dashboard/fitness"
import StreaksPage from "./pages/dashboard/streaks"
import CommunityPage from "./pages/dashboard/community"
import ProgressPage from "./pages/dashboard/progress"
import ProgressHistoryPage from "./pages/dashboard/progress-history"
import GroceriesPage from "./pages/dashboard/groceries"
import SubscriptionPage from "./pages/dashboard/subscription"
import InsightsPage from "./pages/dashboard/insights"
import TestCallingPage from "./pages/test"

const queryClient = new QueryClient()

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/onboarding/welcome" element={
              <OnboardingRoute>
                <OnboardingWizard />
              </OnboardingRoute>
            } />

            <Route path="/test" element={<TestCallingPage />} />

            <Route path="/dashboard" element={
              // <ProtectedRoute>
              <DashboardLayout />
              // </ProtectedRoute>
            }>
              <Route path="profile" element={<ProfilePage />} />
              <Route path="profile-edit" element={<ProfileEditPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="schedule" element={<SchedulePage />} />
              <Route path="nutrition" element={<NutritionPage />} />
              <Route path="fitness" element={<FitnessPage />} />
              <Route path="streaks" element={<StreaksPage />} />
              <Route path="community" element={<CommunityPage />} />
              <Route path="progress" element={<ProgressPage />} />
              <Route path="progress-history" element={<ProgressHistoryPage />} />
              <Route path="groceries" element={<GroceriesPage />} />
              <Route path="subscription" element={<SubscriptionPage />} />
              <Route path="insights" element={<InsightsPage />} />
            </Route>

            <Route path="/admin" element={<h1>Admin Layout</h1>}>
              <Route index path="insights" element={<h1>Admin Dashboard Insights</h1>} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App