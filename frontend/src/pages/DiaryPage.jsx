import { useState } from 'react';
import { useDiaryData, useDeleteEntry } from '../hooks/useDiary';
import { getToday } from '../lib/dayjs';
import WeeklyCalendarStrip from '../components/diary/WeeklyCalendarStrip';
import MealGroup           from '../components/diary/MealGroup';
import DailyInsightsCard   from '../components/common/DailyInsightsCard';
import WaterTracker        from '../components/diary/WaterTracker';
import AddFoodModal        from '../components/diary/AddFoodModal';
import DaySummaryWidget    from '../components/diary/DaySummaryWidget';

const MEAL_KEYS = ['sang', 'trua', 'toi', 'phu'];

export default function DiaryPage() {
  const [date, setDate]             = useState(getToday);
  const [modalOpen, setModalOpen]   = useState(false);
  const [activeMeal, setActiveMeal] = useState('sang');

  const { data, isLoading, error } = useDiaryData(date);
  const deleteEntry = useDeleteEntry(date);

  if (isLoading) return <DiarySkeleton />;
  if (error) return (
    <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
      Không thể tải nhật ký.
    </div>
  );

  const { consumed, metrics, healthInsights, healthScore, mealGroups = {}, mealCalories = {}, waterTotal, waterGoal, waterLogs = [] } = data;

  const openAddFood = (meal) => {
    setActiveMeal(meal);
    setModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#003139]">Nhật ký ăn uống</h1>
          <p className="text-xs text-[#96A5A8] mt-0.5">Theo dõi chi tiết dinh dưỡng và bữa ăn trong ngày</p>
        </div>
      </div>

      {/* Weekly Calendar */}
      <WeeklyCalendarStrip date={date} onDateChange={setDate} />

      {/* Day Summary */}
      <DaySummaryWidget
        consumed={consumed.calories}
        target={metrics?.targetCalories || 0}
        consumedMacros={consumed}
        targetMacros={metrics?.macros || {}}
      />

      {/* Water Tracker */}
      <WaterTracker total={waterTotal} goal={waterGoal} logs={waterLogs} date={date} />

      {/* Meal Groups 2x2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MEAL_KEYS.map(mealKey => (
          <MealGroup
            key={mealKey}
            mealKey={mealKey}
            entries={mealGroups[mealKey] || []}
            totalCalories={mealCalories[mealKey] || 0}
            onAddFood={openAddFood}
            onDeleteEntry={(id) => deleteEntry.mutate(id)}
          />
        ))}
      </div>

      {/* Daily Insights */}
      <DailyInsightsCard insights={healthInsights || []} healthScore={healthScore} />

      {/* Modal */}
      <AddFoodModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        date={date}
        defaultMeal={activeMeal}
      />
    </div>
  );
}

function DiarySkeleton() {
  const shimmer = 'rounded-2xl bg-gradient-to-r from-[#DFE3E4] via-[#F0F2F3] to-[#DFE3E4] bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]';
  return (
    <div className="flex flex-col gap-5">
      <div className="h-10 bg-[#DFE3E4] rounded w-64 animate-pulse" />
      <div className={`h-48 ${shimmer}`} />
      <div className={`h-16 ${shimmer}`} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`h-48 ${shimmer}`} />
        ))}
      </div>
    </div>
  );
}
