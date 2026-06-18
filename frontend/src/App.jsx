import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import queryClient from './lib/queryClient';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';

import LandingPage    from './pages/LandingPage';
import LoginPage      from './pages/LoginPage';
import RegisterPage   from './pages/RegisterPage';
const DashboardPage   = React.lazy(() => import('./pages/DashboardPage'));
const DiaryPage       = React.lazy(() => import('./pages/DiaryPage'));
const MealPlannerPage = React.lazy(() => import('./pages/MealPlannerPage'));
const WeightPage      = React.lazy(() => import('./pages/WeightPage'));
const ExercisePage    = React.lazy(() => import('./pages/ExercisePage'));
const OnboardingPage  = React.lazy(() => import('./pages/OnboardingPage'));
const ProfilePage     = React.lazy(() => import('./pages/ProfilePage'));
import NotFoundPage    from './pages/NotFoundPage';

import AppLayout      from './components/layout/AppLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthOnlyRoute  from './components/auth/AuthOnlyRoute';

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#F0F2F3]">
    <div className="w-10 h-10 border-4 border-[#DFE3E4] border-t-[#5FE089] rounded-full animate-spin"></div>
  </div>
);

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
          <Suspense fallback={<PageLoader />}>
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
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
