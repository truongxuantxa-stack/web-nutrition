import { Plus } from 'lucide-react';
import DiaryEntryRow from './DiaryEntryRow';

const MEAL_META = {
  sang: { label: 'Bữa sáng', icon: '🌅', accent: 'border-l-emerald-400', headerBg: 'bg-emerald-50' },
  trua: { label: 'Bữa trưa', icon: '☀️',  accent: 'border-l-amber-400',   headerBg: 'bg-amber-50'   },
  toi : { label: 'Bữa tối',  icon: '🌙',  accent: 'border-l-blue-400',    headerBg: 'bg-blue-50'    },
  phu : { label: 'Bữa phụ',  icon: '🍎',  accent: 'border-l-pink-400',    headerBg: 'bg-pink-50'    },
};

export default function MealGroup({ mealKey, entries = [], totalCalories, onAddFood, onDeleteEntry }) {
  const meta = MEAL_META[mealKey] || { label: mealKey, icon: '🍽️', accent: 'border-l-[#DFE3E4]', headerBg: 'bg-[#F0F2F3]' };

  return (
    <div className={`tcl-card hover:-translate-y-0.5 transition-transform duration-200 flex flex-col justify-between h-full overflow-hidden border-l-[3px] !p-0 ${meta.accent}`}>
      {/* Header */}
      <div>
        <div className={`flex items-center justify-between px-4 py-3.5 ${meta.headerBg}`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{meta.icon}</span>
            <span className="font-bold text-sm text-[#003139]">{meta.label}</span>
            <span className="tcl-badge text-[10px] px-1.5 py-0.5">{entries.length} món</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="text-sm font-extrabold text-[#003139]">{totalCalories} kcal</span>
            <div className="w-6 h-6 shrink-0" />
          </div>
        </div>

        {/* Body */}
        <div className="min-h-[80px] flex flex-col justify-center">
          {entries.length === 0 ? (
            <p className="text-center py-4 text-[#96A5A8] text-[11px] italic">🍃 Chưa có món ăn nào</p>
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
      </div>

      {/* Footer & Action */}
      <div className="px-4 py-3 bg-[#F0F2F3]/50 border-t border-[#DFE3E4]">
        <button
          id={`add-food-${mealKey}`}
          onClick={() => onAddFood(mealKey)}
          className="tcl-btn-ghost w-full gap-1.5 text-[#003139]/70 bg-[#003139]/5 hover:bg-[#003139]/10 hover:text-[#003139] border-none py-1.5 h-auto font-medium transition-colors text-xs rounded-lg justify-center"
        >
          <Plus className="w-3.5 h-3.5" />
          Thêm món vào {meta.label.toLowerCase()}
        </button>
      </div>
    </div>
  );
}
