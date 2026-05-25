import { RefreshCw, AlertTriangle, Pin } from 'lucide-react';

export default function MealResult({ result, onSwap, pinnedFoods = {}, onTogglePin }) {
  if (!result) return null;

  const { success, data: items = [], errors = [], warnings = [] } = result;

  const allIssues = [...errors, ...(warnings || [])];

  return (
    <div className="flex flex-col gap-3">
      {/* Warnings / Errors */}
      {allIssues.map((issue, i) => (
        <div
          key={i}
          className={`alert ${issue.severity === 'error' || issue.type === 'FATAL' ? 'alert-error' : 'alert-warning'} py-2`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="text-sm">{issue.message}</span>
        </div>
      ))}

      {/* Result table */}
      {items.length > 0 && (
        <div className="card bg-base-100 border border-base-300 overflow-hidden">
          <table className="table table-sm">
            <thead>
              <tr className="bg-base-200 text-xs text-base-content/60">
                <th>Nguyên liệu</th>
                <th className="text-right">Gram</th>
                <th className="text-right">Calo</th>
                <th className="text-right">P/C/F</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const isNegative = item.grams < 0;
                const role = item.food?.category || item.role;
                const isPinned = pinnedFoods[role] === item.food?.id;

                return (
                  <tr key={i} className={isNegative ? 'bg-error/5' : ''}>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {isPinned && <Pin className="w-3.5 h-3.5 text-primary shrink-0 fill-primary" />}
                        <span className="font-medium text-sm">{item.food?.name || item.foodName}</span>
                        {isNegative && (
                          <span className="badge badge-error badge-xs">⚠️</span>
                        )}
                      </div>
                      {role && (
                        <span className="badge badge-ghost badge-xs capitalize">{role}</span>
                      )}
                    </td>
                    <td className="text-right font-mono text-sm">
                      {isNegative ? '—' : `${Math.round(item.grams)}g`}
                    </td>
                    <td className="text-right text-sm">
                      {isNegative ? '—' : `${Math.round((item.food?.calories || 0) * item.grams / 100)} kcal`}
                    </td>
                    <td className="text-right text-xs text-base-content/50">
                      {isNegative ? '—' : `${Math.round((item.food?.protein || 0) * item.grams / 100)}/${Math.round((item.food?.carbs || 0) * item.grams / 100)}/${Math.round((item.food?.fat || 0) * item.grams / 100)}`}
                    </td>
                    <td className="flex items-center justify-end gap-1.5">
                      <button
                        id={`pin-${i}`}
                        onClick={() => onTogglePin(item)}
                        className={`btn btn-ghost btn-xs btn-square ${isPinned ? 'text-primary bg-primary/10' : 'text-base-content/30 hover:bg-base-200'}`}
                        title={isPinned ? 'Bỏ ghim món này' : 'Ghim cố định món này'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`swap-${i}`}
                        onClick={() => onSwap(item, i)}
                        className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:bg-base-200"
                        title="Đổi nguyên liệu"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
