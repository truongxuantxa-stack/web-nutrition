import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Leaf, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (!user.isOnboarded) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F2F3] px-4">
      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#DFE3E4] shadow-[rgba(21,23,29,0.1)_0px_0px_15px_0px] overflow-hidden">
        {/* Header strip */}
        <div className="bg-gradient-to-r from-[#003139] to-[#244348] px-8 py-6 text-white text-center">
          <div className="inline-flex items-center gap-2 mb-1">
            <Leaf className="w-5 h-5 text-[#5FE089]" />
            <span className="text-xl font-bold font-heading">NutriTrack</span>
          </div>
          <p className="text-white/70 text-sm">Chào mừng trở lại!</p>
        </div>

        {/* Body */}
        <div className="px-8 py-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Email */}
            <div>
              <label className="tcl-label" htmlFor="login-email">Email</label>
              <input
                id="login-email"
                type="email"
                name="email"
                className="tcl-input"
                placeholder="email@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div>
              <label className="tcl-label" htmlFor="login-password">Mật khẩu</label>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="tcl-input pr-11"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#96A5A8] hover:text-[#003139] transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              className="tcl-btn-primary w-full justify-center py-3 mt-1"
              disabled={loading}
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Đăng nhập'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#96A5A8] mt-6">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-[#003139] font-semibold hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
