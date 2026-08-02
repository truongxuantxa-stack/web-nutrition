import { useState, useEffect } from 'react';
import {
  useProfileData, useUpdateProfile, useUpdateMacros,
} from '../hooks/useProfile';
import { useDownloadReport } from '../hooks/useReport';
import toast from 'react-hot-toast';
import { User, Smile, Calendar, Ruler, Scale, Dumbbell, Target, Award, Save, FileText } from 'lucide-react';

export default function ProfilePage() {
  const { data, isLoading, error } = useProfileData();
  const updateProfile  = useUpdateProfile();
  const updateMacros   = useUpdateMacros();
  const downloadReport  = useDownloadReport();

  const [activeTab, setActiveTab] = useState('bio');

  const [name, setName]                   = useState('');
  const [gender, setGender]               = useState('male');
  const [birthDate, setBirthDate]         = useState('');
  const [height, setHeight]               = useState('');
  const [weight, setWeight]               = useState('');
  const [activityLevel, setActivityLevel] = useState('sedentary');
  const [goal, setGoal]                   = useState('maintain_weight');
  const [macroProtein, setMacroProtein]   = useState(30);
  const [macroCarbs, setMacroCarbs]       = useState(40);
  const [macroFat, setMacroFat]           = useState(30);

  useEffect(() => {
    if (data?.user) {
      const u = data.user;
      Promise.resolve().then(() => {
        setName(u.name || '');
        setGender(u.gender || 'male');
        setBirthDate(u.birthDate || '');
        setHeight(u.height || '');
        setWeight(u.weight || '');
        setActivityLevel(u.activityLevel || 'sedentary');
        setGoal(u.goal || 'maintain_weight');
        setMacroProtein(u.macroProtein || 30);
        setMacroCarbs(u.macroCarbs || 40);
        setMacroFat(u.macroFat || 30);
      });
    }
  }, [data]);

  if (isLoading) return <ProfileSkeleton />;
  if (error) return (
    <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
      Không thể tải dữ liệu hồ sơ.
    </div>
  );

  const { metrics = {} } = data || {};

  const handleUpdateBio = (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Họ tên không được để trống'); return; }
    updateProfile.mutate(
      { name, gender, birthDate, height, weight, activityLevel, goal },
      {
        onSuccess: (res) => toast.success(res.message || 'Đã cập nhật thông tin thành công!'),
        onError:   (err) => toast.error(err.response?.data?.message || 'Lỗi cập nhật thông tin'),
      }
    );
  };

  const handleUpdateMacros = (e) => {
    e.preventDefault();
    const sum = Number(macroProtein) + Number(macroCarbs) + Number(macroFat);
    if (sum !== 100) { toast.error(`Tổng tỷ lệ phải bằng 100% (Hiện tại: ${sum}%)`); return; }
    updateMacros.mutate(
      { macroProtein, macroCarbs, macroFat },
      {
        onSuccess: (res) => toast.success(res.message || 'Đã cập nhật Macro thành công!'),
        onError:   (err) => toast.error(err.response?.data?.message || 'Lỗi cập nhật Macro'),
      }
    );
  };

  const handleDownloadReport = (range) => {
    downloadReport.mutate(range, {
      onSuccess: () => toast.success('Bắt đầu tải xuống báo cáo PDF...'),
      onError:   (err) => toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi tạo báo cáo. Vui lòng thử lại sau.'),
    });
  };

  // Tab config
  const tabs = [
    { key: 'bio',    icon: User,     label: 'Chỉ số sinh học' },
    { key: 'macros', icon: Award,    label: 'Tỷ lệ Macro' },
    { key: 'reports', icon: FileText, label: 'Báo cáo dinh dưỡng' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#003139]">Hồ sơ cá nhân</h1>
          {data?.user?.contributionCount > 0 && (
            <div className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              Đóng góp cộng đồng: {data.user.contributionCount}
            </div>
          )}
        </div>
        <p className="text-[#96A5A8] text-sm">Quản lý các chỉ số thể chất, phân bổ dinh dưỡng và danh mục dị ứng</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#F0F2F3] p-1 rounded-xl self-start flex-wrap">
        {tabs.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
              activeTab === key
                ? 'bg-white text-[#003139] shadow-sm font-semibold'
                : 'text-[#96A5A8] hover:text-[#244348]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {/* Bio Tab */}
      {activeTab === 'bio' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          <div className="tcl-card rounded-2xl p-6 lg:col-span-2 flex flex-col h-full">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#96A5A8] mb-4">Cập nhật chỉ số cơ thể</h3>
            <form onSubmit={handleUpdateBio} className="flex flex-col flex-grow">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="tcl-label flex items-center gap-1.5"><User className="w-4 h-4 text-[#96A5A8]" /> Họ và tên</label>
                <input type="text" required className="tcl-input" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="tcl-label flex items-center gap-1.5"><Smile className="w-4 h-4 text-[#96A5A8]" /> Giới tính</label>
                <select className="tcl-select" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                </select>
              </div>
              <div>
                <label className="tcl-label flex items-center gap-1.5"><Calendar className="w-4 h-4 text-[#96A5A8]" /> Ngày sinh</label>
                <input type="date" className="tcl-input" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
              </div>
              <div>
                <label className="tcl-label flex items-center gap-1.5"><Ruler className="w-4 h-4 text-[#96A5A8]" /> Chiều cao (cm)</label>
                <input type="number" min="50" max="300" placeholder="170" className="tcl-input" value={height} onChange={(e) => setHeight(e.target.value)} />
              </div>
              <div>
                <label className="tcl-label flex items-center gap-1.5"><Scale className="w-4 h-4 text-[#96A5A8]" /> Cân nặng (kg)</label>
                <input type="number" min="10" max="500" placeholder="65" className="tcl-input" value={weight} onChange={(e) => setWeight(e.target.value)} />
              </div>
              <div>
                <label className="tcl-label flex items-center gap-1.5"><Dumbbell className="w-4 h-4 text-[#96A5A8]" /> Mức hoạt động</label>
                <select className="tcl-select" value={activityLevel} onChange={(e) => setActivityLevel(e.target.value)}>
                  <option value="sedentary">Ít vận động</option>
                  <option value="light">Vận động nhẹ (1-3 ngày/tuần)</option>
                  <option value="moderate">Vận động vừa (3-5 ngày/tuần)</option>
                  <option value="active">Năng động (6-7 ngày/tuần)</option>
                  <option value="very_active">Rất năng động</option>
                </select>
              </div>
              <div>
                <label className="tcl-label flex items-center gap-1.5"><Target className="w-4 h-4 text-[#96A5A8]" /> Mục tiêu sức khỏe</label>
                <select className="tcl-select" value={goal} onChange={(e) => setGoal(e.target.value)}>
                  <option value="lose_weight">Giảm cân</option>
                  <option value="maintain_weight">Duy trì cân nặng</option>
                  <option value="gain_weight">Tăng cân</option>
                </select>
              </div>
              </div>
              <div className="mt-auto pt-6">
                <button type="submit" disabled={updateProfile.isPending} className="tcl-btn-primary gap-2 py-2.5">
                  {updateProfile.isPending ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : <Save className="w-4 h-4" />}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>

          {/* Stats sidebar */}
          <div className="tcl-card rounded-2xl p-6 lg:col-span-1 flex flex-col h-full">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#96A5A8] mb-3">Thông số tính toán</h3>
            <div className="space-y-4 flex flex-col flex-grow">
              <div>
                <span className="text-xs text-[#96A5A8]">Chỉ số BMI</span>
                <p className="text-xl font-bold flex items-baseline gap-1.5 mt-0.5 text-[#003139]">
                  {metrics.bmi ? metrics.bmi.toFixed(1) : '--'}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                    metrics.bmiClass?.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                    metrics.bmiClass?.color === 'green' ? 'bg-emerald-100 text-emerald-700' :
                    metrics.bmiClass?.color === 'yellow' ? 'bg-amber-100 text-amber-700' :
                    metrics.bmiClass?.color === 'red' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {metrics.bmiClass?.label || 'Chưa có'}
                  </span>
                </p>
              </div>
              <div className="border-t border-[#DFE3E4] pt-3">
                <span className="text-xs text-[#96A5A8]">Tỷ lệ trao đổi chất cơ bản (BMR)</span>
                <p className="text-xl font-bold mt-0.5 text-[#003139]">{metrics.bmr ? `${Math.round(metrics.bmr)} kcal` : '--'}</p>
              </div>
              <div className="border-t border-[#DFE3E4] pt-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#96A5A8]">Tổng tiêu hao hàng ngày (TDEE)</span>
                  {metrics.isAdaptiveActive && (
                    <span className="text-[9px] font-semibold bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Thích ứng
                    </span>
                  )}
                </div>
                <p className="text-xl font-bold mt-0.5 text-[#003139]">{metrics.tdee ? `${Math.round(metrics.tdee)} kcal` : '--'}</p>
              </div>
              <div className="border-t border-[#DFE3E4] pt-3 mt-auto bg-[#003139]/5 rounded-xl p-3 border border-[#003139]/15">
                <span className="text-xs text-[#003139] font-bold">Mục tiêu Calo nạp mỗi ngày</span>
                <p className="text-2xl font-black text-[#003139] mt-0.5">
                  {metrics.targetCalories ? `${Math.round(metrics.targetCalories)} kcal` : '--'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Macros Tab */}
      {activeTab === 'macros' && (
        <div className="tcl-card rounded-2xl p-6 max-w-xl">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#96A5A8] mb-2">Tùy chỉnh tỷ lệ dinh dưỡng (Macros)</h3>
          <p className="text-xs text-[#96A5A8] mb-4">Mặc định hệ thống đề xuất tỷ lệ Protein: 30%, Carbs: 40%, Fat: 30%.</p>

          <form onSubmit={handleUpdateMacros} className="flex flex-col gap-4">
            {/* Protein slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-[#244348]">Protein (%)</span>
                <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{macroProtein}%</span>
              </div>
              <input type="range" min="5" max="70" step="5"
                className="w-full h-2 appearance-none rounded-full bg-blue-100 accent-blue-600 cursor-pointer"
                value={macroProtein} onChange={(e) => setMacroProtein(Number(e.target.value))} />
            </div>

            {/* Carbs slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-[#244348]">Carbohydrates (%)</span>
                <span className="text-sm font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">{macroCarbs}%</span>
              </div>
              <input type="range" min="5" max="80" step="5"
                className="w-full h-2 appearance-none rounded-full bg-amber-100 accent-amber-500 cursor-pointer"
                value={macroCarbs} onChange={(e) => setMacroCarbs(Number(e.target.value))} />
            </div>

            {/* Fat slider */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-[#244348]">Fat (%)</span>
                <span className="text-sm font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded-md">{macroFat}%</span>
              </div>
              <input type="range" min="5" max="70" step="5"
                className="w-full h-2 appearance-none rounded-full bg-pink-100 accent-pink-500 cursor-pointer"
                value={macroFat} onChange={(e) => setMacroFat(Number(e.target.value))} />
            </div>

            {/* Total */}
            {(() => {
              const total = Number(macroProtein) + Number(macroCarbs) + Number(macroFat);
              const isValid = total === 100;
              return (
                <div className="flex items-center justify-between border-t border-[#DFE3E4] pt-3 mt-2">
                  <span className="text-sm font-semibold text-[#244348]">Tổng tỷ lệ:</span>
                  <span className={`text-lg font-black ${isValid ? 'text-[#2EA850]' : 'text-red-500'}`}>
                    {total}% {isValid ? '✓' : '(Yêu cầu 100%)'}
                  </span>
                </div>
              );
            })()}

            <button type="submit"
              disabled={Number(macroProtein) + Number(macroCarbs) + Number(macroFat) !== 100 || updateMacros.isPending}
              className="tcl-btn-primary gap-2 py-2.5 self-start mt-2"
            >
              {updateMacros.isPending ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : <Save className="w-4 h-4" />}
              Lưu tỷ lệ
            </button>
          </form>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <div className="tcl-card rounded-2xl p-6 max-w-xl">
          <h3 className="text-lg font-bold flex items-center gap-2 mb-2 text-[#003139]">
            <FileText className="w-5 h-5 text-[#003139]" />
            Báo cáo dinh dưỡng cá nhân (PDF)
          </h3>
          <p className="text-xs text-[#96A5A8] mb-6 leading-relaxed">
            Hệ thống tự động biên soạn báo cáo phân tích dinh dưỡng cá nhân dưới dạng PDF chất lượng cao, bao gồm:<br />
            • Phân tích lượng calo và các chất đa lượng (Macros) tiêu thụ thực tế.<br />
            • Sự thay đổi của cân nặng và chỉ số BMI trong kỳ báo cáo.<br />
            • Đánh giá chi tiết lượng xơ, nước nạp vào và so sánh với khuyến nghị chuẩn IOM.<br />
            • Kế hoạch hành động cụ thể thích ứng theo cơ chế Adaptive TDEE hiện tại.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <button
              onClick={() => handleDownloadReport('week')}
              disabled={downloadReport.isPending}
              className="tcl-btn-primary flex-1 justify-center gap-2 py-2.5"
            >
              {downloadReport.isPending ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : <FileText className="w-4 h-4" />}
              Tải báo cáo 7 ngày (Tuần)
            </button>
            <button
              onClick={() => handleDownloadReport('month')}
              disabled={downloadReport.isPending}
              className="tcl-btn-secondary flex-1 justify-center gap-2 py-2.5"
            >
              {downloadReport.isPending ? (
                <span className="inline-block w-4 h-4 border-[#003139]/30 border-t-[#003139] rounded-full animate-spin border-2 inline-block" />
              ) : <FileText className="w-4 h-4" />}
              Tải báo cáo 30 ngày (Tháng)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-8 bg-[#DFE3E4] rounded w-48" />
      <div className="h-10 bg-[#DFE3E4] rounded w-80" />
      <div className="grid grid-cols-3 gap-6">
        <div className="h-80 bg-[#DFE3E4] rounded-2xl col-span-2" />
        <div className="h-80 bg-[#DFE3E4] rounded-2xl" />
      </div>
    </div>
  );
}
