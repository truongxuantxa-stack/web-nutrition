import { useState } from 'react';
import { useDashboard } from '../hooks/useDashboard';
import { getToday } from '../lib/dayjs';
import DateNavigator from '../components/common/DateNavigator';
import StatCard      from '../components/common/StatCard';
import CalorieRing  from '../components/dashboard/CalorieRing';
import MacrosChart  from '../components/dashboard/MacrosChart';
import WeightChart  from '../components/dashboard/WeightChart';
import WaterProgress from '../components/dashboard/WaterProgress';

export default function DashboardPage() {
  const [date, setDate] = useState(getToday);
  const { data, isLoading, error } = useDashboard(date);

  if (isLoading) return <DashboardSkeleton />;
  if (error)     return <div className="alert alert-error">Không thể tải dữ liệu dashboard.</div>;

  const { metrics, consumed, totalBurned, macroProgress, weightChartData, waterTotal, waterGoal } = data;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Tổng quan</h1>
          <p className="text-base-content/50 text-sm">Chào mừng trở lại, {data.user?.name}!</p>
        </div>
        <DateNavigator date={date} onDateChange={setDate} />
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

      {/* Row 2: Macros Doughnut + Water + Exercise */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
