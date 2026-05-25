const MEAL_META = {
  sang: { label: 'Bữa sáng', icon: '🌅', color: 'badge-warning' },
  trua: { label: 'Bữa trưa', icon: '☀️',  color: 'badge-info' },
  toi : { label: 'Bữa tối',  icon: '🌙', color: 'badge-secondary' },
  phu : { label: 'Bữa phụ',  icon: '🍎', color: 'badge-success' },
};

export default function MealSelector({ mealsConfig = [], selectedMeal, onSelect }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {mealsConfig.map(meal => {
        const meta      = MEAL_META[meal.key] || { label: meal.label, icon: '🍽️', color: 'badge-ghost' };
        const isActive  = selectedMeal === meal.key;
        return (
          <button
            key={meal.key}
            id={`meal-select-${meal.key}`}
            onClick={() => onSelect(meal.key)}
            className={`card border-2 transition-all cursor-pointer text-left p-4 gap-1
              ${isActive
                ? 'border-primary bg-primary/5 shadow-md'
                : 'border-base-300 bg-base-100 hover:border-primary/40'
              }`}
          >
            <span className="text-2xl">{meta.icon}</span>
            <p className="font-semibold text-sm">{meta.label}</p>
            <span className={`badge badge-sm ${meta.color}`}>{meal.percent}%</span>
          </button>
        );
      })}
    </div>
  );
}
