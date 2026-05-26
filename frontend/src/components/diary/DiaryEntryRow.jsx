import { useState } from 'react';
import { Trash2 } from 'lucide-react';

const FOOD_EMOJIS = ['🍚','🍗','🥦','🍖','🍜','🥩','🥚','🍳','🥗','🍲','🌽','🥕','🍞','🧀','🥛','🍌','🍎','🥜','🐟','🦐'];

function getFoodEmoji(name) {
  if (!name) return '🍽️';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return FOOD_EMOJIS[Math.abs(hash) % FOOD_EMOJIS.length];
}

export default function DiaryEntryRow({ entry, onDelete }) {
  const [confirming, setConfirming] = useState(false);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (!confirming) { setConfirming(true); return; }
    onDelete();
    setConfirming(false);
  };

  const emoji = getFoodEmoji(entry.foodName);

  return (
    <li className="flex flex-col px-3 py-2 hover:bg-base-200/40 transition-colors group">
      <div className="flex items-center justify-between gap-x-3 w-full">
        {/* Cột thông tin món ăn */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-base shrink-0 select-none">{emoji}</span>
          <p className="text-sm font-semibold truncate text-base-content/90" title={entry.foodName}>
            {entry.foodName}
          </p>
          <span className="text-base-content/30 text-xs shrink-0">·</span>
          <span className="text-xs text-base-content/40 font-semibold whitespace-nowrap shrink-0">
            {entry.amount} {entry.unit}
          </span>
        </div>

        {/* Calo & Nút xóa */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="text-xs font-extrabold text-primary min-w-[55px] text-right whitespace-nowrap">
            {entry.caloriesSnapshot} kcal
          </span>

          <div className="w-6 h-6 flex items-center justify-center shrink-0">
            <button
              id={`delete-entry-${entry.id}`}
              onClick={handleDelete}
              onBlur={() => setConfirming(false)}
              className={`btn btn-ghost btn-xs btn-square transition-all duration-200 ${
                confirming
                  ? 'text-error bg-error/10 opacity-100'
                  : 'text-base-content/20 hover:text-base-content/60 md:opacity-0 md:group-hover:opacity-100 opacity-100'
              }`}
              title={confirming ? 'Bấm lần nữa để xác nhận xóa' : 'Xóa món'}
              aria-label="Xóa món"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Macros hidden by default, visible on hover */}
      <div className="grid grid-rows-[0fr] md:group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-200 ease-in-out pl-[34px]">
        <div className="overflow-hidden">
          <div className="pt-1.5 pb-0.5 text-[10px] whitespace-nowrap flex items-center gap-2">
            <span className="text-blue-500/80 font-medium">P: {entry.proteinSnapshot}g</span>
            <span className="text-base-content/20">·</span>
            <span className="text-amber-500/80 font-medium">C: {entry.carbsSnapshot}g</span>
            <span className="text-base-content/20">·</span>
            <span className="text-pink-500/80 font-medium">F: {entry.fatSnapshot}g</span>
          </div>
        </div>
      </div>
    </li>
  );
}
