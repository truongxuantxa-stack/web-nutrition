import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboard } from '../hooks/useProfile';
import toast from 'react-hot-toast';
import { User, Calendar, Ruler, Scale, Dumbbell, Target, Sparkles } from 'lucide-react';

export default function OnboardingPage() {
  const onboard = useOnboard();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    gender: 'male',
    birthDate: '',
    height: '',
    weight: '',
    activityLevel: 'sedentary',
    goal: 'maintain_weight',
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.birthDate || !formData.height || !formData.weight) {
      toast.error('Vui lòng nhập đầy đủ chiều cao, cân nặng và ngày sinh');
      return;
    }

    onboard.mutate(formData, {
      onSuccess: () => {
        toast.success('Thiết lập hồ sơ cá nhân thành công!');
        navigate('/dashboard');
      },
      onError: (err) => {
        const msg = err.response?.data?.message || 'Có lỗi xảy ra, vui lòng kiểm tra lại.';
        toast.error(msg);
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 card bg-base-100 border border-base-300 shadow-xl p-8">
        <div className="text-center">
          <div className="flex justify-center mb-2">
            <span className="text-4xl">🥗</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Thiết lập hồ sơ dinh dưỡng</h2>
          <p className="text-sm text-base-content/50 mt-1">Cung cấp các chỉ số để hệ thống cá nhân hóa TDEE & thực đơn</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Giới tính */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium flex items-center gap-1.5">
                <User className="w-4 h-4 text-base-content/50" /> Giới tính
              </span>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className={`btn btn-sm btn-outline ${formData.gender === 'male' ? 'btn-primary bg-primary/5' : ''}`}
                onClick={() => setFormData({ ...formData, gender: 'male' })}
              >
                Nam
              </button>
              <button
                type="button"
                className={`btn btn-sm btn-outline ${formData.gender === 'female' ? 'btn-primary bg-primary/5' : ''}`}
                onClick={() => setFormData({ ...formData, gender: 'female' })}
              >
                Nữ
              </button>
            </div>
          </div>

          {/* Ngày sinh */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-base-content/50" /> Ngày sinh
              </span>
            </label>
            <input
              type="date"
              required
              className="input input-bordered input-sm"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            />
          </div>

          {/* Chiều cao & Cân nặng */}
          <div className="grid grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-base-content/50" /> Chiều cao (cm)
                </span>
              </label>
              <input
                type="number"
                min="50"
                max="300"
                required
                placeholder="Ví dụ: 170"
                className="input input-bordered input-sm"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-base-content/50" /> Cân nặng (kg)
                </span>
              </label>
              <input
                type="number"
                min="10"
                max="500"
                required
                placeholder="Ví dụ: 65"
                className="input input-bordered input-sm"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              />
            </div>
          </div>

          {/* Mức vận động */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4 text-base-content/50" /> Mức hoạt động thể chất
              </span>
            </label>
            <select
              className="select select-bordered select-sm w-full"
              value={formData.activityLevel}
              onChange={(e) => setFormData({ ...formData, activityLevel: e.target.value })}
            >
              <option value="sedentary">Ít vận động (làm việc văn phòng)</option>
              <option value="light">Nhẹ (tập thể dục nhẹ 1-3 ngày/tuần)</option>
              <option value="moderate">Vừa phải (luyện tập 3-5 ngày/tuần)</option>
              <option value="active">Năng động (luyện tập nhiều 6-7 ngày/tuần)</option>
              <option value="very_active">Rất năng động (vận động viên, lao động nặng)</option>
            </select>
          </div>

          {/* Mục tiêu */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium flex items-center gap-1.5">
                <Target className="w-4 h-4 text-base-content/50" /> Mục tiêu sức khỏe
              </span>
            </label>
            <select
              className="select select-bordered select-sm w-full"
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            >
              <option value="lose_weight">Giảm cân (Thâm hụt calo)</option>
              <option value="maintain_weight">Duy trì cân nặng hiện tại</option>
              <option value="gain_weight">Tăng cân / Tăng cơ</option>
            </select>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={onboard.isPending}
            className="btn btn-primary w-full gap-2 mt-4"
          >
            {onboard.isPending ? (
              <span className="loading loading-spinner" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Hoàn tất & Tiếp tục
          </button>
        </form>
      </div>
    </div>
  );
}
