import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]               = useState(null);
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken'));
  const [isLoading, setIsLoading]     = useState(true);

  const isAuthenticated = !!user;

  // ─── Lưu token ──────────────────────────────────────────────────────────────
  const saveToken = (token) => {
    localStorage.setItem('accessToken', token);
    setAccessToken(token);
  };

  const clearToken = () => {
    localStorage.removeItem('accessToken');
    setAccessToken(null);
  };

  // ─── checkAuth: gọi khi mount ────────────────────────────────────────────────
  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const { data } = await api.get('/auth/me', { _skipToast: true });
      setUser(data.data.user);
    } catch {
      clearToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // ─── login ───────────────────────────────────────────────────────────────────
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password }, { _skipToast: true });
    saveToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  };

  // ─── register ────────────────────────────────────────────────────────────────
  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password }, { _skipToast: true });
    saveToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data.user;
  };

  // ─── logout ──────────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      clearToken();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, isAuthenticated, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth phải dùng bên trong AuthProvider');
  return ctx;
};
