import { useState } from 'react';
import { Droplets, Plus, Trash2, Settings, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { useAddWater, useDeleteWater } from '../../hooks/useDiary';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

export default function WaterTracker({ total, goal, logs = [], date }) {
  const [customAmt, setCustomAmt]   = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [editGoal, setEditGoal]     = useState(false);
  const [newGoal, setNewGoal]       = useState(goal);
  const [showLogs, setShowLogs]     = useState(false);

  const addWater    = useAddWater(date);
  const deleteWater = useDeleteWater(date);
  const qc          = useQueryClient();

  const updateGoal = useMutation({
    mutationFn: (g) => api.put('/water/goal', { waterGoal: g }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['diary', date] });
      qc.invalidateQueries({ queryKey: ['dashboard', date] });
      setEditGoal(false);
      toast.success('Đã cập nhật mục tiêu nước!');
    },
  });

  const percent = goal > 0 ? Math.min((total / goal) * 100, 100) : 0;

  const handleCustomAdd = () => {
    const ml = parseInt(customAmt);
    if (isNaN(ml) || ml <= 0) { toast.error('Vui lòng nhập số ml hợp lệ.'); return; }
    addWater.mutate({ amount: ml });
    setCustomAmt('');
    setShowCustom(false);
  };

  return (
    <div className="glass-card relative z-20">
      <div className="card-body p-4">

        {/* ── Hàng chính: icon | số liệu + bar | nút thêm nhanh | settings ── */}
        <div className="flex items-center gap-4 flex-wrap">

          {/* Icon + Label + số kèm Tooltip công thức */}
          <div className="flex items-center gap-2 shrink-0">
            <Droplets className="w-5 h-5 text-sky-400" />
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black text-base-content">{total.toLocaleString()}</span>
              <div 
                className="tooltip tooltip-top cursor-help flex items-center gap-1 text-xs text-base-content/40 font-medium hover:text-sky-500 transition-colors"
                data-tip="Mặc định tính theo công thức y khoa: Cân nặng × 35 ml. Có thể nhấp icon bánh răng bên phải để tùy chỉnh lại."
              >
                <span>/ {goal.toLocaleString()} ml</span>
                <HelpCircle className="w-3.5 h-3.5 opacity-60" />
              </div>
            </div>
          </div>

          {/* Progress bar — flex-1 chiếm phần còn lại */}
          <div className="flex-1 min-w-[120px] flex flex-col gap-1.5">
            <div className="h-2.5 rounded-full bg-base-content/10 overflow-hidden relative">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-400 to-sky-500 transition-all duration-700 ease-out"
                style={{ width: `${percent}%` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-[pulse_2.5s_infinite]" />
            </div>
            <span className={`text-[10px] font-bold ${percent >= 100 ? 'text-sky-500 animate-bounce' : 'text-base-content/40'}`}>
              {percent >= 100 ? '🎉 Đạt mục tiêu nước uống hôm nay!' : `Còn lại ${(goal - total).toLocaleString()} ml`}
            </span>
          </div>

          {/* Quick-add buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {[200, 300, 500].map(ml => (
              <button
                key={ml}
                id={`water-quick-${ml}`}
                onClick={() => addWater.mutate({ amount: ml })}
                disabled={addWater.isPending}
                className="btn btn-xs rounded-full border border-sky-400/40 text-sky-500 hover:bg-sky-400 hover:text-white hover:border-sky-400 hover:scale-105 active:scale-95 transition-all duration-300 px-3 font-extrabold shadow-sm shadow-sky-400/5"
              >
                +{ml}
              </button>
            ))}
            <button
              id="water-custom-toggle"
              onClick={() => setShowCustom(s => !s)}
              className="btn btn-xs btn-circle btn-ghost text-sky-500/70 hover:text-sky-500 hover:bg-sky-500/10 transition-all duration-300"
              title="Nhập ml tùy chỉnh"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Settings + log toggle */}
          <div className="flex items-center gap-1.5 shrink-0">
            {logs.length > 0 && (
              <button
                onClick={() => setShowLogs(s => !s)}
                className="btn btn-xs rounded-full btn-ghost text-base-content/50 hover:text-base-content hover:bg-base-200 gap-1.5 px-2 py-1 transition-all duration-300"
                title="Xem lịch sử"
              >
                {showLogs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                <span className="text-[10px] font-bold">{logs.length} lần</span>
              </button>
            )}
            <button
              id="water-edit-goal"
              onClick={() => setEditGoal(g => !g)}
              className="btn btn-xs btn-circle btn-ghost text-base-content/40 hover:text-base-content hover:bg-base-200 transition-all duration-300"
              title="Chỉnh mục tiêu"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ── Custom input (collapse) ── */}
        {showCustom && (
          <div className="flex gap-2 mt-3">
            <input
              id="water-custom-input"
              type="number"
              className="input input-sm input-bordered flex-1"
              placeholder="Nhập ml..."
              value={customAmt}
              onChange={e => setCustomAmt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCustomAdd()}
              min={1} max={5000}
              autoFocus
            />
            <button id="water-custom-add" onClick={handleCustomAdd} className="btn btn-sm btn-info">Thêm</button>
            <button onClick={() => setShowCustom(false)} className="btn btn-sm btn-ghost">Hủy</button>
          </div>
        )}

        {/* ── Edit goal (collapse) ── */}
        {editGoal && (
          <div className="flex gap-2 items-center mt-3">
            <span className="text-xs text-base-content/50 shrink-0">Mục tiêu:</span>
            <input
              type="number"
              className="input input-sm input-bordered flex-1"
              value={newGoal}
              onChange={e => setNewGoal(Number(e.target.value))}
              min={500} max={10000}
            />
            <span className="text-xs text-base-content/50">ml</span>
            <button className="btn btn-primary btn-sm" onClick={() => updateGoal.mutate(newGoal)} disabled={updateGoal.isPending}>Lưu</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditGoal(false)}>Hủy</button>
          </div>
        )}

        {/* ── Log list (collapse) ── */}
        {showLogs && logs.length > 0 && (
          <ul className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-base-content/8">
            {logs.map(log => (
              <li key={log.id} className="flex items-center gap-1.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[11px] font-medium rounded-full px-3 py-1 group">
                <span>💧 {log.amount} ml</span>
                <button
                  id={`water-delete-${log.id}`}
                  onClick={() => deleteWater.mutate(log.id)}
                  className="opacity-0 group-hover:opacity-100 text-error hover:text-error transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </li>
            ))}
          </ul>
        )}

      </div>
    </div>
  );
}
