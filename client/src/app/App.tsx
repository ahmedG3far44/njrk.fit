import { BrowserRouter, Route, Routes } from "react-router";
import {
  DashboardLayout,
  FitnessPage,
  GroceryPage,
  InsightsPage,
  LandingPage,
  LoginPage,
  NutritionPage,
  OnboardingPage,
  ProgressPage,
  RegisterPage,
  SchedulePage,
  SettingsPage,
  StreaksPage,
  SubscriptionsPage,
  CommunityPage
} from "./pages";

import { AdminPage } from "./pages/AdminPage";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route index path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

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

        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
