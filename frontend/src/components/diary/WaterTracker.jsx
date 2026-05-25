import { useState } from 'react';
import { Droplets, Plus, Trash2, Settings } from 'lucide-react';
import { useAddWater, useDeleteWater } from '../../hooks/useDiary';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

export default function WaterTracker({ total, goal, logs = [], date }) {
  const [customAmt, setCustomAmt]     = useState('');
  const [showCustom, setShowCustom]   = useState(false);
  const [editGoal, setEditGoal]       = useState(false);
  const [newGoal, setNewGoal]         = useState(goal);

  const addWater    = useAddWater(date);
  const deleteWater = useDeleteWater(date);
  const qc          = useQueryClient();

  const updateGoal = useMutation({
    mutationFn: (g) => api.put('/water/goal', { waterGoal: g }),
    onSuccess : () => {
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
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body p-4 gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Droplets className="w-4 h-4 text-blue-400" />
            Nước uống
          </h3>
          <button
            id="water-edit-goal"
            onClick={() => setEditGoal(g => !g)}
            className="btn btn-ghost btn-xs gap-1 text-base-content/40"
          >
            <Settings className="w-3 h-3" /> Mục tiêu
          </button>
        </div>

        {/* Edit goal inline */}
        {editGoal && (
          <div className="flex gap-2 items-center">
            <input
              type="number"
              className="input input-sm input-bordered flex-1"
              value={newGoal}
              onChange={e => setNewGoal(Number(e.target.value))}
              min={500}
              max={10000}
            />
            <span className="text-xs text-base-content/50">ml</span>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => updateGoal.mutate(newGoal)}
              disabled={updateGoal.isPending}
            >Lưu</button>
          </div>
        )}

        {/* Progress */}
        <div>
          <div className="flex justify-between text-xs text-base-content/50 mb-1">
            <span>{total} ml đã uống</span>
            <span>Mục tiêu: {goal} ml</span>
          </div>
          <progress
            className="progress progress-info w-full h-2"
            value={percent}
            max="100"
          />
        </div>

        {/* Quick add */}
        <div className="flex gap-2 flex-wrap">
          {[200, 300, 500].map(ml => (
            <button
              key={ml}
              id={`water-quick-${ml}`}
              onClick={() => addWater.mutate({ amount: ml })}
              disabled={addWater.isPending}
              className="btn btn-xs btn-outline btn-info"
            >
              +{ml}ml
            </button>
          ))}
          <button
            id="water-custom-toggle"
            onClick={() => setShowCustom(s => !s)}
            className="btn btn-xs btn-ghost gap-1"
          >
            <Plus className="w-3 h-3" /> Tùy chỉnh
          </button>
        </div>

        {showCustom && (
          <div className="flex gap-2">
            <input
              id="water-custom-input"
              type="number"
              className="input input-sm input-bordered flex-1"
              placeholder="ml..."
              value={customAmt}
              onChange={e => setCustomAmt(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCustomAdd()}
              min={1}
              max={5000}
            />
            <button
              id="water-custom-add"
              onClick={handleCustomAdd}
              className="btn btn-info btn-sm"
            >
              Thêm
            </button>
          </div>
        )}

        {/* Log list */}
        {logs.length > 0 && (
          <ul className="flex flex-col gap-1 max-h-32 overflow-y-auto">
            {logs.map(log => (
              <li key={log.id} className="flex items-center justify-between text-xs text-base-content/60 hover:text-base-content group">
                <span>💧 {log.amount} ml {log.note ? `— ${log.note}` : ''}</span>
                <button
                  id={`water-delete-${log.id}`}
                  onClick={() => deleteWater.mutate(log.id)}
                  className="btn btn-ghost btn-xs btn-square text-base-content/20 group-hover:text-error opacity-0 group-hover:opacity-100 transition-all"
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
