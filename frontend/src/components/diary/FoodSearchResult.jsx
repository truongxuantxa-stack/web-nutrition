/**
 * FoodSearchResult — Card kết quả tìm kiếm món ăn
 */
export default function FoodSearchResult({ food, onSelect }) {
  return (
    <button
      id={`food-result-${food.id}`}
      onClick={() => onSelect(food)}
      className="flex items-center gap-3 p-3 w-full text-left hover:bg-base-200 rounded-xl transition-colors group"
    >
      {/* Hình ảnh hoặc Icon theo foodType */}
      {food.imageUrl ? (
        <img src={food.imageUrl} alt={food.name} className="w-10 h-10 object-cover rounded-full shrink-0" />
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
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {food.isCustom && (
          <span className="badge badge-xs badge-primary">Của tôi</span>
        )}
        <span className="badge badge-xs badge-ghost">
          {food.foodType === 'raw' ? 'Nguyên liệu' : 'Món ăn'}
        </span>
      </div>
    </button>
  );
}
