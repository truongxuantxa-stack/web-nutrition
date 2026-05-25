/**
 * StatCard — Card hiển thị 1 metric: icon + label + value + optional progress bar
 */
export default function StatCard({ icon, label, value, unit, progress, color = 'primary', className = '' }) {
  return (
    <div className={`card bg-base-100 border border-base-300 ${className}`}>
      <div className="card-body p-4 gap-2">
        <div className="flex items-center gap-2 text-base-content/60 text-xs font-medium uppercase tracking-wide">
          {icon && <span className="text-base">{icon}</span>}
          {label}
        </div>
        <div className="flex items-end gap-1">
          <span className={`text-2xl font-bold text-${color}`}>{value ?? '—'}</span>
          {unit && <span className="text-xs text-base-content/50 mb-1">{unit}</span>}
        </div>
        {progress != null && (
          <progress
            className={`progress progress-${color} w-full h-1.5`}
            value={Math.min(progress, 100)}
            max="100"
          />
        )}
      </div>
    </div>
  );
}
