import { useState } from 'react';
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
import MacroSummaryCard from '../components/dashboard/MacroSummaryCard';
import RecentMeals from '../components/dashboard/RecentMeals';
import RecentActivity from '../components/dashboard/RecentActivity';
import QuickActionFAB from '../components/dashboard/QuickActionFAB';
import AddFoodModal from '../components/diary/AddFoodModal';

import { FileText, ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import AnimatedSection from '../components/common/AnimatedSection';

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

  if (isLoading || diaryLoading || exerciseLoading) return <DashboardSkeleton />;
  if (error) return <div className="alert alert-error m-4">Không thể tải dữ liệu dashboard.</div>;

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

  const handleOpenAddFood = (meal = 'sang') => {
    setActiveMeal(meal);
    setIsAddFoodOpen(true);
  };

  // Tính % calo đã nạp
  const targetCalories = metrics?.targetCalories ? Math.round(metrics.targetCalories) : 0;
  const caloriePercent = targetCalories > 0 ? Math.round((consumed.calories / targetCalories) * 100) : 0;

  // Lấy avatar chữ cái đầu
  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';

  // Gộp tất cả các bữa ăn từ diaryData.mealGroups thành một danh sách phẳng
  const allDiaryEntries = [];
  if (diaryData && diaryData.mealGroups) {
    Object.keys(diaryData.mealGroups).forEach((mealKey) => {
      const groupEntries = diaryData.mealGroups[mealKey] || [];
      groupEntries.forEach((entry) => {
        allDiaryEntries.push({
          ...entry,
          mealType: mealKey,
        });
      });
    });
  }

  // Danh sách log bài tập
  const exerciseLogs = exerciseData?.logs || [];

  // Tính trend cân nặng gần nhất
  const getWeightTrend = () => {
    if (!weightChartData || weightChartData.length < 2) return null;
    const latest = weightChartData[weightChartData.length - 1].weight;
    const previous = weightChartData[weightChartData.length - 2].weight;
    const diff = latest - previous;
    return {
      latest,
      previous,
      diff: parseFloat(diff.toFixed(1)),
      isDown: diff < 0,
      isUp: diff > 0,
    };
  };
  const trend = getWeightTrend();

  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* Greeting Bar */}
      <div className="glass-card rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="avatar placeholder flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-secondary text-primary-content font-black text-xl flex items-center justify-center shadow-md">
              {userInitial}
            </div>
          </div>
          <div>
            <h1 className="text-xl font-extrabold flex items-center gap-1.5 text-base-content/90">
              {getGreeting()}, {data.user?.name || user?.name || 'bạn'}! 👋
            </h1>
            <p className="text-sm text-base-content/60 font-medium mt-0.5">
              Hôm nay bạn đã nạp <span className="text-primary font-bold">{caloriePercent}%</span> mục tiêu calo.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto border-t md:border-t-0 border-base-200/50 pt-3 md:pt-0">
          <button
            onClick={() => handleDownloadReport('week')}
            disabled={downloadReport.isPending}
            className="btn btn-outline btn-sm rounded-full gap-1.5 hover:scale-105 active:scale-95 transition-all"
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

      {/* Macro Summary Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MacroSummaryCard
          icon="🥩"
          label="Protein"
          value={consumed.protein}
          unit="g"
          target={metrics?.macros?.protein || 0}
          colorScheme="blue"
        />
        <MacroSummaryCard
          icon="🍚"
          label="Carbs"
          value={consumed.carbs}
          unit="g"
          target={metrics?.macros?.carbs || 0}
          colorScheme="amber"
        />
        <MacroSummaryCard
          icon="🥑"
          label="Chất béo"
          value={consumed.fat}
          unit="g"
          target={metrics?.macros?.fat || 0}
          colorScheme="pink"
        />
        <MacroSummaryCard
          icon="🔥"
          label="Calo đốt"
          value={totalBurned}
          unit="kcal"
          target={0}
          colorScheme="emerald"
        />
      </div>

      {/* Layout 2 vùng Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          
          {/* CalorieRing Hero Card */}
          <AnimatedSection delay={0} className="flex flex-col">
            <div className="glass-card rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-around gap-6">
              <div className="flex-shrink-0">
                <CalorieRing consumed={consumed.calories} target={targetCalories} noCard={true} />
              </div>
              
              <div className="hidden md:block w-px h-36 bg-base-content/10" />

              <div className="flex-grow w-full max-w-xs flex flex-col gap-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-base-content/50 mb-1">Chỉ số dinh dưỡng nạp vào</h3>
                
                {/* Protein Progress */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-1.5 font-medium text-base-content/80">
                      <span>🥩</span> Protein
                    </span>
                    <span className="font-semibold text-info">{consumed.protein}g <span className="text-xs font-normal text-base-content/40">/ {metrics?.macros?.protein || 0}g</span></span>
                  </div>
                  <div className="pill-progress h-2 bg-base-300">
                    <div
                      className="h-full rounded-full bg-info transition-all duration-500"
                      style={{ width: `${Math.min(macroProgress?.protein?.percent || 0, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Carbs Progress */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-1.5 font-medium text-base-content/80">
                      <span>🍚</span> Carbs
                    </span>
                    <span className="font-semibold text-warning">{consumed.carbs}g <span className="text-xs font-normal text-base-content/40">/ {metrics?.macros?.carbs || 0}g</span></span>
                  </div>
                  <div className="pill-progress h-2 bg-base-300">
                    <div
                      className="h-full rounded-full bg-warning transition-all duration-500"
                      style={{ width: `${Math.min(macroProgress?.carbs?.percent || 0, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Fat Progress */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-1.5 font-medium text-base-content/80">
                      <span>🥑</span> Chất béo
                    </span>
                    <span className="font-semibold text-secondary">{consumed.fat}g <span className="text-xs font-normal text-base-content/40">/ {metrics?.macros?.fat || 0}g</span></span>
                  </div>
                  <div className="pill-progress h-2 bg-base-300">
                    <div
                      className="h-full rounded-full bg-secondary transition-all duration-500"
                      style={{ width: `${Math.min(macroProgress?.fat?.percent || 0, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Charts Row: Macros & Adaptive TDEE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatedSection delay={0.05} className="flex flex-col">
              <MacrosChart consumed={consumed} target={metrics?.macros} />
            </AnimatedSection>

            <AnimatedSection delay={0.1} className="flex flex-col">
              <div className="glass-card rounded-3xl flex flex-col justify-between h-full">
                <div className="card-body p-6 flex flex-col justify-between h-full gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-widest text-base-content/50 flex items-center gap-1">
                        🎯 TDEE Thích ứng
                      </span>
                      <span className="badge badge-primary badge-xs font-bold px-1.5 py-0.5">EMA</span>
                    </div>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-3xl font-black text-primary">
                        {adaptiveLoading ? (
                          <span className="loading loading-dots loading-sm" />
                        ) : (
                          adaptiveStatus?.useAdaptiveTDEE 
                            ? (adaptiveStatus.adaptiveTDEE ? Math.round(adaptiveStatus.adaptiveTDEE) : '--')
                            : (adaptiveStatus.staticTDEE ? Math.round(adaptiveStatus.staticTDEE) : '--')
                        )}
                      </span>
                      <span className="text-xs text-base-content/60 font-semibold">kcal/ngày</span>
                    </div>
                    <p className="text-[10px] text-base-content/50 mt-3 leading-relaxed">
                      {adaptiveStatus?.useAdaptiveTDEE 
                        ? `Đang áp dụng thích ứng (Tĩnh: ${adaptiveStatus?.staticTDEE ? Math.round(adaptiveStatus.staticTDEE) : '--'} kcal)` 
                        : 'Đang áp dụng TDEE tĩnh (chưa bật thích ứng)'}
                    </p>
                  </div>
                  <div className="border-t border-base-200/50 pt-3 flex justify-between items-center">
                    <span className="text-xs text-base-content/60 font-semibold">Mục tiêu: {targetCalories} kcal</span>
                    <button 
                      onClick={() => navigate('/weight')}
                      className="btn btn-ghost btn-xs text-primary gap-0.5 px-1.5 hover:bg-primary/10 rounded-full font-bold"
                    >
                      Chi tiết <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>

          {/* Weight Chart với xu hướng */}
          <AnimatedSection delay={0.15}>
            <div className="relative">
              {trend && (
                <div className="absolute top-5 right-6 z-10 hidden sm:flex items-center gap-2">
                  <span className="text-[10px] uppercase font-semibold text-base-content/40 tracking-wider">Xu hướng:</span>
                  <span className="text-xs font-bold text-base-content">{trend.latest} kg</span>
                  {trend.diff !== 0 && (
                    <span className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${trend.isDown ? 'bg-success/15 text-success' : 'bg-error/15 text-error'}`}>
                      {trend.isDown ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                      {Math.abs(trend.diff)} kg
                    </span>
                  )}
                </div>
              )}
              <WeightChart chartData={weightChartData} />
            </div>
          </AnimatedSection>

        </div>

        {/* Right Sidebar (1/3) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <AnimatedSection delay={0.2} className="flex flex-col">
            <WaterProgress total={waterTotal} goal={waterGoal} date={date} />
          </AnimatedSection>

          <AnimatedSection delay={0.25} className="flex flex-col">
            <RecentMeals entries={allDiaryEntries} onAddClick={() => handleOpenAddFood('sang')} />
          </AnimatedSection>

          <AnimatedSection delay={0.3} className="flex flex-col">
            <RecentActivity logs={exerciseLogs} totalBurned={totalBurned} />
          </AnimatedSection>
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
      {/* Header skeleton */}
      <div className="h-20 bg-base-300 rounded-3xl w-full animate-pulse" />
      
      {/* Macro Cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 rounded-2xl bg-gradient-to-r from-base-300 via-base-200 to-base-300 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
        ))}
      </div>
      
      {/* 2-column layout skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="h-60 rounded-3xl bg-gradient-to-r from-base-300 via-base-200 to-base-300 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 rounded-3xl bg-gradient-to-r from-base-300 via-base-200 to-base-300 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
            <div className="h-64 rounded-3xl bg-gradient-to-r from-base-300 via-base-200 to-base-300 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
          </div>
          <div className="h-60 rounded-3xl bg-gradient-to-r from-base-300 via-base-200 to-base-300 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="h-52 rounded-3xl bg-gradient-to-r from-base-300 via-base-200 to-base-300 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
          <div className="h-80 rounded-3xl bg-gradient-to-r from-base-300 via-base-200 to-base-300 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
          <div className="h-80 rounded-3xl bg-gradient-to-r from-base-300 via-base-200 to-base-300 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}
