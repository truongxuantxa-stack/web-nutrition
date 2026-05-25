import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Nếu chưa onboard → chuyển sang trang Onboarding nội bộ trong React SPA
  if (user && user.isOnboarded === false) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
