/**
 * StatCard — Card hiển thị 1 metric: icon + label + value + optional progress bar
 */
export default function StatCard({ icon, label, value, unit, progress, color = 'primary', className = '' }) {
  return (
    <div className={`glass-card ${className}`}>
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
          <div className="pill-progress mt-1">
            <div
              className={`h-full rounded-full bg-${color} transition-all duration-500`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
