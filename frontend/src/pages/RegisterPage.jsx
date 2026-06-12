import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Leaf, Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate     = useNavigate();
  const [form, setForm]       = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        navigate('/onboarding');
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
    <div className="min-h-screen flex items-center justify-center bg-[#F0F2F3] px-4">
      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#DFE3E4] shadow-[rgba(21,23,29,0.1)_0px_0px_15px_0px] overflow-hidden">
        {/* Header strip */}
        <div className="bg-gradient-to-r from-[#003139] to-[#244348] px-8 py-6 text-white text-center">
          <div className="inline-flex items-center gap-2 mb-1">
            <Leaf className="w-5 h-5 text-[#5FE089]" />
            <span className="text-xl font-bold font-heading">NutriTrack</span>
          </div>
          <p className="text-white/70 text-sm">Tạo tài khoản miễn phí</p>
        </div>

        {/* Body */}
        <div className="px-8 py-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Họ tên */}
            <div>
              <label className="tcl-label" htmlFor="reg-name">Họ tên</label>
              <input
                id="reg-name"
                type="text"
                name="name"
                className="tcl-input"
                placeholder="Nguyễn Văn A"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="tcl-label" htmlFor="reg-email">Email</label>
              <input
                id="reg-email"
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
              <label className="tcl-label" htmlFor="reg-password">Mật khẩu</label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="tcl-input pr-11"
                  placeholder="Tối thiểu 6 ký tự"
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
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
              {/* Password strength hint */}
              {form.password.length > 0 && (
                <p className={`text-xs mt-1.5 ${form.password.length >= 6 ? 'text-[#2EA850]' : 'text-[#96A5A8]'}`}>
                  {form.password.length >= 6 ? '✓ Độ dài hợp lệ' : `Cần thêm ${6 - form.password.length} ký tự`}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              id="reg-submit"
              type="submit"
              className="tcl-btn-primary w-full justify-center py-3 mt-1"
              disabled={loading}
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Tạo tài khoản'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#96A5A8] mt-6">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-[#003139] font-semibold hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
