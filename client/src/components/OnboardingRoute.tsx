import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface OnboardingRouteProps {
  children: React.ReactNode
}

export const OnboardingRoute = ({ children }: OnboardingRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  //If not authenticated, redirect to login
  
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  //If onboarding is completed, redirect to dashboard
  if (user && user.onboardingCompleted === true) {
  return <Navigate to="/dashboard/insights" replace />
  }

  return <>{children}</>
}
