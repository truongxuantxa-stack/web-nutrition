import { useState, useEffect } from 'react';
import { useWeightData, useDeleteWeight } from '../hooks/useWeight';
import { useWeightTrend } from '../hooks/useWeightTrend';
import { useAdaptiveStatus, useAdaptiveHistory, useToggleAdaptive, useCalculateAdaptive, useSkipWeekAdaptive } from '../hooks/useAdaptiveTDEE';
import { getToday, toDisplayDate } from '../lib/dayjs';
import { Scale, TrendingDown, TrendingUp, Plus, Trash2, Calendar, Activity, History, RefreshCw, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { Line } from 'react-chartjs-2';
import AddWeightModal from '../components/common/AddWeightModal';
import WeightTrendChart from '../components/dashboard/WeightTrendChart';
import TrendSummaryCard from '../components/dashboard/TrendSummaryCard';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler,
} from 'chart.js';

export default function WeightPage() {
  const { data, isLoading, error } = useWeightData();
  const deleteWeight = useDeleteWeight();

  const { data: adaptiveStatus, isLoading: statusLoading } = useAdaptiveStatus();
  const { data: adaptiveHistory = [], isLoading: historyLoading } = useAdaptiveHistory();
  const toggleAdaptive    = useToggleAdaptive();
  const calculateAdaptive = useCalculateAdaptive();
  const skipWeekAdaptive  = useSkipWeekAdaptive();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [trendRange, setTrendRange]   = useState(30);

  const { data: trendData, isLoading: isTrendLoading } = useWeightTrend(trendRange);

  useEffect(() => {
    if (!trendData || !trendData.hasSufficientData || !trendData.summary) return;
    const lastToastDate = localStorage.getItem('lastWeightToastDate');
    const todayStr = getToday();
    if (lastToastDate === todayStr) return;
    const rawPoints = trendData.rawPoints;
    if (rawPoints && rawPoints.length >= 2) {
      const latestRaw  = rawPoints[rawPoints.length - 1].weight;
      const previousRaw = rawPoints[rawPoints.length - 2].weight;
      const trendLine = trendData.trendLine;
      if (trendLine && trendLine.length >= 2) {
        const currentEMA   = trendLine[trendLine.length - 1].ema;
        const previousEMA  = trendLine[trendLine.length - 2].ema;
        const currentEMA_direction = trendData.summary.direction;
        if (latestRaw > previousRaw && currentEMA < previousEMA) {
          toast('Đừng lo! Xu hướng cân nặng vẫn đang giảm. Đây chỉ là dao động nước.', { icon: '💧', duration: 5000 });
          localStorage.setItem('lastWeightToastDate', todayStr);
        } else if (latestRaw - previousRaw > 1.5 && currentEMA_direction === 'down') {
          toast('Tăng hơn 1.5kg/ngày thường do nước/muối, không phải mỡ.', { icon: '🧂', duration: 5000 });
          localStorage.setItem('lastWeightToastDate', todayStr);
        }
      }
    }
  }, [trendData]);

  if (isLoading) return <WeightSkeleton />;
  if (error) return (
    <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
      Không thể tải dữ liệu cân nặng.
    </div>
  );

  const { logs = [], currentWeight, currentBMI, bmiClass, chartData = [], stats, trend } = data;

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa lịch sử cân nặng này?')) {
      deleteWeight.mutate(id, {
        onSuccess: (res) => toast.success(res.message || 'Đã xóa cân nặng'),
        onError:   () => toast.error('Không thể xóa log cân nặng'),
      });
    }
  };

  const handleToggleAdaptive = (checked) => {
    toggleAdaptive.mutate(checked, {
      onSuccess: () => toast.success(checked ? 'Đã bật TDEE Thích ứng' : 'Đã tắt TDEE Thích ứng'),
      onError:   (err) => toast.error(err.response?.data?.message || 'Không thể cập nhật TDEE Thích ứng'),
    });
  };

  const handleCalculateTdee = () => {
    if (window.confirm('Hệ thống sẽ tính toán Adaptive TDEE dựa trên dữ liệu cân nặng và ăn uống của tuần trước. Bạn có muốn tiếp tục?')) {
      calculateAdaptive.mutate(undefined, {
        onSuccess: (res) => toast.success(res.message || 'Tính toán Adaptive TDEE thành công!'),
        onError:   (err) => toast.error(err.response?.data?.message || 'Tính toán thất bại. Hãy chắc chắn bạn đã ghi nhận đủ dữ liệu tuần trước.'),
      });
    }
  };

  const handleSkipWeek = () => {
    if (window.confirm('Bạn có chắc chắn muốn bỏ qua việc tính toán thích ứng cho tuần hiện tại?')) {
      skipWeekAdaptive.mutate(undefined, {
        onSuccess: (res) => toast.success(res.message || 'Đã bỏ qua tuần này thành công.'),
        onError:   (err) => toast.error(err.response?.data?.message || 'Không thể bỏ qua tuần này.'),
      });
    }
  };

  const getConfidenceBadge = (confidence) => {
    const map = {
      high:   { cls: 'bg-[#5FE089]/20 text-[#2EA850]', text: 'Độ tin cậy cao' },
      medium: { cls: 'bg-amber-100 text-amber-600',    text: 'Độ tin cậy vừa' },
      low:    { cls: 'bg-red-100 text-red-600',         text: 'Độ tin cậy thấp' },
    };
    const c = map[confidence] || { cls: 'bg-[#F0F2F3] text-[#96A5A8]', text: 'Chưa xác định' };
    return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.cls}`}>{c.text}</span>;
  };

  const getLogStatusColor = (status) => {
    switch (status) {
      case 'calculated':        return 'text-[#2EA850]';
      case 'insufficient_data': return 'text-amber-500';
      case 'skipped_by_user':   return 'text-[#96A5A8]';
      case 'stable':            return 'text-blue-500';
      default:                  return 'text-[#96A5A8]';
    }
  };
  const getLogStatusText = (status) => {
    switch (status) {
      case 'calculated':        return 'Đã cập nhật thích ứng';
      case 'insufficient_data': return 'Thiếu dữ liệu';
      case 'skipped_by_user':   return 'Người dùng bỏ qua';
      case 'stable':            return 'Cân nặng ổn định';
      default:                  return status || 'Chưa cập nhật';
    }
  };

  const getBmiDetails = (className) => {
    switch (className) {
      case 'Thiếu cân':
      case 'Gầy':        return { bg: 'bg-blue-50 border-blue-200 text-blue-600' };
      case 'Bình thường': return { bg: 'bg-[#5FE089]/10 border-[#5FE089]/30 text-[#2EA850]' };
      case 'Thừa cân':   return { bg: 'bg-amber-50 border-amber-200 text-amber-600' };
      case 'Béo phì':    return { bg: 'bg-red-50 border-red-200 text-red-600' };
      default:           return { bg: 'bg-[#F0F2F3] border-[#DFE3E4] text-[#96A5A8]' };
    }
  };
  const bmiDetails = getBmiDetails(bmiClass?.label || bmiClass);

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#003139]">Theo dõi Cân nặng</h1>
          <p className="text-[#96A5A8] text-sm font-medium mt-1">Ghi nhận chỉ số cơ thể & phân tích xu hướng</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="tcl-btn-primary shadow-sm hover:shadow-md"
        >
          <Plus className="w-5 h-5 mr-1.5" />
          Thêm cân nặng mới
        </button>
      </div>

      {/* Trend Chart */}
      <div className="h-[420px] w-full">
        {isTrendLoading ? (
          <div className="tcl-card rounded-2xl h-full flex items-center justify-center">
            <span className="inline-block w-8 h-8 border-2 border-[#DFE3E4] border-t-[#003139] rounded-full animate-spin" />
          </div>
        ) : (
          <WeightTrendChart data={trendData} range={trendRange} onRangeChange={setTrendRange} />
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* TrendSummaryCard */}
        {isTrendLoading ? (
          <div className="tcl-card rounded-2xl p-5 min-h-[110px] animate-pulse" />
        ) : (
          <TrendSummaryCard data={trendData} />
        )}

        {/* BMI */}
        <div className="tcl-card rounded-2xl p-5 flex flex-col justify-between min-h-[110px] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between text-[#96A5A8]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#96A5A8]">Chỉ số BMI</span>
            <Activity className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-[#003139]">{currentBMI ? currentBMI.toFixed(1) : '--'}</span>
            <span className="text-xs text-[#96A5A8] ml-1">kg/m²</span>
          </div>
          <div className="mt-1">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${bmiDetails.bg}`}>
              {bmiClass?.label || bmiClass || 'Chưa tính'}
            </span>
          </div>
        </div>

        {/* Biến thiên */}
        <div className="tcl-card rounded-2xl p-5 flex flex-col justify-between min-h-[110px] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between text-[#96A5A8]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#96A5A8]">Biến thiên 30n</span>
            <TrendingDown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex flex-col gap-0.5 text-xs text-[#244348]">
            <div>Min: <span className="font-semibold text-[#2EA850]">{stats?.min || currentWeight || '--'} kg</span></div>
            <div>Max: <span className="font-semibold text-red-500">{stats?.max || currentWeight || '--'} kg</span></div>
          </div>
          <div className="text-[10px] text-[#96A5A8] mt-1">
            TB: <span className="font-medium text-[#244348]">{stats?.avg || currentWeight || '--'} kg</span>
          </div>
        </div>

        {/* Ghi nhận */}
        <div className="tcl-card rounded-2xl p-5 flex flex-col justify-between min-h-[110px] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between text-[#96A5A8]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#96A5A8]">Ghi nhận</span>
            <Calendar className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-[#003139]">{logs.length}</span>
            <span className="text-xs text-[#96A5A8] ml-1">lần</span>
          </div>
          <div className="text-[10px] text-[#96A5A8] mt-1 truncate">
            {logs.length > 0 ? `Cuối: ${toDisplayDate(logs[0].date)}` : 'Chưa ghi nhận'}
          </div>
        </div>
      </div>

      {/* TDEE & Lịch sử */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* TDEE Adaptive Accordion (col-span-3) */}
        <div className="lg:col-span-3">
          <div className="tcl-card rounded-2xl p-0 overflow-hidden border border-[#DFE3E4] h-full flex flex-col">
            <div className="w-full flex items-center justify-between p-5 text-left border-b border-[#DFE3E4]">
              <div className="flex items-center gap-3">
                <div className="bg-amber-50 p-2 rounded-xl border border-amber-200">
                  <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#003139]">🤖 AI Phân tích: TDEE Thích ứng</h3>
                  <p className="text-xs text-[#96A5A8] mt-0.5">Tự động điều chỉnh TDEE dựa trên biến thiên cân nặng</p>
                </div>
              </div>
            </div>

            <div className="p-6 flex flex-col gap-6 flex-1">
                {/* Toggle */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#DFE3E4] pb-4">
                  <div className="text-xs text-[#96A5A8]">Cấu hình việc áp dụng thuật toán thích ứng năng lượng</div>
                  <div className="flex items-center gap-3 bg-[#F0F2F3] px-4 py-2 rounded-xl border border-[#DFE3E4]">
                    <span className="text-xs font-semibold text-[#244348]">Sử dụng Adaptive TDEE:</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        id="toggle-adaptive"
                        type="checkbox"
                        className="sr-only peer"
                        checked={adaptiveStatus?.useAdaptiveTDEE || false}
                        disabled={toggleAdaptive.isPending}
                        onChange={(e) => handleToggleAdaptive(e.target.checked)}
                      />
                      <div className="w-9 h-5 bg-[#DFE3E4] rounded-full peer peer-checked:bg-[#003139] transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                  </div>
                </div>

                {/* TDEE stat cards */}
                {statusLoading ? (
                  <div className="flex justify-center py-6">
                    <span className="inline-block w-6 h-6 border-2 border-[#DFE3E4] border-t-[#003139] rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                    <div className="bg-[#F0F2F3] p-4 rounded-xl border border-[#DFE3E4] flex flex-col justify-between">
                      <span className="text-[10px] font-semibold text-[#96A5A8] uppercase tracking-wider">TDEE Tĩnh</span>
                      <div className="text-xl font-extrabold text-[#003139] mt-1">
                        {adaptiveStatus?.staticTDEE ? Math.round(adaptiveStatus.staticTDEE) : '--'} <span className="text-xs font-normal">kcal</span>
                      </div>
                      <p className="text-[9px] text-[#96A5A8] mt-2">BMR × Activity</p>
                    </div>

                    <div className="bg-[#003139]/5 p-4 rounded-xl border border-[#003139]/20 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-[#003139] uppercase tracking-wider">TDEE Thích ứng</span>
                      <div className="text-xl font-black text-[#003139] mt-1">
                        {adaptiveStatus?.adaptiveTDEE ? Math.round(adaptiveStatus.adaptiveTDEE) : '--'} <span className="text-xs font-bold">kcal</span>
                      </div>
                      <p className="text-[9px] text-[#003139]/60 mt-2">Dựa trên cân nặng thực tế</p>
                    </div>

                    <div className="bg-[#F0F2F3] p-4 rounded-xl border border-[#DFE3E4] flex flex-col justify-between">
                      <span className="text-[10px] font-semibold text-[#96A5A8] uppercase tracking-wider">Đang Áp Dụng</span>
                      <div className="text-xl font-extrabold text-[#003139] mt-1">
                        {adaptiveStatus?.currentTDEE ? Math.round(adaptiveStatus.currentTDEE) : '--'} <span className="text-xs font-normal">kcal</span>
                      </div>
                      <p className="text-[9px] text-[#96A5A8] mt-2">
                        {adaptiveStatus?.useAdaptiveTDEE ? 'TDEE Thích ứng' : 'TDEE Tĩnh'}
                      </p>
                    </div>

                    <div className="bg-[#5FE089]/10 p-4 rounded-xl border border-[#5FE089]/30 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-[#2EA850] uppercase tracking-wider">Mục tiêu Calo</span>
                      <div className="text-xl font-black text-[#2EA850] mt-1">
                        {adaptiveStatus?.targetCalories ? Math.round(adaptiveStatus.targetCalories) : '--'} <span className="text-xs font-bold">kcal</span>
                      </div>
                      <p className="text-[9px] text-[#2EA850]/60 mt-2">Đã tối ưu</p>
                    </div>
                  </div>
                )}

                {/* Latest log status */}
                {!statusLoading && adaptiveStatus?.latestLog && (
                  <div className="bg-[#F0F2F3] p-4 rounded-xl border border-[#DFE3E4] grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="md:col-span-2">
                      <h4 className="font-bold text-xs flex items-center gap-1.5 text-[#244348]">
                        <Activity className="w-4 h-4 text-[#003139]" />
                        Trạng thái tuần ({toDisplayDate(adaptiveStatus.latestLog.weekStartDate)}):
                      </h4>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                        <div className="text-xs">
                          Trạng thái: <span className={`font-bold ${getLogStatusColor(adaptiveStatus.latestLog.status)}`}>
                            {getLogStatusText(adaptiveStatus.latestLog.status)}
                          </span>
                        </div>
                        <div className="flex items-center">{getConfidenceBadge(adaptiveStatus.latestLog.confidence)}</div>
                        <div className="text-xs">
                          Biến thiên: <span className={`font-bold ${adaptiveStatus.latestLog.weightDelta > 0 ? 'text-red-500' : adaptiveStatus.latestLog.weightDelta < 0 ? 'text-[#2EA850]' : 'text-[#96A5A8]'}`}>
                            {adaptiveStatus.latestLog.weightDelta > 0 ? `+${adaptiveStatus.latestLog.weightDelta}` : adaptiveStatus.latestLog.weightDelta} kg
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 md:flex-col lg:flex-row flex-wrap">
                      <button
                        onClick={handleSkipWeek}
                        disabled={skipWeekAdaptive.isPending}
                        className="tcl-btn-ghost text-[10px] px-2 py-1.5 rounded-lg border border-[#DFE3E4]"
                      >
                        Bỏ qua
                      </button>
                      <button
                        onClick={handleCalculateTdee}
                        disabled={calculateAdaptive.isPending}
                        className="tcl-btn-primary text-[10px] px-2 py-1.5 rounded-lg"
                      >
                        {calculateAdaptive.isPending ? (
                          <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin mr-1" />
                        ) : (
                          <RefreshCw className="w-3 h-3 mr-1" />
                        )}
                        Tính toán
                      </button>
                    </div>
                  </div>
                )}

                {/* History Chart */}
                <div className="mt-auto">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#96A5A8] mb-3 flex items-center gap-1.5">
                    <History className="w-4 h-4" /> Lịch sử biến thiên (12 tuần)
                  </h4>
                  <div className="h-48 bg-[#F0F2F3] rounded-xl p-3 border border-[#DFE3E4]">
                    {historyLoading ? (
                      <div className="flex justify-center items-center h-full">
                        <span className="inline-block w-6 h-6 border-2 border-[#DFE3E4] border-t-[#003139] rounded-full animate-spin" />
                      </div>
                    ) : adaptiveHistory && adaptiveHistory.length > 0 ? (
                      <Line
                        key={JSON.stringify(adaptiveHistory)}
                        data={{
                          labels: adaptiveHistory.map(h => {
                            if (!h.weekStartDate) return '';
                            const parts = h.weekStartDate.split('-');
                            return `${parts[2]}/${parts[1]}`;
                          }),
                          datasets: [
                            {
                              label: 'TDEE Thích ứng',
                              data: adaptiveHistory.map(h => h.rollingTDEE || h.calculatedTDEE),
                              borderColor: '#003139',
                              backgroundColor: (context) => {
                                const { ctx, chartArea } = context.chart;
                                if (!chartArea) return 'rgba(0,49,57,0.05)';
                                const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                                gradient.addColorStop(0, 'rgba(0,49,57,0.15)');
                                gradient.addColorStop(1, 'rgba(0,49,57,0.01)');
                                return gradient;
                              },
                              borderWidth: 2,
                              tension: 0.3,
                              pointRadius: 3,
                              pointBackgroundColor: '#003139',
                              fill: true,
                            },
                            {
                              label: 'TDEE Tĩnh',
                              data: adaptiveHistory.map(h => h.staticTDEE),
                              borderColor: '#96A5A8',
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
                            legend: { display: false },
                            tooltip: { callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw} kcal` } }
                          },
                          scales: {
                            x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                            y: { grid: { display: false }, ticks: { font: { size: 10 } } }
                          }
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-[#96A5A8] text-xs italic">
                        Chưa có lịch sử.
                      </div>
                    )}
                  </div>
                </div>
              </div>
          </div>
        </div>

        {/* Lịch sử ghi nhận (col-span-2) */}
        <div className="lg:col-span-2">
          <div className="tcl-card rounded-2xl p-0 overflow-hidden flex flex-col h-full">
            <div className="p-5 flex flex-col h-full gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#96A5A8]">Lịch sử ghi nhận</h3>
                <span className="tcl-badge font-mono px-1.5">{logs.length} dòng</span>
              </div>

              <div className="flex-1 overflow-hidden flex flex-col">
                {logs.length > 0 ? (
                  <div className={`overflow-x-auto ${showAllLogs ? 'max-h-[500px] overflow-y-auto pr-2' : ''}`}>
                    <table className="tcl-table w-full relative">
                      <thead className="sticky top-0 z-10 shadow-sm bg-[#F0F2F3]">
                        <tr>
                          <th>Ngày ghi</th>
                          <th className="text-right">Cân nặng</th>
                          <th className="text-center">±Δ</th>
                          <th className="w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(showAllLogs ? logs : logs.slice(0, 10)).map((log, index, arr) => {
                          let delta = 0;
                          let originalIndex = showAllLogs ? index : logs.findIndex(l => l.id === log.id);
                          if (originalIndex < logs.length - 1) {
                            delta = (log.weight - logs[originalIndex + 1].weight).toFixed(1);
                          }
                          
                          return (
                          <tr key={log.id}>
                            <td className="font-semibold text-sm text-[#244348]">{toDisplayDate(log.date)}</td>
                            <td className="text-right font-bold text-sm text-[#003139] whitespace-nowrap">
                              {log.weight} <span className="text-[10px] font-semibold text-[#96A5A8]">kg</span>
                            </td>
                            <td className="text-center">
                              {originalIndex < logs.length - 1 ? (
                                delta > 0 ? (
                                  <span className="inline-flex items-center text-sm font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-md"><TrendingUp className="w-4 h-4 mr-1" />+{delta}</span>
                                ) : delta < 0 ? (
                                  <span className="inline-flex items-center text-sm font-bold text-[#2EA850] bg-[#5FE089]/10 px-2 py-0.5 rounded-md"><TrendingDown className="w-4 h-4 mr-1" />{delta}</span>
                                ) : (
                                  <span className="inline-flex items-center text-sm font-bold text-[#96A5A8] bg-[#F0F2F3] px-2 py-0.5 rounded-md">0.0</span>
                                )
                              ) : (
                                <span className="text-[#96A5A8] text-sm">--</span>
                              )}
                            </td>
                            <td>
                              <button
                                id={`delete-weight-${log.id}`}
                                onClick={() => handleDelete(log.id)}
                                className="p-1 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                title="Xóa dòng này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-[#96A5A8] text-xs italic">
                    Bạn chưa ghi nhận cân nặng nào.
                  </div>
                )}
              </div>
              
              {logs.length > 10 && (
                <div className="flex justify-center mt-auto pt-3 border-t border-[#DFE3E4]">
                  <button
                    onClick={() => setShowAllLogs(!showAllLogs)}
                    className="text-xs font-semibold text-[#003139] hover:underline w-full py-1 transition-all"
                  >
                    {showAllLogs ? 'Thu gọn bảng' : `Xem tất cả (+${logs.length - 10} dòng) ↓`}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <AddWeightModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

function WeightSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-8 bg-[#DFE3E4] rounded w-48 animate-pulse" />
    </div>
  );
}
