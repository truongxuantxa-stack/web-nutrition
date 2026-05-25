import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }
    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password);
      if (!user.isOnboarded) {
        // Onboarding vẫn là EJS — redirect đến backend trực tiếp
        window.location.href = 'http://localhost:3000/onboarding';
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-base-300 to-base-100 px-4">
      <div className="card w-full max-w-md shadow-2xl bg-base-100/80 backdrop-blur-md border border-base-300">
        <div className="card-body gap-5">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="text-3xl">🥗</span>
              <span className="text-2xl font-bold text-primary">NutriTrack</span>
            </div>
            <p className="text-base-content/60 text-sm">Tạo tài khoản miễn phí</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="form-control">
              <label className="label" htmlFor="reg-name">
                <span className="label-text font-medium">Họ tên</span>
              </label>
              <input
                id="reg-name"
                type="text"
                name="name"
                className="input input-bordered w-full"
                placeholder="Nguyễn Văn A"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-control">
              <label className="label" htmlFor="reg-email">
                <span className="label-text font-medium">Email</span>
              </label>
              <input
                id="reg-email"
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
              <label className="label" htmlFor="reg-password">
                <span className="label-text font-medium">Mật khẩu</span>
              </label>
              <input
                id="reg-password"
                type="password"
                name="password"
                className="input input-bordered w-full"
                placeholder="Tối thiểu 6 ký tự"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
            </div>

            <button
              id="reg-submit"
              type="submit"
              className="btn btn-primary w-full mt-2"
              disabled={loading}
            >
              {loading ? <span className="loading loading-spinner loading-sm" /> : 'Tạo tài khoản'}
            </button>
          </form>

          <p className="text-center text-sm text-base-content/60">
            Đã có tài khoản?{' '}
            <Link to="/login" className="link link-primary font-medium">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
