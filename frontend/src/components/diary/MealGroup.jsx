import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import DiaryEntryRow from './DiaryEntryRow';

const MEAL_META = {
  sang: { label: 'Bữa sáng', icon: '🌅' },
  trua: { label: 'Bữa trưa', icon: '☀️'  },
  toi : { label: 'Bữa tối',  icon: '🌙' },
  phu : { label: 'Bữa phụ',  icon: '🍎' },
};

export default function MealGroup({ mealKey, entries = [], totalCalories, onAddFood, onDeleteEntry }) {
  const [open, setOpen] = useState(true);
  const meta = MEAL_META[mealKey] || { label: mealKey, icon: '🍽️' };

  return (
    <div className="card bg-base-100 border border-base-300">
      {/* Header */}
      <button
        className="flex items-center justify-between p-4 w-full text-left hover:bg-base-200/50 transition-colors rounded-t-2xl"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{meta.icon}</span>
          <span className="font-semibold text-sm">{meta.label}</span>
          <span className="badge badge-ghost badge-sm">{entries.length} món</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-primary">{totalCalories} kcal</span>
          {open ? <ChevronUp className="w-4 h-4 text-base-content/40" /> : <ChevronDown className="w-4 h-4 text-base-content/40" />}
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="border-t border-base-300">
          {entries.length === 0 ? (
            <p className="text-center py-6 text-base-content/30 text-sm">Chưa có món nào</p>
          ) : (
            <ul className="divide-y divide-base-200">
              {entries.map(entry => (
                <DiaryEntryRow
                  key={entry.id}
                  entry={entry}
                  onDelete={() => onDeleteEntry(entry.id)}
                />
              ))}
            </ul>
          )}

          {/* Nút thêm món */}
          <div className="p-3">
            <button
              id={`add-food-${mealKey}`}
              onClick={() => onAddFood(mealKey)}
              className="btn btn-ghost btn-sm w-full gap-2 text-primary border-dashed border border-primary/30 hover:bg-primary/5"
            >
              <Plus className="w-4 h-4" />
              Thêm món vào {meta.label}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
