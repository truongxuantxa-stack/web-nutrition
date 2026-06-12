import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboard } from '../hooks/useProfile';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Leaf, User, Calendar, Ruler, Scale, Dumbbell, Target, ChevronRight, ChevronLeft, Sparkles, CheckCircle2 } from 'lucide-react';

// ─── Dữ liệu constants ─────────────────────────────────────────────────────────
const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Ít vận động', desc: 'Làm việc văn phòng, ngồi nhiều', icon: '🪑' },
  { value: 'light', label: 'Nhẹ nhàng', desc: 'Tập thể dục nhẹ 1-3 ngày/tuần', icon: '🚶' },
  { value: 'moderate', label: 'Vừa phải', desc: 'Luyện tập 3-5 ngày/tuần', icon: '🏃' },
  { value: 'active', label: 'Năng động', desc: 'Luyện tập nhiều 6-7 ngày/tuần', icon: '💪' },
  { value: 'very_active', label: 'Rất năng động', desc: 'Vận động viên, lao động nặng', icon: '🏋️' },
];

const GOALS = [
  { value: 'lose_weight', label: 'Giảm cân', desc: 'Thâm hụt calo, đốt mỡ thừa', icon: '📉' },
  { value: 'maintain_weight', label: 'Duy trì', desc: 'Giữ nguyên cân nặng hiện tại', icon: '⚖️' },
  { value: 'gain_weight', label: 'Tăng cân / Tăng cơ', desc: 'Nạp thêm calo, xây dựng cơ bắp', icon: '📈' },
];

// ─── Slide animation variants ───────────────────────────────────────────────────
const variants = {
  enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.35, ease: 'easeOut' } },
  exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } }),
};

// ─── Step Dot component ─────────────────────────────────────────────────────────
function StepDot({ step, current, total }) {
  const done   = step < current;
  const active = step === current;
  return (
    <div className="flex items-center">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
        done   ? 'bg-[#003139] text-white' :
        active ? 'bg-[#003139]/10 text-[#003139] border-2 border-[#003139]' :
                 'bg-[#F0F2F3] text-[#96A5A8] border border-[#DFE3E4]'
      }`}>
        {done ? <CheckCircle2 className="w-4 h-4" /> : step}
      </div>
      {step < total && (
        <div className={`h-0.5 w-10 sm:w-16 transition-all duration-500 ${step < current ? 'bg-[#003139]' : 'bg-[#DFE3E4]'}`} />
      )}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const { checkAuth } = useAuth();
  const onboard = useOnboard();
  const navigate = useNavigate();
  const [step, setStep]           = useState(1);
  const [direction, setDirection] = useState(1);
  const TOTAL_STEPS = 3;

  const [formData, setFormData] = useState({
    gender: 'male',
    birthDate: '',
    height: '',
    weight: '',
    activityLevel: 'sedentary',
    goal: 'maintain_weight',
  });

  const update = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));

  const goNext = () => {
    if (step === 1 && (!formData.birthDate || !formData.height || !formData.weight)) {
      toast.error('Vui lòng nhập đầy đủ ngày sinh, chiều cao và cân nặng');
      return;
    }
    setDirection(1);
    setStep(s => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep(s => s - 1);
  };

  const handleSubmit = () => {
    onboard.mutate(formData, {
      onSuccess: async () => {
        await checkAuth();
        toast.success('Thiết lập hồ sơ thành công! Chào mừng đến NutriTrack 🎉');
        navigate('/dashboard');
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#F0F2F3] flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <motion.div
        className="flex items-center gap-2 mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Leaf className="w-6 h-6 text-[#5FE089]" />
        <span className="text-2xl font-bold font-heading text-[#003139]">NutriTrack</span>
      </motion.div>

      {/* Card */}
      <motion.div
        className="w-full max-w-lg"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="bg-white border border-[#DFE3E4] rounded-3xl shadow-[rgba(21,23,29,0.1)_0px_0px_15px_0px] overflow-hidden">

          {/* Header — Deep Teal gradient */}
          <div className="bg-gradient-to-r from-[#003139] to-[#244348] px-8 pt-8 pb-6 text-white">
            <p className="text-white/60 text-sm font-medium mb-1">Bước {step} / {TOTAL_STEPS}</p>
            <h1 className="text-2xl font-bold font-heading">
              {step === 1 && 'Thông tin cơ thể'}
              {step === 2 && 'Mức hoạt động'}
              {step === 3 && 'Mục tiêu của bạn'}
            </h1>
            <p className="text-white/60 text-sm mt-1">
              {step === 1 && 'Dùng để tính BMR & TDEE chính xác theo công thức Mifflin-St Jeor'}
              {step === 2 && 'Hệ số hoạt động để tính tổng năng lượng tiêu thụ thực tế'}
              {step === 3 && 'Hệ thống sẽ điều chỉnh calo mục tiêu phù hợp với bạn'}
            </p>
            {/* Progress bar */}
            <div className="mt-4 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-[#5FE089] rounded-full"
                initial={{ width: `${((step - 1) / TOTAL_STEPS) * 100}%` }}
                animate={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Step dots */}
          <div className="flex justify-center items-center gap-0 pt-6 pb-0 px-8">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <StepDot key={i} step={i + 1} current={step} total={TOTAL_STEPS} />
            ))}
          </div>

          {/* Form steps */}
          <div className="px-8 pt-6 pb-8 overflow-hidden">
            <AnimatePresence custom={direction} mode="wait">
              <motion.div
                key={step}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                {/* ── STEP 1: Thông tin cơ thể ── */}
                {step === 1 && (
                  <div className="space-y-5">
                    {/* Giới tính */}
                    <div>
                      <label className="tcl-label flex items-center gap-1.5">
                        <User className="w-4 h-4 text-[#003139]" /> Giới tính
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {[{ v: 'male', l: '👨 Nam' }, { v: 'female', l: '👩 Nữ' }].map(g => (
                          <button
                            key={g.v}
                            type="button"
                            onClick={() => update('gender', g.v)}
                            className={`py-3 px-4 rounded-xl border-2 font-semibold text-sm transition-all duration-200 ${
                              formData.gender === g.v
                                ? 'border-[#003139] bg-[#003139]/5 text-[#003139]'
                                : 'border-[#DFE3E4] text-[#244348] hover:border-[#003139]/40 hover:bg-[#F0F2F3]'
                            }`}
                          >
                            {g.l}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Ngày sinh */}
                    <div>
                      <label className="tcl-label flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-[#003139]" /> Ngày sinh
                      </label>
                      <input
                        type="date"
                        className="tcl-input"
                        value={formData.birthDate}
                        onChange={e => update('birthDate', e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    {/* Chiều cao & Cân nặng */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="tcl-label flex items-center gap-1.5">
                          <Ruler className="w-4 h-4 text-[#003139]" /> Chiều cao
                        </label>
                        <div className="relative">
                          <input
                            type="number" min="50" max="300"
                            placeholder="170"
                            className="tcl-input pr-10"
                            value={formData.height}
                            onChange={e => update('height', e.target.value)}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#96A5A8] text-sm pointer-events-none">cm</span>
                        </div>
                      </div>
                      <div>
                        <label className="tcl-label flex items-center gap-1.5">
                          <Scale className="w-4 h-4 text-[#003139]" /> Cân nặng
                        </label>
                        <div className="relative">
                          <input
                            type="number" min="10" max="500"
                            placeholder="65"
                            className="tcl-input pr-10"
                            value={formData.weight}
                            onChange={e => update('weight', e.target.value)}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#96A5A8] text-sm pointer-events-none">kg</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── STEP 2: Mức hoạt động ── */}
                {step === 2 && (
                  <div className="space-y-3">
                    <label className="tcl-label flex items-center gap-1.5">
                      <Dumbbell className="w-4 h-4 text-[#003139]" /> Chọn mức độ phù hợp nhất với bạn
                    </label>
                    {ACTIVITY_LEVELS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update('activityLevel', opt.value)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          formData.activityLevel === opt.value
                            ? 'border-[#003139] bg-[#003139]/5'
                            : 'border-[#DFE3E4] hover:border-[#003139]/40 hover:bg-[#F0F2F3]'
                        }`}
                      >
                        <span className="text-2xl">{opt.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm ${formData.activityLevel === opt.value ? 'text-[#003139]' : 'text-[#244348]'}`}>
                            {opt.label}
                          </p>
                          <p className="text-xs text-[#96A5A8] mt-0.5">{opt.desc}</p>
                        </div>
                        {formData.activityLevel === opt.value && (
                          <CheckCircle2 className="w-5 h-5 text-[#003139] shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* ── STEP 3: Mục tiêu ── */}
                {step === 3 && (
                  <div className="space-y-4">
                    <label className="tcl-label flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-[#003139]" /> Mục tiêu sức khỏe của bạn là gì?
                    </label>
                    {GOALS.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => update('goal', opt.value)}
                        className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 text-left transition-all duration-200 ${
                          formData.goal === opt.value
                            ? 'border-[#003139] bg-[#003139]/5'
                            : 'border-[#DFE3E4] hover:border-[#003139]/40 hover:bg-[#F0F2F3]'
                        }`}
                      >
                        <span className="text-3xl">{opt.icon}</span>
                        <div className="flex-1">
                          <p className={`font-bold text-base font-heading ${formData.goal === opt.value ? 'text-[#003139]' : 'text-[#244348]'}`}>
                            {opt.label}
                          </p>
                          <p className="text-sm text-[#96A5A8] mt-0.5">{opt.desc}</p>
                        </div>
                        {formData.goal === opt.value && (
                          <CheckCircle2 className="w-5 h-5 text-[#003139] shrink-0" />
                        )}
                      </button>
                    ))}

                    {/* Summary card */}
                    <div className="mt-2 p-4 rounded-xl bg-[#003139]/5 border border-[#003139]/15 space-y-1 text-sm">
                      <p className="font-semibold text-[#003139] mb-2">📋 Tóm tắt thông tin</p>
                      <p className="text-[#244348]">
                        <span className="font-medium text-[#003139]">Cơ thể: </span>
                        {formData.gender === 'male' ? 'Nam' : 'Nữ'} · {formData.height || '—'} cm · {formData.weight || '—'} kg
                      </p>
                      <p className="text-[#244348]">
                        <span className="font-medium text-[#003139]">Hoạt động: </span>
                        {ACTIVITY_LEVELS.find(a => a.value === formData.activityLevel)?.label}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation buttons */}
            <div className={`flex mt-8 gap-3 ${step > 1 ? 'justify-between' : 'justify-end'}`}>
              {step > 1 && (
                <button
                  type="button"
                  onClick={goBack}
                  className="tcl-btn-ghost gap-2 border border-[#DFE3E4]"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Quay lại
                </button>
              )}
              {step < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="tcl-btn-primary gap-2 px-8 py-2.5"
                >
                  Tiếp theo
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={onboard.isPending}
                  className="tcl-btn-primary gap-2 px-8 py-2.5"
                >
                  {onboard.isPending ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Hoàn tất & Bắt đầu
                </button>
              )}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-[#96A5A8] mt-6">
          Thông tin của bạn được bảo mật và chỉ dùng cho mục đích tính toán dinh dưỡng.
        </p>
      </motion.div>
    </div>
  );
}
