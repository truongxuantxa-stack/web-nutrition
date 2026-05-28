import { useState, useEffect } from 'react';
import {
  useProfileData,
  useUpdateProfile,
  useUpdateMacros,
  useAllergies,
  useUpdateAllergies,
} from '../hooks/useProfile';
import { useDownloadReport } from '../hooks/useReport';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { User, Calendar, Ruler, Scale, Dumbbell, Target, ShieldAlert, Award, Save, Plus, X, FileText } from 'lucide-react';

export default function ProfilePage() {
  const { data, isLoading, error } = useProfileData();
  const updateProfile = useUpdateProfile();
  const updateMacros = useUpdateMacros();

  const { data: userAllergies = [], isLoading: isLoadingAllergies } = useAllergies();
  const updateAllergies = useUpdateAllergies();
  const downloadReport = useDownloadReport();

  const [activeTab, setActiveTab] = useState('bio');

  // Bio Form States
  const [name, setName] = useState('');
  const [gender, setGender] = useState('male');
  const [birthDate, setBirthDate] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState('sedentary');
  const [goal, setGoal] = useState('maintain_weight');

  // Macro States
  const [macroProtein, setMacroProtein] = useState(30);
  const [macroCarbs, setMacroCarbs] = useState(40);
  const [macroFat, setMacroFat] = useState(30);

  // Allergies selection states
  const [availableFoods, setAvailableFoods] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

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

  // Tải danh sách food để tìm và chọn dị ứng
  useEffect(() => {
    if (activeTab === 'allergies') {
      api.get('/meal-planner/foods?excludeAllergies=false')
        .then(res => setAvailableFoods(res.data?.data || []))
        .catch(() => toast.error('Không thể tải danh sách thực phẩm.'));
    }
  }, [activeTab]);

  if (isLoading) return <ProfileSkeleton />;
  if (error) return <div className="alert alert-error">Không thể tải dữ liệu hồ sơ.</div>;

  const { metrics = {} } = data || {};

  const handleUpdateBio = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Họ tên không được để trống');
      return;
    }
    updateProfile.mutate(
      { name, gender, birthDate, height, weight, activityLevel, goal },
      {
        onSuccess: (res) => toast.success(res.message || 'Đã cập nhật thông tin thành công!'),
        onError: (err) => toast.error(err.response?.data?.message || 'Lỗi cập nhật thông tin'),
      }
    );
  };

  const handleUpdateMacros = (e) => {
    e.preventDefault();
    const sum = Number(macroProtein) + Number(macroCarbs) + Number(macroFat);
    if (sum !== 100) {
      toast.error(`Tổng tỷ lệ phải bằng 100% (Hiện tại: ${sum}%)`);
      return;
    }
    updateMacros.mutate(
      { macroProtein, macroCarbs, macroFat },
      {
        onSuccess: (res) => toast.success(res.message || 'Đã cập nhật Macro thành công!'),
        onError: (err) => toast.error(err.response?.data?.message || 'Lỗi cập nhật Macro'),
      }
    );
  };

  const handleAddAllergy = (foodId) => {
    const currentIds = userAllergies.map(f => f.id);
    if (currentIds.includes(foodId)) return;
    const nextIds = [...currentIds, foodId];
    updateAllergies.mutate(nextIds, {
      onSuccess: () => toast.success('Đã thêm thực phẩm dị ứng'),
    });
  };

  const handleRemoveAllergy = (foodId) => {
    const nextIds = userAllergies.map(f => f.id).filter(id => id !== foodId);
    updateAllergies.mutate(nextIds, {
      onSuccess: () => toast.success('Đã gỡ thực phẩm dị ứng'),
    });
  };

  const handleDownloadReport = (range) => {
    downloadReport.mutate(range, {
      onSuccess: () => {
        toast.success('Bắt đầu tải xuống báo cáo PDF...');
      },
      onError: (err) => {
        const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi tạo báo cáo. Vui lòng thử lại sau.';
        toast.error(errMsg);
      }
    });
  };

  const filteredFoods = availableFoods.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !userAllergies.some(a => a.id === f.id)
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Hồ sơ cá nhân</h1>
        <p className="text-base-content/50 text-sm">Quản lý các chỉ số thể chất, phân bổ dinh dưỡng và danh mục dị ứng</p>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed self-start">
        <button
          className={`tab tab-sm ${activeTab === 'bio' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('bio')}
        >
          <User className="w-3.5 h-3.5 mr-1" /> Chỉ số sinh học
        </button>
        <button
          className={`tab tab-sm ${activeTab === 'macros' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('macros')}
        >
          <Award className="w-3.5 h-3.5 mr-1" /> Tỷ lệ Macro
        </button>
        <button
          className={`tab tab-sm ${activeTab === 'allergies' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('allergies')}
        >
          <ShieldAlert className="w-3.5 h-3.5 mr-1" /> Thực phẩm dị ứng
        </button>
        <button
          className={`tab tab-sm ${activeTab === 'reports' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          <FileText className="w-3.5 h-3.5 mr-1" /> Báo cáo dinh dưỡng
        </button>
      </div>

      {/* Bio Tab Content */}
      {activeTab === 'bio' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form edit */}
          <div className="card bg-base-100 border border-base-300 shadow-sm lg:col-span-2">
            <div className="card-body p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/50 mb-4">Cập nhật chỉ số cơ thể</h3>
              <form onSubmit={handleUpdateBio} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-control sm:col-span-2">
                  <label className="label">
                    <span className="label-text font-medium">Họ và tên</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="input input-bordered input-sm"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Giới tính</span>
                  </label>
                  <select
                    className="select select-bordered select-sm w-full"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-base-content/50" /> Ngày sinh
                    </span>
                  </label>
                  <input
                    type="date"
                    className="input input-bordered input-sm"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>

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
                    placeholder="Ví dụ: 170"
                    className="input input-bordered input-sm"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
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
                    placeholder="Ví dụ: 65"
                    className="input input-bordered input-sm"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium flex items-center gap-1.5">
                      <Dumbbell className="w-4 h-4 text-base-content/50" /> Mức hoạt động
                    </span>
                  </label>
                  <select
                    className="select select-bordered select-sm w-full"
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value)}
                  >
                    <option value="sedentary">Ít vận động</option>
                    <option value="light">Vận động nhẹ (1-3 ngày/tuần)</option>
                    <option value="moderate">Vận động vừa (3-5 ngày/tuần)</option>
                    <option value="active">Năng động (6-7 ngày/tuần)</option>
                    <option value="very_active">Rất năng động</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-base-content/50" /> Mục tiêu sức khỏe
                    </span>
                  </label>
                  <select
                    className="select select-bordered select-sm w-full"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                  >
                    <option value="lose_weight">Giảm cân</option>
                    <option value="maintain_weight">Duy trì cân nặng</option>
                    <option value="gain_weight">Tăng cân</option>
                  </select>
                </div>

                <div className="sm:col-span-2 pt-2">
                  <button
                    type="submit"
                    disabled={updateProfile.isPending}
                    className="btn btn-primary btn-sm gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Biological stats cards */}
          <div className="flex flex-col gap-6 lg:col-span-1">
            <div className="card bg-base-100 border border-base-300 shadow-sm">
              <div className="card-body p-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/50 mb-3">Thông số tính toán</h3>
                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-base-content/60">Chỉ số BMI</span>
                    <p className="text-xl font-bold flex items-baseline gap-1.5 mt-0.5">
                      {metrics.bmi ? metrics.bmi.toFixed(1) : '--'}
                      <span className="text-xs font-semibold badge badge-neutral">
                        {metrics.bmiClass?.label || 'Chưa có'}
                      </span>
                    </p>
                  </div>
                  <div className="border-t border-base-200 pt-3">
                    <span className="text-xs text-base-content/60">Tỷ lệ trao đổi chất cơ bản (BMR)</span>
                    <p className="text-xl font-bold mt-0.5">{metrics.bmr ? `${Math.round(metrics.bmr)} kcal` : '--'}</p>
                  </div>
                  <div className="border-t border-base-200 pt-3">
                    <span className="text-xs text-base-content/60">Tổng tiêu hao hàng ngày (TDEE)</span>
                    <p className="text-xl font-bold mt-0.5">{metrics.tdee ? `${Math.round(metrics.tdee)} kcal` : '--'}</p>
                  </div>
                  <div className="border-t border-base-200 pt-3 bg-primary/5 rounded-xl p-3 border border-primary/10">
                    <span className="text-xs text-primary font-bold">Mục tiêu Calo nạp mỗi ngày</span>
                    <p className="text-2xl font-black text-primary mt-0.5">{metrics.targetCalories ? `${Math.round(metrics.targetCalories)} kcal` : '--'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Macros Tab Content */}
      {activeTab === 'macros' && (
        <div className="card bg-base-100 border border-base-300 shadow-sm max-w-xl">
          <div className="card-body p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/50 mb-2">Tùy chỉnh tỷ lệ dinh dưỡng (Macros)</h3>
            <p className="text-xs text-base-content/50 mb-4">Mặc định hệ thống đề xuất tỷ lệ Protein: 30%, Carbs: 40%, Fat: 30%. Bạn có thể điều chỉnh để đáp ứng nhu cầu tập luyện riêng biệt.</p>
            
            <form onSubmit={handleUpdateMacros} className="flex flex-col gap-4">
              <div className="form-control">
                <div className="flex justify-between items-center mb-1">
                  <span className="label-text font-medium">Protein (%)</span>
                  <span className="badge badge-info font-bold">{macroProtein}%</span>
                </div>
                <input
                  type="range" min="5" max="70" step="5"
                  className="range range-xs range-info"
                  value={macroProtein}
                  onChange={(e) => setMacroProtein(Number(e.target.value))}
                />
              </div>

              <div className="form-control">
                <div className="flex justify-between items-center mb-1">
                  <span className="label-text font-medium">Carbohydrates (%)</span>
                  <span className="badge badge-warning font-bold">{macroCarbs}%</span>
                </div>
                <input
                  type="range" min="5" max="80" step="5"
                  className="range range-xs range-warning"
                  value={macroCarbs}
                  onChange={(e) => setMacroCarbs(Number(e.target.value))}
                />
              </div>

              <div className="form-control">
                <div className="flex justify-between items-center mb-1">
                  <span className="label-text font-medium">Fat (%)</span>
                  <span className="badge badge-secondary font-bold">{macroFat}%</span>
                </div>
                <input
                  type="range" min="5" max="70" step="5"
                  className="range range-xs range-secondary"
                  value={macroFat}
                  onChange={(e) => setMacroFat(Number(e.target.value))}
                />
              </div>

              {/* Total Check */}
              {(() => {
                const total = Number(macroProtein) + Number(macroCarbs) + Number(macroFat);
                const isValid = total === 100;
                return (
                  <div className="flex items-center justify-between border-t border-base-200 pt-3 mt-2">
                    <span className="text-sm font-semibold">Tổng tỷ lệ:</span>
                    <span className={`text-lg font-black ${isValid ? 'text-success' : 'text-error'}`}>
                      {total}% {isValid ? '✓' : '(Yêu cầu 100%)'}
                    </span>
                  </div>
                );
              })()}

              <button
                type="submit"
                disabled={Number(macroProtein) + Number(macroCarbs) + Number(macroFat) !== 100 || updateMacros.isPending}
                className="btn btn-primary btn-sm gap-2 self-start mt-2"
              >
                <Save className="w-4 h-4" />
                Lưu tỷ lệ
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Allergies Tab Content */}
      {activeTab === 'allergies' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Allergies list (1 col) */}
          <div className="card bg-base-100 border border-base-300 shadow-sm lg:col-span-1">
            <div className="card-body p-6 flex flex-col gap-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/50">Thực phẩm đã chọn loại trừ ({userAllergies.length})</h3>
              <p className="text-xs text-base-content/50">Các món ăn này sẽ hoàn toàn bị loại bỏ khỏi các gợi ý thực đơn tự động của hệ thống.</p>
              
              {isLoadingAllergies ? (
                <div className="flex justify-center py-6"><span className="loading loading-spinner" /></div>
              ) : userAllergies.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {userAllergies.map(food => (
                    <div key={food.id} className="badge badge-error gap-1.5 p-3 font-semibold text-sm">
                      {food.name}
                      <button
                        onClick={() => handleRemoveAllergy(food.id)}
                        className="hover:bg-error-focus rounded-full p-0.5"
                        title="Gỡ bỏ"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-base-content/40 py-6 text-center">Chưa chọn thực phẩm dị ứng nào.</p>
              )}
            </div>
          </div>

          {/* Food Search/Select (2 col) */}
          <div className="card bg-base-100 border border-base-300 shadow-sm lg:col-span-2">
            <div className="card-body p-6 flex flex-col gap-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/50">Tìm kiếm & thêm thực phẩm dị ứng</h3>
              
              <div className="form-control">
                <input
                  type="text"
                  placeholder="Nhập tên nguyên liệu (Ví dụ: Trứng, Cá hồi, Đậu nành...)"
                  className="input input-sm input-bordered w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="overflow-y-auto max-h-96 border border-base-200 rounded-xl">
                <table className="table table-sm table-pin-rows">
                  <thead>
                    <tr className="bg-base-200">
                      <th>Tên thực phẩm</th>
                      <th>Nhóm</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFoods.length > 0 ? (
                      filteredFoods.map(food => (
                        <tr key={food.id} className="hover:bg-base-200/50">
                          <td className="font-semibold text-sm">{food.name}</td>
                          <td>
                            <span className="badge badge-ghost badge-xs uppercase">{food.category}</span>
                          </td>
                          <td>
                            <button
                              onClick={() => handleAddAllergy(food.id)}
                              disabled={updateAllergies.isPending}
                              className="btn btn-ghost btn-xs btn-square text-primary hover:bg-primary/10"
                              title="Thêm vào danh sách dị ứng"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center py-8 text-base-content/40">
                          {searchTerm ? 'Không tìm thấy thực phẩm nào khớp.' : 'Nhập từ khóa để bắt đầu tìm kiếm.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab Content */}
      {activeTab === 'reports' && (
        <div className="card bg-base-100 border border-base-300 shadow-sm max-w-xl">
          <div className="card-body p-6">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-primary" />
              Báo cáo dinh dưỡng cá nhân (PDF)
            </h3>
            <p className="text-xs text-base-content/50 mb-6 leading-relaxed">
              Hệ thống tự động biên soạn báo cáo phân tích dinh dưỡng cá nhân dưới dạng PDF chất lượng cao, bao gồm:
              <br />• Phân tích lượng calo và các chất đa lượng (Macros) tiêu thụ thực tế.
              <br />• Sự thay đổi của cân nặng và chỉ số BMI trong kỳ báo cáo.
              <br />• Đánh giá chi tiết lượng xơ, nước nạp vào và so sánh với khuyến nghị chuẩn IOM.
              <br />• **Kế hoạch hành động cụ thể** thích ứng theo cơ chế Adaptive TDEE hiện tại.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mt-2">
              <button
                onClick={() => handleDownloadReport('week')}
                disabled={downloadReport.isPending}
                className="btn btn-primary btn-sm flex-1 gap-2"
              >
                {downloadReport.isPending ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                Tải báo cáo 7 ngày (Tuần)
              </button>

              <button
                onClick={() => handleDownloadReport('month')}
                disabled={downloadReport.isPending}
                className="btn btn-outline btn-primary btn-sm flex-1 gap-2"
              >
                {downloadReport.isPending ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                Tải báo cáo 30 ngày (Tháng)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-8 bg-base-300 rounded w-48" />
      <div className="h-10 bg-base-300 rounded w-80" />
      <div className="grid grid-cols-3 gap-6">
        <div className="h-80 bg-base-300 rounded-2xl col-span-2" />
        <div className="h-80 bg-base-300 rounded-2xl" />
      </div>
    </div>
  );
}
