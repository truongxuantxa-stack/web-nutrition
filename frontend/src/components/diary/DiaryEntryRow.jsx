import { useState } from 'react';
import { Trash2 } from 'lucide-react';

export default function DiaryEntryRow({ entry, onDelete }) {
  const [confirming, setConfirming] = useState(false);

  const handleDelete = () => {
    if (!confirming) { setConfirming(true); return; }
    onDelete();
    setConfirming(false);
  };

  return (
    <li className="flex items-center gap-3 px-4 py-3 hover:bg-base-200/40 transition-colors group">
      {/* Food info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{entry.foodName}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-xs text-base-content/50">{entry.amount} {entry.unit}</span>
          <span className="text-xs text-base-content/40">·</span>
          <span className="text-xs font-medium text-primary">{entry.caloriesSnapshot} kcal</span>
        </div>
      </div>

      {/* Macro badges */}
      <div className="hidden sm:flex items-center gap-1.5">
        <span className="badge badge-xs bg-blue-100 text-blue-700 border-0">P:{entry.proteinSnapshot}g</span>
        <span className="badge badge-xs bg-amber-100 text-amber-700 border-0">C:{entry.carbsSnapshot}g</span>
        <span className="badge badge-xs bg-pink-100 text-pink-700 border-0">F:{entry.fatSnapshot}g</span>
      </div>

      {/* Delete button */}
      <button
        id={`delete-entry-${entry.id}`}
        onClick={handleDelete}
        onBlur={() => setConfirming(false)}
        className={`btn btn-ghost btn-xs btn-square transition-all ${
          confirming
            ? 'text-error bg-error/10'
            : 'text-base-content/20 group-hover:text-base-content/60'
        }`}
        title={confirming ? 'Bấm lần nữa để xác nhận xóa' : 'Xóa món'}
        aria-label="Xóa món"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </li>
  );
}
