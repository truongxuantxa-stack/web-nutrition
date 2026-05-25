import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import { useDownloadReport } from '../hooks/useReport';
import { useAdaptiveStatus } from '../hooks/useAdaptiveTDEE';
import { getToday } from '../lib/dayjs';
import DateNavigator from '../components/common/DateNavigator';
import StatCard      from '../components/common/StatCard';
import CalorieRing  from '../components/dashboard/CalorieRing';
import MacrosChart  from '../components/dashboard/MacrosChart';
import WeightChart  from '../components/dashboard/WeightChart';
import WaterProgress from '../components/dashboard/WaterProgress';
import { FileText, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [date, setDate] = useState(getToday);
  const { data, isLoading, error } = useDashboard(date);
  const downloadReport = useDownloadReport();
  const { data: adaptiveStatus, isLoading: adaptiveLoading } = useAdaptiveStatus();

  if (isLoading) return <DashboardSkeleton />;
  if (error)     return <div className="alert alert-error">Không thể tải dữ liệu dashboard.</div>;

  const { metrics, consumed, totalBurned, macroProgress, weightChartData, waterTotal, waterGoal } = data;

  const handleDownloadReport = (range) => {
    downloadReport.mutate(range, {
      onSuccess: () => {
        toast.success('Bắt đầu tải báo cáo PDF...');
      },
      onError: () => {
        toast.error('Tải báo cáo thất bại');
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tổng quan</h1>
          <p className="text-base-content/50 text-sm">Chào mừng trở lại, {data.user?.name}!</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleDownloadReport('week')}
            disabled={downloadReport.isPending}
            className="btn btn-outline btn-sm gap-2"
          >
            {downloadReport.isPending ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Tải báo cáo
          </button>
          <DateNavigator date={date} onDateChange={setDate} />
        </div>
      </div>

      {/* Row 1: Calorie Ring + Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sm:col-span-1">
          <CalorieRing consumed={consumed.calories} target={metrics?.targetCalories || 0} />
        </div>
        <div className="sm:col-span-1 lg:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            icon="🥩"
            label="Protein"
            value={consumed.protein}
            unit="g"
            progress={macroProgress?.protein?.percent}
            color="info"
          />
          <StatCard
            icon="🍚"
            label="Carbs"
            value={consumed.carbs}
            unit="g"
            progress={macroProgress?.carbs?.percent}
            color="warning"
          />
          <StatCard
            icon="🥑"
            label="Fat"
            value={consumed.fat}
            unit="g"
            progress={macroProgress?.fat?.percent}
            color="secondary"
          />
        </div>
      </div>

      {/* Row 2: Macros Doughnut + Water + Exercise + Adaptive TDEE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MacrosChart
          consumed={consumed}
          target={metrics?.macros}
        />
        <WaterProgress total={waterTotal} goal={waterGoal} date={date} />
        <StatCard
          icon="🏃"
          label="Calo đốt (luyện tập)"
          value={totalBurned}
          unit="kcal"
          color="success"
          className="h-full"
        />
        <div className="card bg-base-100 border border-base-300 shadow-sm flex flex-col justify-between">
          <div className="card-body p-6 flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold uppercase tracking-wider text-base-content/50">🎯 TDEE Thích ứng</span>
                <span className="badge badge-primary badge-xs">EMA</span>
              </div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-extrabold text-primary">
                  {adaptiveLoading ? (
                    <span className="loading loading-dots loading-sm" />
                  ) : (
                    adaptiveStatus?.useAdaptiveTDEE ? adaptiveStatus?.adaptiveTDEE : adaptiveStatus?.staticTDEE || '--'
                  )}
                </span>
                <span className="text-xs text-base-content/60">kcal/ngày</span>
              </div>
              <p className="text-[10px] text-base-content/50 mt-2 leading-relaxed">
                {adaptiveStatus?.useAdaptiveTDEE 
                  ? `Đang áp dụng thích ứng (Tĩnh: ${adaptiveStatus?.staticTDEE} kcal)` 
                  : 'Đang áp dụng TDEE tĩnh (chưa bật thích ứng)'}
              </p>
            </div>
            <div className="border-t border-base-200 mt-4 pt-3 flex justify-between items-center">
              <span className="text-xs text-base-content/60 font-medium">Mục tiêu: {metrics?.targetCalories || 0} kcal</span>
              <button 
                onClick={() => navigate('/weight')}
                className="btn btn-ghost btn-xs text-primary gap-0.5 px-1 hover:bg-primary/10"
              >
                Chi tiết <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Weight Chart */}
      <WeightChart chartData={weightChartData} />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="h-10 bg-base-300 rounded w-64" />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 bg-base-300 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-64 bg-base-300 rounded-2xl" />
        ))}
      </div>
      <div className="h-52 bg-base-300 rounded-2xl" />
    </div>
  );
}
