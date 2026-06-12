import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../hooks/useDashboard';
import { useDownloadReport } from '../hooks/useReport';
import { useAdaptiveStatus } from '../hooks/useAdaptiveTDEE';
import { useDiaryData } from '../hooks/useDiary';
import { useExerciseData } from '../hooks/useExercise';
import { useAuth } from '../contexts/AuthContext';
import { getToday } from '../lib/dayjs';

import DateNavigator from '../components/common/DateNavigator';
import CalorieRing  from '../components/dashboard/CalorieRing';
import MacrosChart  from '../components/dashboard/MacrosChart';
import WeightChart  from '../components/dashboard/WeightChart';
import WaterProgress from '../components/dashboard/WaterProgress';
import MicronutrientCard from '../components/dashboard/MicronutrientCard';
import MacroSummaryCard from '../components/dashboard/MacroSummaryCard';
import RecentMeals from '../components/dashboard/RecentMeals';
import RecentActivity from '../components/dashboard/RecentActivity';
import QuickActionFAB from '../components/dashboard/QuickActionFAB';
import DailyInsightsCard from '../components/common/DailyInsightsCard';
import AddFoodModal from '../components/diary/AddFoodModal';

import { FileText, ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

// Hàm chào mừng theo giờ
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Chào buổi sáng';
  if (hour >= 12 && hour < 18) return 'Chào buổi chiều';
  if (hour >= 18 && hour < 22) return 'Chào buổi tối';
  return 'Chào cú đêm';
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [date, setDate] = useState(getToday());
  const [isAddFoodOpen, setIsAddFoodOpen] = useState(false);
  const [activeMeal, setActiveMeal] = useState('sang');

  const { data, isLoading, error } = useDashboard(date);
  const { data: diaryData, isLoading: diaryLoading } = useDiaryData(date);
  const { data: exerciseData, isLoading: exerciseLoading } = useExerciseData(date);
  const { data: adaptiveStatus, isLoading: adaptiveLoading } = useAdaptiveStatus();
  const downloadReport = useDownloadReport();

  // Gộp tất cả các bữa ăn từ diaryData.mealGroups thành một danh sách phẳng
  const allDiaryEntries = useMemo(() => {
    const entries = [];
    if (diaryData && diaryData.mealGroups) {
      Object.keys(diaryData.mealGroups).forEach((mealKey) => {
        const groupEntries = diaryData.mealGroups[mealKey] || [];
        groupEntries.forEach((entry) => {
          entries.push({ ...entry, mealType: mealKey });
        });
      });
    }
    return entries;
  }, [diaryData]);

  // Tính trend cân nặng gần nhất
  const trend = useMemo(() => {
    const chartData = data?.weightChartData;
    if (!chartData || chartData.length < 2) return null;
    const latest = chartData[chartData.length - 1].weight;
    const previous = chartData[chartData.length - 2].weight;
    const diff = latest - previous;
    return {
      latest,
      previous,
      diff: parseFloat(diff.toFixed(1)),
      isDown: diff < 0,
      isUp: diff > 0,
    };
  }, [data?.weightChartData]);

  if (isLoading || diaryLoading || exerciseLoading) return <DashboardSkeleton />;
  if (error) return (
    <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
      Không thể tải dữ liệu dashboard.
    </div>
  );

  const { metrics, consumed, totalBurned, macroProgress, weightChartData, waterTotal, waterGoal, healthInsights, healthScore } = data;

  const handleDownloadReport = (range) => {
    downloadReport.mutate(range, {
      onSuccess: () => toast.success('Bắt đầu tải báo cáo PDF...'),
      onError:   () => toast.error('Tải báo cáo thất bại'),
    });
  };

  const handleOpenAddFood = (meal = 'sang') => {
    setActiveMeal(meal);
    setIsAddFoodOpen(true);
  };

  const targetCalories  = metrics?.targetCalories ? Math.round(metrics.targetCalories) : 0;
  const caloriePercent  = targetCalories > 0 ? Math.round((consumed.calories / targetCalories) * 100) : 0;
  const userInitial     = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  const exerciseLogs    = exerciseData?.logs || [];

  return (
    <div className="flex flex-col gap-6 pb-20">

      {/* ── Greeting Bar ─────────────────────────────────────────────── */}
      <div className="tcl-card rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-[#003139]/15 text-[#003139] font-black text-lg flex items-center justify-center flex-shrink-0">
            {userInitial}
          </div>
          <div>
            <h1 className="text-lg font-extrabold flex items-center gap-1.5 text-[#003139]">
              {getGreeting()}, {data.user?.name || user?.name || 'bạn'}! 👋
            </h1>
            <p className="text-sm text-[#96A5A8] font-medium mt-0.5">
              Hôm nay bạn đã nạp <span className="text-[#003139] font-bold">{caloriePercent}%</span> mục tiêu calo.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto border-t md:border-t-0 border-[#DFE3E4] pt-3 md:pt-0">
          <button
            onClick={() => handleDownloadReport('week')}
            disabled={downloadReport.isPending}
            className="tcl-btn-ghost text-sm gap-1.5 border border-[#DFE3E4] rounded-full px-4 py-2"
          >
            {downloadReport.isPending ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-[#244348]/30 border-t-[#244348] rounded-full animate-spin" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
            Tải báo cáo
          </button>
          <DateNavigator date={date} onDateChange={setDate} />
        </div>
      </div>

      {/* ── Macro Summary Cards Row ──────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MacroSummaryCard icon="🥩" label="Protein"  value={consumed.protein} unit="g"    target={metrics?.macros?.protein || 0} colorScheme="blue" />
        <MacroSummaryCard icon="🍚" label="Carbs"    value={consumed.carbs}   unit="g"    target={metrics?.macros?.carbs   || 0} colorScheme="amber" />
        <MacroSummaryCard icon="🥑" label="Chất béo" value={consumed.fat}     unit="g"    target={metrics?.macros?.fat     || 0} colorScheme="pink" />
        <MacroSummaryCard icon="🔥" label="Calo đốt" value={totalBurned}      unit="kcal" target={0}                             colorScheme="emerald" />
      </div>

      {/* ── Bento Grid Layout ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* CalorieRing Hero Card */}
          <div className="tcl-card rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-around gap-6">
            <div className="flex-shrink-0">
              <CalorieRing consumed={consumed.calories} target={targetCalories} noCard={true} />
            </div>

            <div className="hidden md:block w-px h-36 bg-[#DFE3E4]" />

            <div className="flex-grow w-full max-w-xs flex flex-col gap-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-[#96A5A8] mb-1">Chỉ số dinh dưỡng nạp vào</h3>

              {/* Protein Progress */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-1.5 font-medium text-[#244348]">🥩 Protein</span>
                  <span className="font-semibold text-blue-500">{consumed.protein}g <span className="text-xs font-normal text-[#96A5A8]">/ {metrics?.macros?.protein || 0}g</span></span>
                </div>
                <div className="h-2 bg-[#F0F2F3] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min(macroProgress?.protein?.percent || 0, 100)}%` }} />
                </div>
              </div>

              {/* Carbs Progress */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-1.5 font-medium text-[#244348]">🍚 Carbs</span>
                  <span className="font-semibold text-amber-500">{consumed.carbs}g <span className="text-xs font-normal text-[#96A5A8]">/ {metrics?.macros?.carbs || 0}g</span></span>
                </div>
                <div className="h-2 bg-[#F0F2F3] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-amber-400 transition-all duration-500" style={{ width: `${Math.min(macroProgress?.carbs?.percent || 0, 100)}%` }} />
                </div>
              </div>

              {/* Fat Progress */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-1.5 font-medium text-[#244348]">🥑 Chất béo</span>
                  <span className="font-semibold text-pink-500">{consumed.fat}g <span className="text-xs font-normal text-[#96A5A8]">/ {metrics?.macros?.fat || 0}g</span></span>
                </div>
                <div className="h-2 bg-[#F0F2F3] rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-pink-400 transition-all duration-500" style={{ width: `${Math.min(macroProgress?.fat?.percent || 0, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row: Macros & Adaptive TDEE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MacrosChart consumed={consumed} target={metrics?.macros} />

            {/* TDEE Card */}
            <div className="tcl-card rounded-2xl flex flex-col justify-between h-full p-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#96A5A8] flex items-center gap-1">
                    🎯 TDEE Thích ứng
                  </span>
                  <span className="tcl-badge-neutral text-[10px] px-2 py-0.5">EMA</span>
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-black text-[#003139]">
                    {adaptiveLoading ? (
                      <span className="inline-block w-6 h-6 border-2 border-[#003139]/20 border-t-[#003139] rounded-full animate-spin text-base" />
                    ) : (
                      adaptiveStatus?.useAdaptiveTDEE
                        ? (adaptiveStatus.adaptiveTDEE ? Math.round(adaptiveStatus.adaptiveTDEE) : '--')
                        : (adaptiveStatus?.staticTDEE   ? Math.round(adaptiveStatus.staticTDEE)  : '--')
                    )}
                  </span>
                  <span className="text-xs text-[#96A5A8] font-semibold">kcal/ngày</span>
                </div>
                <p className="text-[10px] text-[#96A5A8] mt-3 leading-relaxed">
                  {adaptiveStatus?.useAdaptiveTDEE
                    ? `Đang áp dụng thích ứng (Tĩnh: ${adaptiveStatus?.staticTDEE ? Math.round(adaptiveStatus.staticTDEE) : '--'} kcal)`
                    : 'Đang áp dụng TDEE tĩnh (chưa bật thích ứng)'}
                </p>
              </div>
              <div className="border-t border-[#DFE3E4] pt-3 flex justify-between items-center mt-4">
                <span className="text-xs text-[#96A5A8] font-semibold">Mục tiêu: {targetCalories} kcal</span>
                <button
                  onClick={() => navigate('/weight')}
                  className="inline-flex items-center gap-0.5 text-xs font-bold text-[#003139] hover:underline"
                >
                  Chi tiết <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Weight Chart với xu hướng */}
          <div className="relative">
            {trend && (
              <div className="absolute top-5 right-6 z-10 hidden sm:flex items-center gap-2">
                <span className="text-[10px] uppercase font-semibold text-[#96A5A8] tracking-wider">Xu hướng:</span>
                <span className="text-xs font-bold text-[#003139]">{trend.latest} kg</span>
                {trend.diff !== 0 && (
                  <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${trend.isDown ? 'bg-[#5FE089]/15 text-[#2EA850]' : 'bg-red-100 text-red-600'}`}>
                    {trend.isDown ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                    {Math.abs(trend.diff)} kg
                  </span>
                )}
              </div>
            )}
            <WeightChart chartData={weightChartData} />
          </div>

          {/* Recent Meals & Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RecentMeals entries={allDiaryEntries} onAddClick={() => handleOpenAddFood('sang')} />
            <RecentActivity logs={exerciseLogs} totalBurned={totalBurned} />
          </div>

        </div>

        {/* Right Sidebar (1/3) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <WaterProgress total={waterTotal} goal={waterGoal} date={date} />
          <MicronutrientCard consumed={consumed} gender={data.user?.gender} />
          <DailyInsightsCard insights={healthInsights || []} healthScore={healthScore} maxVisible={3} />
        </div>

      </div>

      {/* FAB Quick Action */}
      <QuickActionFAB onClick={() => handleOpenAddFood('sang')} />

      {/* Modal thêm bữa ăn */}
      <AddFoodModal
        isOpen={isAddFoodOpen}
        onClose={() => setIsAddFoodOpen(false)}
        date={date}
        defaultMeal={activeMeal}
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 pb-20">
      <div className="h-20 bg-[#DFE3E4] rounded-2xl w-full animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-gradient-to-r from-[#DFE3E4] via-[#F0F2F3] to-[#DFE3E4] bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="h-60 rounded-2xl bg-gradient-to-r from-[#DFE3E4] via-[#F0F2F3] to-[#DFE3E4] bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 rounded-2xl bg-gradient-to-r from-[#DFE3E4] via-[#F0F2F3] to-[#DFE3E4] bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
            <div className="h-64 rounded-2xl bg-gradient-to-r from-[#DFE3E4] via-[#F0F2F3] to-[#DFE3E4] bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
          </div>
          <div className="h-60 rounded-2xl bg-gradient-to-r from-[#DFE3E4] via-[#F0F2F3] to-[#DFE3E4] bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="h-52 rounded-2xl bg-gradient-to-r from-[#DFE3E4] via-[#F0F2F3] to-[#DFE3E4] bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
          <div className="h-80 rounded-2xl bg-gradient-to-r from-[#DFE3E4] via-[#F0F2F3] to-[#DFE3E4] bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
          <div className="h-80 rounded-2xl bg-gradient-to-r from-[#DFE3E4] via-[#F0F2F3] to-[#DFE3E4] bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
