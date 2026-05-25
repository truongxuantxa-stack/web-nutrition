import { useState } from 'react';
import { useDiaryData, useDeleteEntry } from '../hooks/useDiary';
import { getToday } from '../lib/dayjs';
import DateNavigator  from '../components/common/DateNavigator';
import MealGroup      from '../components/diary/MealGroup';
import HealthInsights from '../components/diary/HealthInsights';
import WaterTracker   from '../components/diary/WaterTracker';
import AddFoodModal   from '../components/diary/AddFoodModal';

const MEAL_KEYS = ['sang', 'trua', 'toi', 'phu'];

export default function DiaryPage() {
  const [date, setDate]             = useState(getToday);
  const [modalOpen, setModalOpen]   = useState(false);
  const [activeMeal, setActiveMeal] = useState('sang');

  const { data, isLoading, error } = useDiaryData(date);
  const deleteEntry = useDeleteEntry(date);

  if (isLoading) return <DiarySkeleton />;
  if (error) return <div className="alert alert-error">Không thể tải nhật ký.</div>;

  const { consumed, metrics, calorieProgress, healthInsights, mealGroups = {}, mealCalories = {}, waterTotal, waterGoal, waterLogs = [] } = data;

  const openAddFood = (meal) => {
    setActiveMeal(meal);
    setModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold">Nhật ký ăn uống</h1>
        <DateNavigator date={date} onDateChange={setDate} />
      </div>

      {/* Tổng hợp calo ngày (compact) */}
      <div className="card bg-primary/5 border border-primary/20">
        <div className="card-body p-4 flex-row items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-2xl font-bold text-primary">{consumed.calories}</span>
            <span className="text-base-content/50 text-sm ml-1">/ {metrics?.targetCalories || 0} kcal</span>
          </div>
          <div className="flex gap-4 text-sm">
            <span><strong className="text-blue-500">{consumed.protein}g</strong> <span className="text-base-content/50">Protein</span></span>
            <span><strong className="text-amber-500">{consumed.carbs}g</strong> <span className="text-base-content/50">Carbs</span></span>
            <span><strong className="text-pink-500">{consumed.fat}g</strong> <span className="text-base-content/50">Fat</span></span>
          </div>
          <div className="w-full">
            <progress
              className="progress progress-primary h-2"
              value={Math.min(calorieProgress?.percent || 0, 100)}
              max="100"
            />
          </div>
        </div>
      </div>

      {/* 4 nhóm bữa ăn */}
      <div className="flex flex-col gap-3">
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

      {/* Health Insights */}
      <HealthInsights insights={healthInsights} />

      {/* Water Tracker */}
      <WaterTracker
        total={waterTotal}
        goal={waterGoal}
        logs={waterLogs}
        date={date}
      />

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
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      <div className="h-10 bg-base-300 rounded w-64" />
      <div className="h-20 bg-base-300 rounded-2xl" />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-32 bg-base-300 rounded-2xl" />
      ))}
    </div>
  );
}
