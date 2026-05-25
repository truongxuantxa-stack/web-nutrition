import { useState } from 'react';
import { useMealConfig, useUpdateConfig } from '../../hooks/useMealPlanner';
import { X, Save } from 'lucide-react';

export default function MealConfigModal({ isOpen, onClose }) {
  const { data: configData = [] } = useMealConfig();
  const [meals, setMeals]         = useState(null);
  const updateConfig              = useUpdateConfig();

  const currentMeals = meals || configData;

  const setPercent = (key, val) => {
    setMeals(prev =>
      (prev || configData).map(m =>
        m.key === key ? { ...m, percent: Number(val) } : m
      )
    );
  };

  const total    = currentMeals.reduce((s, m) => s + (m.percent || 0), 0);
  const isValid  = total === 100;

  const handleSave = () => {
    updateConfig.mutate(currentMeals, {
      onSuccess: () => onClose(),
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Cấu hình bữa ăn</h3>
          <button id="config-modal-close" onClick={onClose} className="btn btn-ghost btn-sm btn-square">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {currentMeals.map(meal => (
            <div key={meal.key} className="flex items-center gap-3">
              <label className="label-text w-24 text-sm shrink-0">{meal.label}</label>
              <input
                id={`config-meal-${meal.key}`}
                type="number"
                className="input input-sm input-bordered flex-1"
                value={meal.percent}
                onChange={e => setPercent(meal.key, e.target.value)}
                min={0}
                max={100}
              />
              <span className="text-sm text-base-content/50 w-6">%</span>
            </div>
          ))}

          {/* Tổng */}
          <div className={`flex justify-between text-sm font-semibold pt-2 border-t border-base-300 ${isValid ? 'text-success' : 'text-error'}`}>
            <span>Tổng</span>
            <span>{total}%</span>
          </div>
          {!isValid && (
            <p className="text-xs text-error">Tổng phải bằng 100%.</p>
          )}
        </div>

        <div className="modal-action">
          <button id="config-modal-cancel" onClick={onClose} className="btn btn-ghost btn-sm">Hủy</button>
          <button
            id="config-modal-save"
            onClick={handleSave}
            disabled={!isValid || updateConfig.isPending}
            className="btn btn-primary btn-sm gap-1"
          >
            <Save className="w-3.5 h-3.5" />
            Lưu
          </button>
        </div>
      </div>
      <div className="modal-backdrop bg-black/40" onClick={onClose} />
    </div>
  );
}
