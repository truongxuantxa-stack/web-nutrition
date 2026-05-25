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
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body p-5 gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-base-content/50 flex items-center gap-1">
            <Droplets className="w-3.5 h-3.5 text-blue-400" />
            Nước uống
          </h3>
          <span className="text-xs text-base-content/50">
            {total} / {goal} ml
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-base-300 rounded-full h-3 overflow-hidden">
          <div
            className="bg-blue-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="text-xs text-base-content/40 text-right">{percent.toFixed(0)}%</p>

        {/* Quick add buttons */}
        <div className="flex gap-2 flex-wrap">
          {[200, 300, 500].map(ml => (
            <button
              key={ml}
              id={`water-add-${ml}`}
              onClick={() => addWater(ml)}
              disabled={isPending}
              className="btn btn-xs btn-outline btn-info gap-1"
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
