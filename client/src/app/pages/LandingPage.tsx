import { LandingPage as LandingPageComponent } from "../components/LandingPage";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthProvider";

export const LandingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const navigateToRightPage = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/register");
    }
  };
  const navigateToLogin = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };
  return (
    <LandingPageComponent
      onGetStarted={navigateToRightPage}
      onLogin={navigateToLogin}
    />
  );
};
