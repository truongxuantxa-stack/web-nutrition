import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from './lib/queryClient';
import { AuthProvider } from './contexts/AuthContext';

import LandingPage    from './pages/LandingPage';
import WelcomePage    from './pages/WelcomePage';
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/"         element={<LandingPage />} />
            <Route path="/welcome"  element={<WelcomePage />} />
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected routes — cần đăng nhập */}
            <Route element={<ProtectedRoute />}>
              <Route path="/onboarding" element={<OnboardingPage />} />
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
