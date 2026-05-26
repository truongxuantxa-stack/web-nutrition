import { Utensils } from 'lucide-react';

const MEALS = [
  { key: 'sang', label: 'Bữa sáng', icon: '🌅', color: 'bg-emerald-400' },
  { key: 'trua', label: 'Bữa trưa', icon: '☀️', color: 'bg-amber-400' },
  { key: 'toi',  label: 'Bữa tối',  icon: '🌙', color: 'bg-blue-400' },
  { key: 'phu',  label: 'Bữa phụ',  icon: '🍎', color: 'bg-pink-400' },
];

export default function MealCalorieBreakdown({ mealCalories = {} }) {
  // Lấy các giá trị calo nạp của từng bữa ăn (mặc định là 0 nếu thiếu)
  const calories = {
    sang: mealCalories.sang || 0,
    trua: mealCalories.trua || 0,
    toi:  mealCalories.toi || 0,
    phu:  mealCalories.phu || 0,
  };

  const totalCalories = Object.values(calories).reduce((sum, val) => sum + val, 0);

  return (
    <div className="glass-card">
      <div className="card-body p-5">
        <div className="flex items-center gap-2 mb-4">
          <Utensils className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/50">Phân bổ theo bữa</h3>
        </div>

        <div className="flex flex-col gap-3.5">
          {MEALS.map(({ key, label, icon, color }) => {
            const cal = calories[key];
            const percent = totalCalories > 0 ? Math.round((cal / totalCalories) * 100) : 0;

            return (
              <div key={key} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-1.5 text-base-content/85">
                    <span>{icon}</span>
                    <span>{label}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-base-content/95">{cal} kcal</span>
                    <span className="text-[10px] text-base-content/40">({percent}%)</span>
                  </div>
                </div>
                
                <div className="h-1.5 w-full bg-base-content/5 rounded-full overflow-hidden">
                  <div
                    className={`${color} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
