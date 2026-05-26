import { useState } from 'react';
import { useDiaryData, useDeleteEntry } from '../hooks/useDiary';
import { getToday } from '../lib/dayjs';
import WeeklyCalendarStrip from '../components/diary/WeeklyCalendarStrip';
import MealGroup      from '../components/diary/MealGroup';
import HealthInsights from '../components/diary/HealthInsights';
import WaterTracker   from '../components/diary/WaterTracker';
import AddFoodModal   from '../components/diary/AddFoodModal';
import AnimatedSection from '../components/common/AnimatedSection';
import DaySummaryWidget from '../components/diary/DaySummaryWidget';

const MEAL_KEYS = ['sang', 'trua', 'toi', 'phu'];

export default function DiaryPage() {
  const [date, setDate]             = useState(getToday);
  const [modalOpen, setModalOpen]   = useState(false);
  const [activeMeal, setActiveMeal] = useState('sang');

  const { data, isLoading, error } = useDiaryData(date);
  const deleteEntry = useDeleteEntry(date);

  if (isLoading) return <DiarySkeleton />;
  if (error) return <div className="alert alert-error">Không thể tải nhật ký.</div>;

  const { consumed, metrics, healthInsights, mealGroups = {}, mealCalories = {}, waterTotal, waterGoal, waterLogs = [] } = data;

  const openAddFood = (meal) => {
    setActiveMeal(meal);
    setModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Nhật ký ăn uống</h1>
          <p className="text-xs text-base-content/50 mt-0.5">Theo dõi chi tiết dinh dưỡng và bữa ăn trong ngày</p>
        </div>
      </div>

      {/* ── WEEKLY CALENDAR STRIP (full width) ── */}
      <AnimatedSection delay={0.02}>
        <WeeklyCalendarStrip date={date} onDateChange={setDate} />
      </AnimatedSection>

      {/* ── HERO SUMMARY CARD (full width) ── */}
      <AnimatedSection delay={0.05}>
        <DaySummaryWidget
          consumed={consumed.calories}
          target={metrics?.targetCalories || 0}
          consumedMacros={consumed}
          targetMacros={metrics?.macros || {}}
        />
      </AnimatedSection>

      {/* ── WATER TRACKER — horizontal bar (full width) ── */}
      <AnimatedSection delay={0.1}>
        <WaterTracker
          total={waterTotal}
          goal={waterGoal}
          logs={waterLogs}
          date={date}
        />
      </AnimatedSection>

      {/* ── MEAL GROUPS — 2x2 grid (full width) ── */}
      <AnimatedSection delay={0.15}>
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
      </AnimatedSection>

      {/* ── HEALTH INSIGHTS (full width, chỉ hiện khi có dữ liệu) ── */}
      {healthInsights?.length > 0 && (
        <AnimatedSection delay={0.2}>
          <HealthInsights insights={healthInsights} />
        </AnimatedSection>
      )}

      {/* Modal thêm món */}
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
  const shimmer = 'rounded-2xl bg-gradient-to-r from-base-300 via-base-200 to-base-300 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]';
  return (
    <div className="flex flex-col gap-5">
      <div className="h-10 bg-base-300 rounded w-64 animate-pulse" />
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
