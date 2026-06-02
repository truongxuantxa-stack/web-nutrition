import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from './lib/queryClient';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

import LandingPage    from './pages/LandingPage';
import LoginPage      from './pages/LoginPage';
import RegisterPage   from './pages/RegisterPage';
import DashboardPage  from './pages/DashboardPage';
import DiaryPage      from './pages/DiaryPage';
import MealPlannerPage from './pages/MealPlannerPage';
import WeightPage      from './pages/WeightPage';
import ExercisePage    from './pages/ExercisePage';
import OnboardingPage  from './pages/OnboardingPage';
import ProfilePage     from './pages/ProfilePage';
import NotFoundPage    from './pages/NotFoundPage';

import AppLayout      from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthOnlyRoute  from './components/auth/AuthOnlyRoute';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '8px',
                fontSize: '14px',
              },
            }}
          />
          <Routes>
            {/* Public routes */}
            <Route path="/"         element={<LandingPage />} />
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Onboarding — chỉ cần đăng nhập, KHÔNG check isOnboarded để tránh redirect loop */}
            <Route element={<AuthOnlyRoute />}>
              <Route path="/onboarding" element={<OnboardingPage />} />
            </Route>

            {/* Protected routes — cần đăng nhập VÀ đã onboard */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard"    element={<DashboardPage />} />
                <Route path="/diary"        element={<DiaryPage />} />
                <Route path="/meal-planner" element={<MealPlannerPage />} />
                <Route path="/weight"       element={<WeightPage />} />
                <Route path="/exercise"     element={<ExercisePage />} />
                <Route path="/profile"      element={<ProfilePage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
