/**
 * FoodSearchResult — Card kết quả tìm kiếm món ăn
 */
import { useState } from 'react';
import ImageLightbox from '../common/ImageLightbox';

export default function FoodSearchResult({ food, onSelect }) {
  const [isLightboxOpen, setLightboxOpen] = useState(false);

  return (
    <>
      <button
        id={`food-result-${food.id}`}
        onClick={() => onSelect(food)}
        className="flex items-center gap-3 p-3 w-full text-left hover:bg-base-200 rounded-xl transition-colors group"
      >
        {/* Hình ảnh hoặc Icon theo foodType */}
        {food.imageUrl ? (
          <img 
            src={food.imageUrl} 
            alt={food.name} 
            className="w-10 h-10 object-cover rounded-full shrink-0 cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(true);
            }}
          />
        ) : (
          <div className="w-10 h-10 flex items-center justify-center bg-base-200 rounded-full shrink-0">
            <span className="text-xl">
              {food.foodType === 'raw' ? '🥦' : '🍲'}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
            {food.name}
          </p>
          <p className="text-xs text-base-content/50">
            {food.calories} kcal / {food.unit || '100g'} ·{' '}
            P:{food.protein}g C:{food.carbs}g F:{food.fat}g
            {food.fiber > 0 && <> · Xơ:{food.fiber}g</>}
            {food.sugar > 0 && <> · Đường:{food.sugar}g</>}
          </p>
          {(food.vitaminA > 0 || food.vitaminC > 0 || food.calcium > 0 || food.iron > 0) && (
            <p className="text-[10px] text-base-content/40 flex flex-wrap gap-x-2 mt-0.5">
              {food.vitaminA > 0 && <span>🥕 Vitamin A: {Math.round(food.vitaminA)}µg</span>}
              {food.vitaminC > 0 && <span>🍊 Vitamin C: {Math.round(food.vitaminC * 10) / 10}mg</span>}
              {food.calcium  > 0 && <span>🦴 Canxi: {Math.round(food.calcium)}mg</span>}
              {food.iron     > 0 && <span>🩸 Sắt: {Math.round(food.iron * 10) / 10}mg</span>}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {food.isCustom ? (
            <span className="badge badge-xs badge-primary">Của tôi</span>
          ) : food.dataSource === 'openfoodfacts' ? (
            <span className="badge badge-xs badge-info badge-outline">🌐 Open Food Facts</span>
          ) : (
            <span className="badge badge-xs badge-ghost">📦 Nội bộ</span>
          )}
          <span className="badge badge-xs badge-ghost">
            {food.foodType === 'raw' ? 'Nguyên liệu' : 'Món ăn'}
          </span>
        </div>
      </button>

      {/* Lightbox */}
      <ImageLightbox
        isOpen={isLightboxOpen}
        onClose={() => setLightboxOpen(false)}
        src={food.imageUrl}
        alt={food.name}
      />
    </>
  );
}
