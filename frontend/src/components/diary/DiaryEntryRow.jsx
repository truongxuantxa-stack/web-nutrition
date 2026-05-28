import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import ImageLightbox from '../common/ImageLightbox';
import SafeImage from '../common/SafeImage';


function getFoodEmoji(name) {
  if (!name) return '🍽️';
  const lower = name.toLowerCase();
  
  if (lower.includes('cơm') || lower.includes('gạo') || lower.includes('cháo') || lower.includes('xôi')) return '🍚';
  if (lower.includes('bò') || lower.includes('beef') || lower.includes('bê')) return '🥩';
  if (lower.includes('gà') || lower.includes('vịt') || lower.includes('chim') || lower.includes('cút')) return '🍗';
  if (lower.includes('cá') || lower.includes('mực') || lower.includes('tôm') || lower.includes('cua') || lower.includes('hải sản') || lower.includes('ốc') || lower.includes('nghêu')) return '🐟';
  if (lower.includes('rau') || lower.includes('cải') || lower.includes('salad') || lower.includes('xà lách') || lower.includes('thực vật')) return '🥗';
  if (lower.includes('trứng') || lower.includes('egg')) return '🥚';
  if (lower.includes('sữa') || lower.includes('milk') || lower.includes('bơ')) return '🥛';
  if (lower.includes('bánh mì') || lower.includes('bread') || lower.includes('sandwich')) return '🍞';
  if (lower.includes('mì') || lower.includes('phở') || lower.includes('bún') || lower.includes('hủ tiếu') || lower.includes('miến')) return '🍜';
  if (lower.includes('heo') || lower.includes('lợn') || lower.includes('thịt') || lower.includes('chả') || lower.includes('giò')) return '🍖';
  if (lower.includes('chuối')) return '🍌';
  if (lower.includes('táo')) return '🍎';
  if (lower.includes('trái cây') || lower.includes('hoa quả') || lower.includes('cam') || lower.includes('nho')) return '🍎';
  if (lower.includes('đậu') || lower.includes('đỗ') || lower.includes('hạt')) return '🥜';
  if (lower.includes('canh') || lower.includes('súp') || lower.includes('soup')) return '🍲';
  
  return '🍽️'; // Default
}

export default function DiaryEntryRow({ entry, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);


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
          <SafeImage
            src={entry.imageUrl}
            alt={entry.foodName}
            className="w-6 h-6 rounded-full object-cover shrink-0 bg-base-300 border border-base-content/10 shadow-sm cursor-zoom-in hover:scale-110 active:scale-95 transition-transform"
            onClick={() => setIsLightboxOpen(true)}
            fallback={
              <span className="text-base shrink-0 select-none">{emoji}</span>
            }
          />
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
      <ImageLightbox 
        src={entry.imageUrl} 
        alt={entry.foodName} 
        isOpen={isLightboxOpen} 
        onClose={() => setIsLightboxOpen(false)} 
      />
    </li>
  );
}
