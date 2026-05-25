import { RefreshCw, AlertTriangle, Pin } from 'lucide-react';

export default function MealResult({ result, onSwap }) {
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
                const isNegative = item.weightGrams < 0;
                return (
                  <tr key={i} className={isNegative ? 'bg-error/5' : ''}>
                    <td>
                      <div className="flex items-center gap-1.5">
                        {item.pinned && <Pin className="w-3 h-3 text-primary shrink-0" />}
                        <span className="font-medium text-sm">{item.foodName}</span>
                        {isNegative && (
                          <span className="badge badge-error badge-xs">⚠️</span>
                        )}
                      </div>
                      {item.role && (
                        <span className="badge badge-ghost badge-xs capitalize">{item.role}</span>
                      )}
                    </td>
                    <td className="text-right font-mono text-sm">
                      {isNegative ? '—' : `${Math.round(item.weightGrams)}g`}
                    </td>
                    <td className="text-right text-sm">
                      {isNegative ? '—' : `${Math.round(item.caloriesContrib)} kcal`}
                    </td>
                    <td className="text-right text-xs text-base-content/50">
                      {isNegative ? '—' : `${Math.round(item.proteinContrib)}/${Math.round(item.carbsContrib)}/${Math.round(item.fatContrib)}`}
                    </td>
                    <td>
                      <button
                        id={`swap-${i}`}
                        onClick={() => onSwap(item, i)}
                        className="btn btn-ghost btn-xs gap-1"
                        title="Đổi nguyên liệu"
                      >
                        <RefreshCw className="w-3 h-3" />
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
