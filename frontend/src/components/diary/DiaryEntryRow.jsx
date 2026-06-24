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

  // Tính toán tổng dinh dưỡng thực tế dựa trên amount
  const tCal = Math.round(entry.caloriesSnapshot);
  const tPro = Math.round(entry.proteinSnapshot * 10) / 10;
  const tCarb = Math.round(entry.carbsSnapshot * 10) / 10;
  const tFat = Math.round(entry.fatSnapshot * 10) / 10;
  const tFib = entry.fiberSnapshot != null ? Math.round(entry.fiberSnapshot * 10) / 10 : null;
  const tSug = entry.sugarSnapshot != null ? Math.round(entry.sugarSnapshot * 10) / 10 : null;
  const tSod = entry.sodiumSnapshot != null ? Math.round(entry.sodiumSnapshot) : null;
  const tVitA = entry.vitaminASnapshot != null ? Math.round(entry.vitaminASnapshot) : 0;
  const tVitC = entry.vitaminCSnapshot != null ? Math.round(entry.vitaminCSnapshot * 10) / 10 : 0;
  const tCa = entry.calciumSnapshot != null ? Math.round(entry.calciumSnapshot) : 0;
  const tFe = entry.ironSnapshot != null ? Math.round(entry.ironSnapshot * 10) / 10 : 0;

  return (
    <li className="flex flex-col px-4 py-2 hover:bg-[#F0F2F3]/60 transition-colors group">
      <div className="flex items-center justify-between gap-x-3 w-full">
        {/* Cột thông tin món ăn */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <SafeImage
            src={entry.imageUrl}
            alt={entry.foodName}
            className="w-6 h-6 rounded-full object-cover shrink-0 bg-[#DFE3E4] border border-[#DFE3E4] shadow-sm cursor-zoom-in hover:scale-110 active:scale-95 transition-transform"
            onClick={() => setIsLightboxOpen(true)}
            fallback={
              <span className="text-base shrink-0 select-none">{emoji}</span>
            }
          />
          <p className="text-sm font-semibold truncate text-[#003139]" title={entry.foodName}>
            {entry.foodName}
          </p>
          <span className="text-[#DFE3E4] text-xs shrink-0">·</span>
          <span className="text-xs text-[#96A5A8] font-semibold whitespace-nowrap shrink-0">
            {entry.unit === '100g' ? `${entry.amount}g` : entry.unit === '100ml' ? `${entry.amount}ml` : `${entry.amount} ${entry.unit}`}
          </span>
        </div>

        {/* Calo & Nút xóa */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <span className="text-xs font-extrabold text-[#003139] min-w-[55px] text-right whitespace-nowrap">
            {tCal} kcal
          </span>

          <div className="w-6 h-6 flex items-center justify-center shrink-0">
            <button
              id={`delete-entry-${entry.id}`}
              onClick={handleDelete}
              onBlur={() => setConfirming(false)}
              className={`w-6 h-6 flex items-center justify-center rounded-md transition-all duration-200 ${
                confirming
                  ? 'text-[#DC2626] bg-[#DC2626]/5 opacity-100'
                  : 'text-[#DFE3E4] hover:text-[#96A5A8] md:opacity-0 md:group-hover:opacity-100 opacity-100'
              }`}
              title={confirming ? 'Bấm lần nữa để xác nhận xóa' : 'Xóa món'}
              aria-label="Xóa món"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Macros luôn hiển thị để mobile cũng xem được */}
      <div className="pl-[34px]">
        <div>
          {/* Macros chính */}
          <div className="pt-1.5 text-[10px] flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-[#003139]/80 font-medium">P: {tPro}g</span>
            <span className="text-[#DFE3E4]">·</span>
            <span className="text-[#C87C46]/80 font-medium">C: {tCarb}g</span>
            <span className="text-[#DFE3E4]">·</span>
            <span className="text-[#96A5A8]/80 font-medium">F: {tFat}g</span>
            {tFib != null && tFib > 0 && (
              <>
                <span className="text-[#DFE3E4]">·</span>
                <span className="text-[#2EA850]/80 font-medium">Xơ: {tFib}g</span>
              </>
            )}
            {tSug != null && tSug > 0 && (
              <>
                <span className="text-[#DFE3E4]">·</span>
                <span className="text-[#DC2626]/80 font-medium">Đường: {tSug}g</span>
              </>
            )}
            {tSod != null && tSod > 0 && (
              <>
                <span className="text-[#DFE3E4]">·</span>
                <span className="text-[#96A5A8]/80 font-medium">Natri: {tSod}mg</span>
              </>
            )}
          </div>
          {/* Vi chất — chỉ hiện nếu có ít nhất 1 giá trị */}
          {(tVitA > 0 || tVitC > 0 || tCa > 0 || tFe > 0) && (
            <div className="pb-0.5 text-[10px] flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[#96A5A8]">
              {tVitA > 0 && (
                <span>🥕 Vitamin A: {tVitA}µg</span>
              )}
              {tVitC > 0 && (
                <span>🍊 Vitamin C: {tVitC}mg</span>
              )}
              {tCa > 0 && (
                <span>🦴 Canxi: {tCa}mg</span>
              )}
              {tFe > 0 && (
                <span>🩸 Sắt: {tFe}mg</span>
              )}
            </div>
          )}
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
