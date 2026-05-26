import { Droplets, Plus } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '../../lib/axios';
import queryClient from '../../lib/queryClient';
import toast from 'react-hot-toast';

export default function WaterProgress({ total, goal, date }) {
  const percent = goal > 0 ? Math.min((total / goal) * 100, 100) : 0;

  const { mutate: addWater, isPending } = useMutation({
    mutationFn: (amount) => api.post('/water', { amount, date }),
    onSuccess : () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', date] });
      queryClient.invalidateQueries({ queryKey: ['diary', date] });
    },
    onError: () => toast.error('Không thể ghi nước. Vui lòng thử lại.'),
  });

  return (
    <div className="glass-card rounded-3xl h-full flex flex-col justify-between">
      <div className="card-body p-6 gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-base-content/50 flex items-center gap-1.5">
            <Droplets className="w-4 h-4 text-blue-500" />
            Nước uống
          </h3>
          <span className="badge badge-sm badge-info font-bold text-[10px] text-info-content">
            {percent.toFixed(0)}%
          </span>
        </div>

        {/* Big Visual Metric */}
        <div className="flex items-center gap-4 my-1">
          <div className="w-12 h-12 rounded-2xl bg-blue-100/50 dark:bg-blue-950/40 flex items-center justify-center text-2xl flex-shrink-0 shadow-inner">
            💧
          </div>
          <div>
            <div className="text-2xl font-extrabold text-blue-500 flex items-baseline gap-0.5">
              {total}
              <span className="text-xs text-base-content/50 font-normal"> / {goal} ml</span>
            </div>
            <p className="text-[10px] text-base-content/40">
              {percent >= 100 ? '🎉 Đã đạt mục tiêu nước!' : `Còn cần thêm ${Math.max(0, goal - total)} ml`}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="pill-progress h-3 bg-base-300/40 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Quick add buttons */}
        <div className="flex gap-2 mt-2">
          {[200, 300, 500].map(ml => (
            <button
              key={ml}
              id={`water-add-${ml}`}
              onClick={() => addWater(ml)}
              disabled={isPending}
              className="btn btn-xs btn-outline btn-info rounded-full flex-1 gap-0.5 hover:scale-105 active:scale-95 transition-all duration-150 py-1"
            >
              <Plus className="w-3 h-3" />
              {ml}ml
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
