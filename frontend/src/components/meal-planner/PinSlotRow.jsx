import { useFoodsByRole } from '../../hooks/useMealPlanner';
import { Pin } from 'lucide-react';

const ROLE_META = {
  carb: { label: 'Tinh bột / Carb', icon: '🍚', color: 'text-orange-500 bg-orange-500/10' },
  protein: { label: 'Chất đạm / Protein', icon: '🥩', color: 'text-red-500 bg-red-500/10' },
  fat: { label: 'Chất béo / Fat', icon: '🥑', color: 'text-yellow-600 bg-yellow-500/10' },
  fiber: { label: 'Chất xơ / Fiber', icon: '🥦', color: 'text-green-500 bg-green-500/10' }
};

export default function PinSlotRow({ slot, pinnedFoodId, onPinChange }) {
  const { role, allowedTags = [] } = slot;
  const meta = ROLE_META[role] || { label: role, icon: '🍽️', color: 'text-base-content/60 bg-base-content/10' };
  
  const { data: foods = [], isLoading } = useFoodsByRole(role, allowedTags);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 glass-card hover:border-primary/30 transition-all">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-semibold ${meta.color}`}>
          <span className="text-base">{meta.icon}</span>
        </div>
        <span className="font-bold text-sm text-base-content/80 capitalize">{meta.label}</span>
      </div>
      
      <div className="flex gap-2 items-center flex-1 sm:max-w-xs justify-end w-full">
        <select
          id={`pin-select-${role}`}
          value={pinnedFoodId || ''}
          onChange={(e) => onPinChange(role, e.target.value ? Number(e.target.value) : null)}
          className="select select-bordered select-sm flex-1 text-sm bg-base-50 text-base-content focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow"
          disabled={isLoading}
        >
          <option value="">-- Ngẫu nhiên --</option>
          {foods.map(f => (
            <option key={f.id} value={f.id}>
              {f.name} (P:{f.protein}g | C:{f.carbs}g | F:{f.fat}g)
            </option>
          ))}
        </select>
        
        {pinnedFoodId ? (
          <div className="badge badge-warning badge-sm gap-1 py-2 font-semibold">
            <Pin className="w-3 h-3 fill-amber-800" />
            Ghim
          </div>
        ) : null}
      </div>
    </div>
  );
}
