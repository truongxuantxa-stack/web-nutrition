import { Droplets, Plus } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import api from '../../lib/axios';
import queryClient from '../../lib/queryClient';
import toast from 'react-hot-toast';

export default function WaterProgress({ total, goal, date }) {
  const percent = goal > 0 ? Math.min((total / goal) * 100, 100) : 0;

  const { mutate: addWater, isPending } = useMutation({
    mutationFn: (amount) => api.post('/water', { amount, date }),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', date] });
      queryClient.invalidateQueries({ queryKey: ['diary', date] });
    },
    onError: () => toast.error('Không thể ghi nước. Vui lòng thử lại.'),
  });

  return (
    <div className="tcl-card rounded-2xl flex flex-col justify-between p-6 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[#96A5A8] flex items-center gap-1.5">
          <Droplets className="w-4 h-4 text-blue-500" />
          Nước uống
        </h3>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 text-[10px] font-bold">
          {percent.toFixed(0)}%
        </span>
      </div>

      {/* Big Visual Metric */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl flex-shrink-0">
          💧
        </div>
        <div>
          <div className="text-2xl font-extrabold text-blue-600 flex items-baseline gap-0.5">
            {total}
            <span className="text-xs text-[#96A5A8] font-normal ml-1">/ {goal} ml</span>
          </div>
          <p className="text-[10px] text-[#96A5A8] mt-0.5">
            {percent >= 100 ? '🎉 Đã đạt mục tiêu nước!' : `Còn cần thêm ${Math.max(0, goal - total)} ml`}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 bg-blue-50 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Quick add buttons */}
      <div className="flex gap-2">
        {[200, 300, 500].map(ml => (
          <button
            key={ml}
            id={`water-add-${ml}`}
            onClick={() => addWater(ml)}
            disabled={isPending}
            className="flex-1 flex items-center justify-center gap-0.5 py-1.5 rounded-full border border-blue-200 text-blue-600 text-xs font-semibold hover:bg-blue-50 hover:scale-105 active:scale-95 transition-all duration-150 disabled:opacity-50"
          >
            <Plus className="w-3 h-3" />
            {ml}ml
          </button>
        ))}
      </div>
    </div>
  );
}
