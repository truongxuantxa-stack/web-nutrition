import { useState } from 'react';
import { useFoodsByRole } from '../../hooks/useMealPlanner';
import { X, Search } from 'lucide-react';
import ImageLightbox from '../common/ImageLightbox';
import SafeImage from '../common/SafeImage';


export default function IngredientSwapModal({ isOpen, onClose, swapTarget, allowedTags = [], onConfirmSwap }) {
  const [searchQ, setSearchQ] = useState('');
  const [activeLightboxImg, setActiveLightboxImg] = useState(null);
  const [activeLightboxTitle, setActiveLightboxTitle] = useState('');

  const role = swapTarget?.food?.category || swapTarget?.role || '';

  const { data: foods = [], isLoading } = useFoodsByRole(role, allowedTags);

  const filtered = searchQ
    ? foods.filter(f => f.name.toLowerCase().includes(searchQ.toLowerCase()))
    : foods;

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Đổi nguyên liệu</h3>
          <button
            id="swap-modal-close"
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-square"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {swapTarget && (
          <p className="text-sm text-base-content/60 mb-3">
            Đang thay thế: <strong>{swapTarget.food?.name || swapTarget.foodName}</strong>
            {role && <span className="badge badge-ghost badge-sm ml-2 capitalize">{role}</span>}
          </p>
        )}

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
          <input
            id="swap-search"
            type="text"
            className="input input-bordered input-sm w-full pl-9"
            placeholder="Tìm nguyên liệu..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        ) : (
          <div className="max-h-72 overflow-y-auto flex flex-col gap-1">
            {filtered.map(food => (
              <button
                key={food.id}
                id={`swap-food-${food.id}`}
                onClick={() => { onConfirmSwap(food); onClose(); }}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-base-200 text-left transition-colors"
              >
                <SafeImage
                  src={food.imageUrl}
                  alt={food.name}
                  className="w-8 h-8 rounded-lg object-cover bg-base-300 shrink-0 border border-base-content/10 cursor-zoom-in hover:scale-110 active:scale-95 transition-transform"
                  onClick={(e) => {
                    e.stopPropagation(); // Ngăn chọn món khi chỉ muốn phóng to ảnh
                    setActiveLightboxImg(food.imageUrl);
                    setActiveLightboxTitle(food.name);
                  }}
                  fallback={
                    <div className="w-8 h-8 rounded-lg bg-base-200 flex items-center justify-center text-sm shrink-0 select-none border border-base-content/5">
                      {role === 'protein' ? '🥩' : role === 'carb' ? '🍚' : role === 'fat' ? '🥑' : role === 'fiber' ? '🥗' : '🥦'}
                    </div>
                  }
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{food.name}</p>
                  <p className="text-xs text-base-content/50">
                    {food.calories} kcal · P:{food.protein}g C:{food.carbs}g F:{food.fat}g
                    {food.fiber > 0 && <> · Xơ:{food.fiber}g</>}
                  </p>
                  {(food.vitaminA > 0 || food.vitaminC > 0 || food.calcium > 0 || food.iron > 0) && (
                    <p className="text-[10px] text-base-content/40 flex flex-wrap gap-x-2">
                      {food.vitaminA > 0 && <span>🥕 Vitamin A: {Math.round(food.vitaminA)}µg</span>}
                      {food.vitaminC > 0 && <span>🍊 Vitamin C: {Math.round(food.vitaminC * 10) / 10}mg</span>}
                      {food.calcium  > 0 && <span>🦴 Canxi: {Math.round(food.calcium)}mg</span>}
                      {food.iron     > 0 && <span>🩸 Sắt: {Math.round(food.iron * 10) / 10}mg</span>}
                    </p>
                  )}
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="text-center text-base-content/40 text-sm py-4">Không có nguyên liệu phù hợp</p>
            )}
          </div>
        )}
      </div>
      <div className="modal-backdrop bg-black/40" onClick={onClose} />

      <ImageLightbox 
        src={activeLightboxImg} 
        alt={activeLightboxTitle} 
        isOpen={!!activeLightboxImg} 
        onClose={() => setActiveLightboxImg(null)} 
      />
    </div>
  );
}
