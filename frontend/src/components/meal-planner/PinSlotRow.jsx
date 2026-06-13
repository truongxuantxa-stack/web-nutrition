import { useState } from 'react';
import { useFoodsByRole } from '../../hooks/useMealPlanner';
import { Pin } from 'lucide-react';
import ImageLightbox from '../common/ImageLightbox';
import SafeImage from '../common/SafeImage';

const ROLE_META = {
  carb: { label: 'Tinh bột / Carb', icon: '🍚', color: 'text-orange-500 bg-orange-500/10' },
  protein: { label: 'Chất đạm / Protein', icon: '🥩', color: 'text-red-500 bg-red-500/10' },
  fat: { label: 'Chất béo / Fat', icon: '🥑', color: 'text-yellow-600 bg-yellow-500/10' },
  fiber: { label: 'Chất xơ / Fiber', icon: '🥦', color: 'text-green-500 bg-green-500/10' }
};

export default function PinSlotRow({ slot, pinnedFoodId, onPinChange }) {
  const { role, allowedTags = [] } = slot;
  const meta = ROLE_META[role] || { label: role, icon: '🍽️', color: 'text-base-content/60 bg-base-content/10' };
  
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const { data: foods = [], isLoading } = useFoodsByRole(role, allowedTags);

  const pinnedFood = foods.find(f => f.id === pinnedFoodId);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 tcl-card transition-all">
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-semibold ${meta.color}`}>
          <span className="text-base">{meta.icon}</span>
        </div>
        <span className="font-bold text-sm text-base-content/80 capitalize">{meta.label}</span>
      </div>
      
      <div className="flex gap-2 items-center flex-1 sm:max-w-md justify-end w-full">
        <select
          id={`pin-select-${role}`}
          value={pinnedFoodId || ''}
          onChange={(e) => onPinChange(role, e.target.value ? Number(e.target.value) : null)}
          className="select select-bordered select-sm flex-1 text-sm bg-base-50 text-base-content focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow max-w-[240px]"
          disabled={isLoading}
        >
          <option value="">-- Ngẫu nhiên --</option>
          {foods.map(f => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        
        {pinnedFoodId ? (
          <div className="flex items-center gap-1.5 shrink-0">
            <SafeImage
              src={pinnedFood?.imageUrl}
              alt={pinnedFood?.name}
              className="w-8 h-8 rounded-lg object-cover bg-base-300 border border-base-content/10 shadow-sm cursor-zoom-in hover:scale-110 active:scale-95 transition-transform"
              onClick={() => setIsLightboxOpen(true)}
              fallback={
                <div className="w-8 h-8 rounded-lg bg-base-200 flex items-center justify-center text-sm border border-base-content/5 select-none shrink-0">
                  {meta.icon}
                </div>
              }
            />
            <div className="badge badge-warning badge-sm gap-1 py-2 font-semibold select-none">
              <Pin className="w-3 h-3 fill-amber-800" />
              Ghim
            </div>
          </div>
        ) : null}
      </div>

      <ImageLightbox
        src={pinnedFood?.imageUrl}
        alt={pinnedFood?.name}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />
    </div>
  );
}
