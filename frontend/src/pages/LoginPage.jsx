import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-300 to-base-100 px-4">
      <div className="card w-full max-w-md shadow-2xl bg-base-100/80 backdrop-blur-md border border-base-300">
        <div className="card-body gap-5">
          {/* Logo */}
          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="text-3xl">🥗</span>
              <span className="text-2xl font-bold text-primary">NutriTrack</span>
            </div>
            <p className="text-base-content/60 text-sm">Chào mừng trở lại!</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="form-control">
              <label className="label" htmlFor="login-email">
                <span className="label-text font-medium">Email</span>
              </label>
              <input
                id="login-email"
                type="email"
                name="email"
                className="input input-bordered w-full"
                placeholder="email@example.com"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-control">
              <label className="label" htmlFor="login-password">
                <span className="label-text font-medium">Mật khẩu</span>
              </label>
              <input
                id="login-password"
                type="password"
                name="password"
                className="input input-bordered w-full"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary w-full mt-2"
              disabled={loading}
            >
              {loading ? <span className="loading loading-spinner loading-sm" /> : 'Đăng nhập'}
            </button>
          </form>

          <p className="text-center text-sm text-base-content/60">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="link link-primary font-medium">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
