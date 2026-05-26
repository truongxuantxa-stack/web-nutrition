import { Plus } from 'lucide-react';
import DiaryEntryRow from './DiaryEntryRow';

const MEAL_META = {
  sang: { label: 'Bữa sáng', icon: '🌅', accent: 'border-l-emerald-400', headerBg: 'bg-emerald-50/50 dark:bg-emerald-950/20' },
  trua: { label: 'Bữa trưa', icon: '☀️',  accent: 'border-l-amber-400',   headerBg: 'bg-amber-50/50 dark:bg-amber-950/20'   },
  toi : { label: 'Bữa tối',  icon: '🌙', accent: 'border-l-blue-400',    headerBg: 'bg-blue-50/50 dark:bg-blue-950/20'     },
  phu : { label: 'Bữa phụ',  icon: '🍎', accent: 'border-l-pink-400',    headerBg: 'bg-pink-50/50 dark:bg-pink-950/20'     },
};

export default function MealGroup({ mealKey, entries = [], totalCalories, onAddFood, onDeleteEntry }) {
  const meta = MEAL_META[mealKey] || { label: mealKey, icon: '🍽️', accent: 'border-l-base-content/10', headerBg: 'bg-base-200/10' };

  return (
    <div className={`glass-card meal-card-${mealKey} hover:-translate-y-0.5 transition-transform duration-200 flex flex-col justify-between h-full overflow-hidden border-l-[3px] ${meta.accent}`}>
      {/* Header */}
      <div>
        <div className={`flex items-center justify-between p-4 ${meta.headerBg}`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{meta.icon}</span>
            <span className="font-bold text-sm text-base-content/90">{meta.label}</span>
            <span className="badge badge-ghost badge-sm text-[10px] px-1.5 py-0.5 h-auto">{entries.length} món</span>
          </div>
          <span className="text-sm font-extrabold text-primary">{totalCalories} kcal</span>
        </div>

        {/* Body */}
        <div className="min-h-[80px] flex flex-col justify-center">
          {entries.length === 0 ? (
            <p className="text-center py-4 text-base-content/30 text-[11px] italic">🍃 Chưa có món ăn nào</p>
          ) : (
            <ul className="divide-y divide-base-200/15 flex-1">
              {entries.map(entry => (
                <DiaryEntryRow
                  key={entry.id}
                  entry={entry}
                  onDelete={() => onDeleteEntry(entry.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Footer & Action */}
      <div className="p-3 bg-base-200/15 pt-2">
        <button
          id={`add-food-${mealKey}`}
          onClick={() => onAddFood(mealKey)}
          className="btn btn-ghost btn-xs w-full gap-1.5 text-primary/70 bg-primary/5 hover:bg-primary/10 hover:text-primary border-none py-1.5 h-auto font-medium transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Thêm món vào {meta.label.toLowerCase()}
        </button>
      </div>
    </div>
  );
}
