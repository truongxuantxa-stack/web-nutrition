import { useState } from 'react';
import { useWeightData, useDeleteWeight } from '../hooks/useWeight';
import { useAdaptiveStatus, useAdaptiveHistory, useToggleAdaptive, useCalculateAdaptive, useSkipWeekAdaptive } from '../hooks/useAdaptiveTDEE';
import { getToday, toDisplayDate } from '../lib/dayjs';
import { Scale, TrendingDown, TrendingUp, Plus, Trash2, Calendar, Edit3, Zap, RefreshCw, Activity, History, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { Line } from 'react-chartjs-2';
import AnimatedSection from '../components/common/AnimatedSection';
import AddWeightModal from '../components/common/AddWeightModal';
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
  const deleteWeight = useDeleteWeight();

  // Adaptive TDEE hooks
  const { data: adaptiveStatus, isLoading: statusLoading } = useAdaptiveStatus();
  const { data: adaptiveHistory = [], isLoading: historyLoading } = useAdaptiveHistory();
  const toggleAdaptive = useToggleAdaptive();
  const calculateAdaptive = useCalculateAdaptive();
  const skipWeekAdaptive = useSkipWeekAdaptive();

  // Modal and accordion states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTdeeOpen, setIsTdeeOpen] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);

  if (isLoading) return <WeightSkeleton />;
  if (error) return <div className="alert alert-error">Không thể tải dữ liệu cân nặng.</div>;

  const { logs = [], currentWeight, currentBMI, bmiClass, chartData = [], stats, trend } = data;

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
        return <span className="badge badge-success badge-sm text-white text-[10px]">Độ tin cậy cao</span>;
      case 'medium':
        return <span className="badge badge-warning badge-sm text-white text-[10px]">Độ tin cậy vừa</span>;
      case 'low':
        return <span className="badge badge-error badge-sm text-white text-[10px]">Độ tin cậy thấp</span>;
      default:
        return <span className="badge badge-ghost badge-sm text-[10px]">Chưa xác định</span>;
    }
  };

  const getLogStatusText = (status) => {
    switch (status) {
      case 'calculated':
        return { text: 'Đã cập nhật thích ứng', color: 'text-success' };
      case 'insufficient_data':
        return { text: 'Thiếu dữ liệu', color: 'text-warning' };
      case 'skipped_by_user':
        return { text: 'Người dùng bỏ qua', color: 'text-base-content/40' };
      case 'stable':
        return { text: 'Cân nặng ổn định', color: 'text-info' };
      default:
        return { text: status || 'Chưa cập nhật', color: 'text-base-content/60' };
    }
  };

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
      backgroundColor: (context) => {
        const { ctx, chartArea } = context.chart;
        if (!chartArea) return 'rgba(34,197,94,0.08)';
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, 'rgba(34,197,94,0.25)');
        gradient.addColorStop(1, 'rgba(34,197,94,0.01)');
        return gradient;
      },
      borderWidth: 2.5,
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
      y: { grid: { display: false }, ticks: { font: { size: 11 } } },
    },
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Theo dõi Cân nặng</h1>
        <p className="text-base-content/50 text-sm">Ghi nhận chỉ số cơ thể & phân tích xu hướng</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          <AnimatedSection delay={0}>
            <div className="glass-card">
              <div className="card-body p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/50">Biểu đồ xu hướng (90 ngày qua)</h3>
                  {weights.length > 0 && (
                    <span className="text-xs font-medium text-base-content/40 bg-base-200/50 px-2 py-0.5 rounded-md">
                      Bắt đầu: {weights[weights.length - 1]} kg → Hiện tại: {weights[0]} kg
                    </span>
                  )}
                </div>
                <div className="h-80 md:h-96">
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
          </AnimatedSection>

          <AnimatedSection delay={0.1}>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-4">
              <div className="glass-card stat-card p-4 flex flex-col justify-between min-h-[110px]">
                <div className="flex items-center justify-between text-base-content/50">
                  <span className="text-xs font-bold uppercase tracking-wider text-[10px]">Cân nặng</span>
                  <Scale className="w-4 h-4 text-primary" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-base-content">{currentWeight || '--'}</span>
                  <span className="text-xs text-base-content/60 ml-1">kg</span>
                </div>
                <div className="text-[10px] text-base-content/50 mt-1 flex items-center gap-1">
                  {trend ? (
                    <>
                      {trend.direction === 'down' ? (
                        <span className="text-success font-semibold flex items-center">↓ Giảm {Math.abs(trend.diff)} kg</span>
                      ) : trend.direction === 'up' ? (
                        <span className="text-error font-semibold flex items-center">↑ Tăng {trend.diff} kg</span>
                      ) : (
                        <span>Không đổi</span>
                      )}
                      <span>(30 ngày)</span>
                    </>
                  ) : (
                    <span>Chưa có xu hướng</span>
                  )}
                </div>
              </div>

              <div className="glass-card stat-card p-4 flex flex-col justify-between min-h-[110px]">
                <div className="flex items-center justify-between text-base-content/50">
                  <span className="text-xs font-bold uppercase tracking-wider text-[10px]">Chỉ số BMI</span>
                  <Activity className="w-4 h-4 text-info" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-base-content">{currentBMI ? currentBMI.toFixed(1) : '--'}</span>
                  <span className="text-xs text-base-content/60 ml-1">kg/m²</span>
                </div>
                <div className="mt-1">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${bmiDetails.bg}`}>
                    {bmiClass?.label || bmiClass || 'Chưa tính'}
                  </span>
                </div>
              </div>

              <div className="glass-card stat-card p-4 flex flex-col justify-between min-h-[110px]">
                <div className="flex items-center justify-between text-base-content/50">
                  <span className="text-xs font-bold uppercase tracking-wider text-[10px]">Biến thiên 30n</span>
                  <TrendingDown className="w-4 h-4 text-warning" />
                </div>
                <div className="mt-2 flex flex-col gap-0.5 text-xs text-base-content/70">
                  <div>Min: <span className="font-semibold text-success">{stats?.min || currentWeight || '--'} kg</span></div>
                  <div>Max: <span className="font-semibold text-error">{stats?.max || currentWeight || '--'} kg</span></div>
                </div>
                <div className="text-[10px] text-base-content/40 mt-1">
                  TB: <span className="font-medium text-base-content/70">{stats?.avg || currentWeight || '--'} kg</span>
                </div>
              </div>

              <div className="glass-card stat-card p-4 flex flex-col justify-between min-h-[110px]">
                <div className="flex items-center justify-between text-base-content/50">
                  <span className="text-xs font-bold uppercase tracking-wider text-[10px]">Ghi nhận</span>
                  <Calendar className="w-4 h-4 text-secondary" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-base-content">{logs.length}</span>
                  <span className="text-xs text-base-content/60 ml-1">lần</span>
                </div>
                <div className="text-[10px] text-base-content/50 mt-1 truncate">
                  {logs.length > 0 ? `Cuối: ${toDisplayDate(logs[0].date)}` : 'Chưa ghi nhận'}
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>

        <div className="lg:col-span-1 flex flex-col gap-6">
          
          <AnimatedSection delay={0.15}>
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn btn-primary w-full gap-2 py-4 h-auto text-base rounded-2xl shadow-md hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-300"
            >
              <Plus className="w-5 h-5" />
              Thêm cân nặng mới
            </button>
          </AnimatedSection>

          <AnimatedSection delay={0.2}>
            <div className="glass-card overflow-hidden">
              <div className="card-body p-5 gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/50">Lịch sử ghi nhận</h3>
                  <span className="badge badge-neutral badge-sm text-xs font-mono px-1.5 py-0.5 h-auto">{logs.length} dòng</span>
                </div>

                <div className="overflow-x-auto">
                  {logs.length > 0 ? (
                    <>
                      <table className="table table-sm w-full">
                        <thead>
                          <tr className="bg-base-200/50 text-[10px] text-base-content/50 uppercase">
                            <th>Ngày ghi</th>
                            <th className="text-right">Cân nặng</th>
                            <th className="w-8"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {(showAllLogs ? logs : logs.slice(0, 5)).map((log) => (
                            <tr key={log.id} className="hover:bg-base-200/40 transition-colors">
                              <td className="font-semibold text-xs text-base-content/85">
                                {toDisplayDate(log.date)}
                              </td>
                              <td className="text-right font-mono font-bold text-xs text-base-content">
                                {log.weight} kg
                              </td>
                              <td>
                                <button
                                  id={`delete-weight-${log.id}`}
                                  onClick={() => handleDelete(log.id)}
                                  className="btn btn-ghost btn-xs btn-square text-error hover:bg-error/10"
                                  title="Xóa dòng này"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {logs.length > 5 && (
                        <div className="flex justify-center mt-3 pt-2 border-t border-base-200/50">
                          <button
                            onClick={() => setShowAllLogs(!showAllLogs)}
                            className="btn btn-ghost btn-xs gap-1 text-primary hover:bg-primary/10 w-full font-semibold"
                          >
                            {showAllLogs ? 'Thu gọn' : `Xem thêm (+${logs.length - 5} dòng)`}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="py-8 text-center text-base-content/40 text-xs italic">
                      Bạn chưa ghi nhận cân nặng nào.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>

      <AnimatedSection delay={0.25}>
        <div className="glass-card overflow-hidden border border-base-300/40 shadow-sm">
          <button
            onClick={() => setIsTdeeOpen(!isTdeeOpen)}
            className="w-full flex items-center justify-between p-5 text-left bg-base-200/25 hover:bg-base-200/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="bg-warning/10 p-2 rounded-xl border border-warning/20">
                <Zap className="w-5 h-5 text-warning fill-warning" />
              </div>
              <div>
                <h3 className="text-base font-bold text-base-content">
                  🤖 AI Phân tích: TDEE Thích ứng của bạn
                </h3>
                <p className="text-xs text-base-content/50 mt-0.5">
                  Tự động điều chỉnh TDEE thực tế dựa trên biến thiên cân nặng và calo nạp vào thực tế
                </p>
              </div>
            </div>
            <div className="btn btn-ghost btn-xs btn-square">
              {isTdeeOpen ? (
                <ChevronUp className="w-4 h-4 text-base-content/50" />
              ) : (
                <ChevronDown className="w-4 h-4 text-base-content/50" />
              )}
            </div>
          </button>

          {isTdeeOpen && (
            <div className="p-6 border-t border-base-200 flex flex-col gap-6 bg-base-100/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-base-200/60 pb-4">
                <div className="text-xs text-base-content/50">
                  Cấu hình việc áp dụng thuật toán thích ứng năng lượng
                </div>
                <div className="form-control bg-base-200/50 px-4 py-2 rounded-xl border border-base-300/50 flex flex-row items-center gap-3 w-fit">
                  <span className="label-text font-semibold text-xs">Sử dụng Adaptive TDEE:</span>
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

              {statusLoading ? (
                <div className="flex justify-center py-6"><span className="loading loading-spinner text-primary" /></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-base-200/40 p-4 rounded-xl border border-base-300/50 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-semibold text-base-content/50 uppercase tracking-wider text-[10px]">TDEE Tĩnh (BMR * Activity)</span>
                      <div className="text-xl font-extrabold text-base-content mt-1">
                        {adaptiveStatus?.staticTDEE ? Math.round(adaptiveStatus.staticTDEE) : '--'} <span className="text-xs font-normal">kcal</span>
                      </div>
                    </div>
                    <p className="text-[9px] text-base-content/40 mt-2">Tính từ giới tính, chiều cao, tuổi, cân nặng và hệ số hoạt động</p>
                  </div>

                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-primary uppercase tracking-wider text-[10px]">TDEE Thích ứng thực tế</span>
                      <div className="text-xl font-black text-primary mt-1">
                        {adaptiveStatus?.adaptiveTDEE ? Math.round(adaptiveStatus.adaptiveTDEE) : '--'} <span className="text-xs font-bold">kcal</span>
                      </div>
                    </div>
                    <p className="text-[9px] text-primary/60 mt-2">Dựa trên cân nặng thực tế và hấp thụ năng lượng 4 tuần</p>
                  </div>

                  <div className="bg-base-200/40 p-4 rounded-xl border border-base-300/50 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-semibold text-base-content/50 uppercase tracking-wider text-[10px]">TDEE Đang Áp Dụng</span>
                      <div className="text-xl font-extrabold text-base-content mt-1">
                        {adaptiveStatus?.currentTDEE ? Math.round(adaptiveStatus.currentTDEE) : '--'} <span className="text-xs font-normal">kcal</span>
                      </div>
                    </div>
                    <p className="text-[9px] text-base-content/40 mt-2">
                      {adaptiveStatus?.useAdaptiveTDEE ? 'Sử dụng TDEE Thích ứng' : 'Sử dụng TDEE Tĩnh'}
                    </p>
                  </div>

                  <div className="bg-success/5 p-4 rounded-xl border border-success/20 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-success uppercase tracking-wider text-[10px]">Mục tiêu Calo hằng ngày</span>
                      <div className="text-xl font-black text-success mt-1">
                        {adaptiveStatus?.targetCalories ? Math.round(adaptiveStatus.targetCalories) : '--'} <span className="text-xs font-bold">kcal</span>
                      </div>
                    </div>
                    <p className="text-[9px] text-success/60 mt-2">Đã tối ưu theo mục tiêu giảm/tăng/giữ cân của bạn</p>
                  </div>
                </div>
              )}

              {!statusLoading && adaptiveStatus?.latestLog && (
                <div className="bg-base-200/30 p-4 rounded-xl border border-base-200/50 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="md:col-span-2">
                    <h4 className="font-bold text-xs flex items-center gap-1.5 text-base-content/80">
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
                        Biến thiên: <span className={`font-bold ${adaptiveStatus.latestLog.weightDelta > 0 ? 'text-error' : adaptiveStatus.latestLog.weightDelta < 0 ? 'text-success' : 'text-base-content/60'}`}>
                          {adaptiveStatus.latestLog.weightDelta > 0 ? `+${adaptiveStatus.latestLog.weightDelta}` : adaptiveStatus.latestLog.weightDelta} kg
                        </span>
                      </div>
                      <div className="text-xs">
                        Calo nạp TB: <span className="font-bold text-base-content">{adaptiveStatus.latestLog.avgDailyIntake ? Math.round(adaptiveStatus.latestLog.avgDailyIntake) : 0} kcal/ngày</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={handleSkipWeek}
                      disabled={skipWeekAdaptive.isPending}
                      className="btn btn-outline btn-xs gap-1 rounded-lg"
                      title="Không thay đổi TDEE tuần này"
                    >
                      Bỏ qua tuần này
                    </button>
                    <button
                      onClick={handleCalculateTdee}
                      disabled={calculateAdaptive.isPending}
                      className="btn btn-primary btn-xs gap-1 rounded-lg"
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

              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-base-content/50 mb-3 flex items-center gap-1.5">
                  <History className="w-4 h-4" />
                  Lịch sử biến thiên TDEE (12 tuần qua)
                </h4>
                <div className="h-60 bg-base-200/20 rounded-xl p-4 border border-base-300/50">
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
                            backgroundColor: (context) => {
                              const { ctx, chartArea } = context.chart;
                              if (!chartArea) return 'rgba(59,130,246,0.05)';
                              const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                              gradient.addColorStop(0, 'rgba(59,130,246,0.18)');
                              gradient.addColorStop(1, 'rgba(59,130,246,0.01)');
                              return gradient;
                            },
                            borderWidth: 2,
                            tension: 0.3,
                            pointRadius: 4,
                            pointBackgroundColor: '#3b82f6',
                            fill: true,
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
                          y: { grid: { display: false }, ticks: { font: { size: 10 } } }
                        }
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-base-content/40 text-xs italic">
                      Chưa có lịch sử tuần thích ứng nào được lưu lại.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </AnimatedSection>

      <AddWeightModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

function WeightSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-8 bg-base-300 rounded w-48 animate-pulse" />
    </div>
  );
}
