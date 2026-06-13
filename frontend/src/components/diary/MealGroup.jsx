import { Plus } from 'lucide-react';
import DiaryEntryRow from './DiaryEntryRow';

const MEAL_META = {
  sang: { label: 'Bữa sáng', icon: '🌅' },
  trua: { label: 'Bữa trưa', icon: '☀️' },
  toi : { label: 'Bữa tối',  icon: '🌙' },
  phu : { label: 'Bữa phụ',  icon: '🍎' },
};

export default function MealGroup({ mealKey, entries = [], totalCalories, onAddFood, onDeleteEntry }) {
  const meta = MEAL_META[mealKey] || { label: mealKey, icon: '🍽️' };

  return (
    <div className="tcl-card bg-white border border-[#DFE3E4] rounded-2xl p-6 shadow-sm flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#DFE3E4]">
        <div className="flex items-center gap-2">
          <span className="text-lg">{meta.icon}</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#96A5A8]">{meta.label}</span>
          <span className="bg-[#F0F2F3] text-[#244348] text-[10px] font-bold px-2 py-0.5 rounded-full">{entries.length} món</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-extrabold text-[#003139]">{totalCalories}</span>
          <span className="text-xs font-bold text-[#96A5A8]">kcal</span>
        </div>
      </div>

      {/* Body */}
      <div className="min-h-[80px] flex flex-col justify-center -mx-4 sm:-mx-2">
        {entries.length === 0 ? (
          <p className="text-center py-6 text-[#96A5A8] text-xs">🍃 Chưa có món ăn nào</p>
        ) : (
          <ul className="divide-y divide-[#F0F2F3] flex-1">
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

      {/* Footer & Action */}
      <div className="pt-2">
        <button
          id={`add-food-${mealKey}`}
          onClick={() => onAddFood(mealKey)}
          className="tcl-btn-ghost w-full justify-center text-sm gap-2"
        >
          <Plus className="w-4 h-4" />
          Thêm món vào {meta.label.toLowerCase()}
        </button>
      </div>
    </div>
  );
}
