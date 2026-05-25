import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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
              <Route element={<AppLayout />}>
                <Route path="/dashboard"    element={<DashboardPage />} />
                <Route path="/diary"        element={<DiaryPage />} />
                <Route path="/meal-planner" element={<MealPlannerPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
