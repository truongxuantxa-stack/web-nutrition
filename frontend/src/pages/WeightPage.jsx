import { useState } from 'react';
import { useWeightData, useAddWeight, useDeleteWeight } from '../hooks/useWeight';
import { useAdaptiveStatus, useAdaptiveHistory, useToggleAdaptive, useCalculateAdaptive, useSkipWeekAdaptive } from '../hooks/useAdaptiveTDEE';
import { getToday, toDisplayDate } from '../lib/dayjs';
import { Scale, TrendingDown, TrendingUp, Plus, Trash2, Calendar, Edit3, ArrowRight, Zap, RefreshCw, Activity, History } from 'lucide-react';
import toast from 'react-hot-toast';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export default function WeightPage() {
  const { data, isLoading, error } = useWeightData();
  const addWeight = useAddWeight();
  const deleteWeight = useDeleteWeight();

  // Adaptive TDEE hooks
  const { data: adaptiveStatus, isLoading: statusLoading } = useAdaptiveStatus();
  const { data: adaptiveHistory = [], isLoading: historyLoading } = useAdaptiveHistory();
  const toggleAdaptive = useToggleAdaptive();
  const calculateAdaptive = useCalculateAdaptive();
  const skipWeekAdaptive = useSkipWeekAdaptive();

  // Form states
  const [weightInput, setWeightInput] = useState('');
  const [dateInput, setDateInput] = useState(getToday());
  const [noteInput, setNoteInput] = useState('');

  if (isLoading) return <WeightSkeleton />;
  if (error) return <div className="alert alert-error">Không thể tải dữ liệu cân nặng.</div>;

  const { logs = [], currentWeight, currentBMI, bmiClass, chartData = [], stats, trend } = data;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!weightInput) {
      toast.error('Vui lòng nhập cân nặng');
      return;
    }
    const val = parseFloat(weightInput);
    if (isNaN(val) || val < 10 || val > 500) {
      toast.error('Cân nặng phải từ 10kg đến 500kg');
      return;
    }

    addWeight.mutate(
      { weight: val, date: dateInput, note: noteInput },
      {
        onSuccess: (res) => {
          toast.success(res.message || 'Đã ghi nhận cân nặng');
          setWeightInput('');
          setNoteInput('');
        },
        onError: (err) => {
          const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi ghi nhận cân nặng';
          toast.error(errMsg);
        },
      }
    );
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch sử cân nặng này?')) {
      deleteWeight.mutate(id, {
        onSuccess: (res) => {
          toast.success(res.message || 'Đã xóa cân nặng');
        },
        onError: () => {
          toast.error('Không thể xóa log cân nặng');
        },
      });
    }
  };

  // Adaptive TDEE handlers
  const handleToggleAdaptive = (checked) => {
    toggleAdaptive.mutate(checked, {
      onSuccess: () => {
        toast.success(checked ? 'Đã bật TDEE Thích ứng' : 'Đã tắt TDEE Thích ứng');
      },
      onError: (err) => {
        toast.error(err.response?.data?.message || 'Không thể cập nhật TDEE Thích ứng');
      }
    });
  };

  const handleCalculateTdee = () => {
    if (window.confirm('Hệ thống sẽ tính toán Adaptive TDEE dựa trên dữ liệu cân nặng và ăn uống của tuần trước. Bạn có muốn tiếp tục?')) {
      calculateAdaptive.mutate(undefined, {
        onSuccess: (res) => {
          toast.success(res.message || 'Tính toán Adaptive TDEE thành công!');
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || 'Tính toán thất bại. Hãy chắc chắn bạn đã ghi nhận đủ dữ liệu tuần trước.');
        }
      });
    }
  };

  const handleSkipWeek = () => {
    if (window.confirm('Bạn có chắc chắn muốn bỏ qua việc tính toán thích ứng cho tuần hiện tại? Dữ liệu tuần này sẽ không được dùng để thay đổi TDEE.')) {
      skipWeekAdaptive.mutate(undefined, {
        onSuccess: (res) => {
          toast.success(res.message || 'Đã bỏ qua tuần này thành công.');
        },
        onError: (err) => {
          toast.error(err.response?.data?.message || 'Không thể bỏ qua tuần này.');
        }
      });
    }
  };

  const getConfidenceBadge = (confidence) => {
    switch (confidence) {
      case 'high':
        return <span className="badge badge-success badge-sm text-white">Độ tin cậy cao</span>;
      case 'medium':
        return <span className="badge badge-warning badge-sm text-white">Độ tin cậy vừa</span>;
      case 'low':
        return <span className="badge badge-error badge-sm text-white">Độ tin cậy thấp</span>;
      default:
        return <span className="badge badge-ghost badge-sm">Chưa xác định</span>;
    }
  };

  const getLogStatusText = (status) => {
    switch (status) {
      case 'calculated':
        return { text: 'Đã cập nhật thích ứng', color: 'text-success' };
      case 'insufficient_data':
        return { text: 'Thiếu dữ liệu cân nặng/dinh dưỡng', color: 'text-warning' };
      case 'skipped_by_user':
        return { text: 'Người dùng bỏ qua', color: 'text-base-content/40' };
      case 'stable':
        return { text: 'Cân nặng ổn định', color: 'text-info' };
      default:
        return { text: status || 'Chưa cập nhật', color: 'text-base-content/60' };
    }
  };

  // BMI color and styling helper
  const getBmiBadge = (className) => {
    switch (className) {
      case 'Thiếu cân':
      case 'Gầy':
        return { color: 'badge-info', text: 'Nhẹ cân (Gầy)', bg: 'bg-info/10 border-info/20 text-info' };
      case 'Bình thường':
        return { color: 'badge-success', text: 'Bình thường (Khỏe mạnh)', bg: 'bg-success/10 border-success/20 text-success' };
      case 'Thừa cân':
        return { color: 'badge-warning', text: 'Thừa cân', bg: 'bg-warning/10 border-warning/20 text-warning' };
      case 'Béo phì':
        return { color: 'badge-error', text: 'Béo phì', bg: 'bg-error/10 border-error/20 text-error' };
      default:
        return { color: 'badge-ghost', text: typeof className === 'string' ? className : 'Chưa xác định', bg: 'bg-base-200 border-base-300' };
    }
  };

  const bmiDetails = getBmiBadge(bmiClass?.label || bmiClass);

  // Line Chart Config
  const labels = chartData.map(d => {
    if (!d.date || typeof d.date !== 'string') return '';
    const parts = d.date.split('T')[0].split('-');
    if (parts.length < 3) return d.date;
    const [, m, day] = parts;
    return `${day}/${m}`;
  });
  const weights = chartData.map(d => d.weight);

  const chartJsData = {
    labels,
    datasets: [{
      label: 'Cân nặng (kg)',
      data: weights,
      borderColor: '#22c55e',
      backgroundColor: 'rgba(34,197,94,0.08)',
      borderWidth: 2,
      fill: true,
      tension: 0.35,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#22c55e',
    }],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.raw} kg`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 11 } } },
    },
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Theo dõi Cân nặng</h1>
        <p className="text-base-content/50 text-sm">Ghi nhận chỉ số cơ thể & phân tích xu hướng</p>
      </div>

      {/* Row 1: BMI Card & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* BMI Card */}
        <div className="card bg-base-100 border border-base-300 shadow-sm md:col-span-1">
          <div className="card-body p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold uppercase tracking-wider text-base-content/50">Chỉ số BMI</span>
                <Scale className="w-5 h-5 text-primary" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-base-content">{currentBMI ? currentBMI.toFixed(1) : '--'}</span>
                <span className="text-sm text-base-content/60">kg/m²</span>
              </div>
              <div className={`mt-3 border text-xs font-semibold px-2.5 py-1.5 rounded-lg inline-block ${bmiDetails.bg}`}>
                {bmiDetails.text}
              </div>
            </div>
            <div className="border-t border-base-200 mt-4 pt-4 text-xs text-base-content/50">
              Cân nặng hiện tại: <span className="font-bold text-base-content">{currentWeight} kg</span>
            </div>
          </div>
        </div>

        {/* Stats & Trend Card */}
        <div className="card bg-base-100 border border-base-300 shadow-sm md:col-span-2">
          <div className="card-body p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/50 mb-4">Thống kê & Xu hướng (30 ngày)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-base-200/50 rounded-xl p-4">
                <p className="text-xs text-base-content/60">Trung bình</p>
                <p className="text-xl font-bold mt-1">{stats?.avg || currentWeight || '--'} <span className="text-xs font-normal">kg</span></p>
              </div>
              <div className="bg-base-200/50 rounded-xl p-4">
                <p className="text-xs text-base-content/60">Thấp nhất</p>
                <p className="text-xl font-bold mt-1 text-success">{stats?.min || currentWeight || '--'} <span className="text-xs font-normal">kg</span></p>
              </div>
              <div className="bg-base-200/50 rounded-xl p-4">
                <p className="text-xs text-base-content/60">Cao nhất</p>
                <p className="text-xl font-bold mt-1 text-error">{stats?.max || currentWeight || '--'} <span className="text-xs font-normal">kg</span></p>
              </div>
              <div className="bg-base-200/50 rounded-xl p-4 flex flex-col justify-between">
                <p className="text-xs text-base-content/60">Xu hướng</p>
                {trend ? (
                  <div className="flex items-center gap-1 mt-1 font-bold">
                    {trend.direction === 'down' ? (
                      <>
                        <TrendingDown className="w-5 h-5 text-success" />
                        <span className="text-success text-lg">-{Math.abs(trend.diff)} kg</span>
                      </>
                    ) : trend.direction === 'up' ? (
                      <>
                        <TrendingUp className="w-5 h-5 text-error" />
                        <span className="text-error text-lg">+{trend.diff} kg</span>
                      </>
                    ) : (
                      <span className="text-base-content/70">Không đổi</span>
                    )}
                  </div>
                ) : (
                  <p className="text-sm font-medium mt-2 text-base-content/40">Chưa đủ dữ liệu</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Chart & Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weight Chart (2 columns) */}
        <div className="card bg-base-100 border border-base-300 shadow-sm lg:col-span-2">
          <div className="card-body p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/50 mb-4">Biểu đồ xu hướng (90 ngày qua)</h3>
            <div className="h-64">
              {chartData.length > 0 ? (
                <Line data={chartJsData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-base-content/40 text-sm">Chưa có dữ liệu biểu đồ</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Input Form (1 column) */}
        <div className="card bg-base-100 border border-base-300 shadow-sm">
          <div className="card-body p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/50 mb-4">Ghi nhận cân nặng</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-base-content/50" /> Ngày ghi nhận
                  </span>
                </label>
                <input
                  id="weight-date"
                  type="date"
                  className="input input-bordered input-sm"
                  max={getToday()}
                  value={dateInput}
                  onChange={(e) => setDateInput(e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-base-content/50" /> Cân nặng (kg)
                  </span>
                </label>
                <input
                  id="weight-value"
                  type="number"
                  step="0.1"
                  min="10"
                  max="500"
                  placeholder="Ví dụ: 65.5"
                  className="input input-bordered input-sm"
                  required
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-base-content/50" /> Ghi chú (nếu có)
                  </span>
                </label>
                <input
                  id="weight-note"
                  type="text"
                  placeholder="Ví dụ: Cân lúc sáng sớm ngủ dậy"
                  className="input input-bordered input-sm"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                />
              </div>

              <button
                id="submit-weight"
                type="submit"
                disabled={addWeight.isPending}
                className="btn btn-primary btn-sm gap-2 mt-2"
              >
                {addWeight.isPending ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Ghi nhận
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Row 3: History Logs Table */}
      <div className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
        <div className="card-body p-6 gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/50">Lịch sử ghi nhận</h3>
            <span className="badge badge-neutral badge-sm">{logs.length} dòng</span>
          </div>

          <div className="overflow-x-auto">
            {logs.length > 0 ? (
              <table className="table table-sm w-full">
                <thead>
                  <tr className="bg-base-200 text-xs text-base-content/60">
                    <th>Ngày ghi nhận</th>
                    <th className="text-right">Cân nặng</th>
                    <th>Ghi chú</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-base-200/50 transition-colors">
                      <td className="font-medium text-sm">
                        {toDisplayDate(log.date)}
                      </td>
                      <td className="text-right font-mono font-bold text-sm">
                        {log.weight} kg
                      </td>
                      <td className="text-xs text-base-content/60 max-w-xs truncate">
                        {log.note || '—'}
                      </td>
                      <td>
                        <button
                          id={`delete-weight-${log.id}`}
                          onClick={() => handleDelete(log.id)}
                          disabled={deleteWeight.isPending}
                          className="btn btn-ghost btn-xs btn-square text-error hover:bg-error/10"
                          title="Xóa dòng"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="py-12 text-center text-base-content/40 text-sm">
                Bạn chưa ghi nhận cân nặng nào. Hãy nhập ở biểu mẫu bên trên!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section: Adaptive TDEE */}
      <div className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden mt-2">
        <div className="card-body p-6 gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-base-200 pb-4">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Zap className="w-5 h-5 text-warning fill-warning" />
                Thuật toán Adaptive TDEE (TDEE Thích ứng)
              </h3>
              <p className="text-xs text-base-content/50 mt-1">
                Tự động điều chỉnh TDEE thực tế dựa trên biến thiên cân nặng và calo nạp vào thực tế
              </p>
            </div>
            
            {/* Toggle Switch */}
            <div className="form-control bg-base-200/50 px-4 py-2.5 rounded-xl border border-base-300 flex flex-row items-center gap-3">
              <span className="label-text font-semibold text-sm">Sử dụng Adaptive TDEE:</span>
              <input
                id="toggle-adaptive"
                type="checkbox"
                className="toggle toggle-primary toggle-sm"
                checked={adaptiveStatus?.useAdaptiveTDEE || false}
                disabled={toggleAdaptive.isPending}
                onChange={(e) => handleToggleAdaptive(e.target.checked)}
              />
            </div>
          </div>

          {/* Dữ liệu số liệu hiện tại */}
          {statusLoading ? (
            <div className="flex justify-center py-6"><span className="loading loading-spinner text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-base-200/40 p-4 rounded-xl border border-base-300 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-base-content/50 uppercase tracking-wider">TDEE Tĩnh (BMR * Activity)</span>
                  <div className="text-2xl font-extrabold text-base-content mt-1">
                    {adaptiveStatus?.staticTDEE || '--'} <span className="text-xs font-normal">kcal</span>
                  </div>
                </div>
                <p className="text-[10px] text-base-content/40 mt-2">Tính từ giới tính, chiều cao, tuổi, cân nặng và hệ số hoạt động</p>
              </div>

              <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1">
                    TDEE Thích ứng thực tế
                  </span>
                  <div className="text-2xl font-black text-primary mt-1">
                    {adaptiveStatus?.adaptiveTDEE || '--'} <span className="text-xs font-bold">kcal</span>
                  </div>
                </div>
                <p className="text-[10px] text-primary/60 mt-2">Dựa trên cân nặng thực tế và hấp thụ năng lượng 4 tuần</p>
              </div>

              <div className="bg-base-200/40 p-4 rounded-xl border border-base-300 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold text-base-content/50 uppercase tracking-wider">TDEE Đang Áp Dụng</span>
                  <div className="text-2xl font-extrabold text-base-content mt-1">
                    {adaptiveStatus?.currentTDEE || '--'} <span className="text-xs font-normal">kcal</span>
                  </div>
                </div>
                <p className="text-[10px] text-base-content/40 mt-2">
                  {adaptiveStatus?.useAdaptiveTDEE ? 'Sử dụng TDEE Thích ứng' : 'Sử dụng TDEE Tĩnh'}
                </p>
              </div>

              <div className="bg-success/5 p-4 rounded-xl border border-success/20 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-success uppercase tracking-wider">Mục tiêu Calo hằng ngày</span>
                  <div className="text-2xl font-black text-success mt-1">
                    {adaptiveStatus?.targetCalories || '--'} <span className="text-xs font-bold">kcal</span>
                  </div>
                </div>
                <p className="text-[10px] text-success/60 mt-2">Đã tối ưu theo mục tiêu giảm/tăng/giữ cân của bạn</p>
              </div>
            </div>
          )}

          {/* Section: Tuần gần nhất & Thao tác thủ công */}
          {!statusLoading && adaptiveStatus?.latestLog && (
            <div className="bg-base-200/30 p-4 rounded-xl border border-base-200 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-2">
                <h4 className="font-bold text-sm flex items-center gap-1.5 text-base-content/80">
                  <Activity className="w-4 h-4 text-primary" />
                  Trạng thái tuần gần nhất ({toDisplayDate(adaptiveStatus.latestLog.weekStartDate)}):
                </h4>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                  <div className="text-xs">
                    Trạng thái: <span className={`font-bold ${getLogStatusText(adaptiveStatus.latestLog.status).color}`}>
                      {getLogStatusText(adaptiveStatus.latestLog.status).text}
                    </span>
                  </div>
                  <div className="flex items-center">{getConfidenceBadge(adaptiveStatus.latestLog.confidence)}</div>
                  <div className="text-xs">
                    Biến thiên cân nặng: <span className={`font-bold ${adaptiveStatus.latestLog.weightDelta > 0 ? 'text-error' : adaptiveStatus.latestLog.weightDelta < 0 ? 'text-success' : 'text-base-content/60'}`}>
                      {adaptiveStatus.latestLog.weightDelta > 0 ? `+${adaptiveStatus.latestLog.weightDelta}` : adaptiveStatus.latestLog.weightDelta} kg
                    </span>
                  </div>
                  <div className="text-xs">
                    Calo nạp trung bình: <span className="font-bold text-base-content">{adaptiveStatus.latestLog.avgDailyIntake} kcal/ngày</span>
                  </div>
                </div>
              </div>

              {/* Thao tác thủ công */}
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleSkipWeek}
                  disabled={skipWeekAdaptive.isPending}
                  className="btn btn-outline btn-xs gap-1"
                  title="Không thay đổi TDEE tuần này"
                >
                  Bỏ qua tuần này
                </button>
                <button
                  onClick={handleCalculateTdee}
                  disabled={calculateAdaptive.isPending}
                  className="btn btn-primary btn-xs gap-1"
                  title="Tính toán thích ứng cho tuần trước ngay lập tức"
                >
                  {calculateAdaptive.isPending ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  Tính tuần trước
                </button>
              </div>
            </div>
          )}

          {/* Section: Biểu đồ lịch sử TDEE 12 tuần */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-base-content/50 mb-3 flex items-center gap-1.5">
              <History className="w-4 h-4" />
              Lịch sử biến thiên TDEE (12 tuần qua)
            </h4>
            <div className="h-60 bg-base-200/20 rounded-xl p-4 border border-base-300">
              {historyLoading ? (
                <div className="flex justify-center items-center h-full"><span className="loading loading-spinner text-primary" /></div>
              ) : adaptiveHistory && adaptiveHistory.length > 0 ? (
                <Line
                  data={{
                    labels: adaptiveHistory.map(h => {
                      if (!h.weekStartDate) return '';
                      const parts = h.weekStartDate.split('-');
                      return `${parts[2]}/${parts[1]}`;
                    }),
                    datasets: [
                      {
                        label: 'TDEE Thích ứng (kcal)',
                        data: adaptiveHistory.map(h => h.rollingTDEE || h.calculatedTDEE),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59,130,246,0.05)',
                        borderWidth: 2,
                        tension: 0.3,
                        pointRadius: 4,
                        pointBackgroundColor: '#3b82f6',
                      },
                      {
                        label: 'TDEE Tĩnh (kcal)',
                        data: adaptiveHistory.map(h => h.staticTDEE),
                        borderColor: '#9ca3af',
                        borderDash: [5, 5],
                        borderWidth: 1.5,
                        pointRadius: 0,
                        fill: false,
                      }
                    ]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { 
                        position: 'top',
                        labels: { boxWidth: 12, font: { size: 11 } }
                      },
                      tooltip: {
                        callbacks: {
                          label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw} kcal`,
                        }
                      }
                    },
                    scales: {
                      x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                      y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 } } }
                    }
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-base-content/40 text-xs">
                  Chưa có lịch sử tuần thích ứng nào được lưu lại. Hệ thống sẽ tự động cập nhật sau mỗi tuần đủ dữ liệu.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WeightSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-8 bg-base-300 rounded w-48" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-36 bg-base-300 rounded-2xl" />
        <div className="h-36 bg-base-300 rounded-2xl md:col-span-2" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-80 bg-base-300 rounded-2xl lg:col-span-2" />
        <div className="h-80 bg-base-300 rounded-2xl" />
      </div>
      <div className="h-64 bg-base-300 rounded-2xl" />
    </div>
  );
}
