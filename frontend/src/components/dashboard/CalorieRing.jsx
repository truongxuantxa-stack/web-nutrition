/**
 * CalorieRing — Vòng tròn SVG animated hiển thị % calo đã nạp / mục tiêu
 */
export default function CalorieRing({ consumed, target }) {
  const percent     = target > 0 ? Math.min((consumed / target) * 100, 150) : 0;
  const displayPct  = Math.min(percent, 100);
  const radius      = 54;
  const circumference = 2 * Math.PI * radius;
  const offset      = circumference - (displayPct / 100) * circumference;

  // Màu theo mức
  const color =
    percent < 80   ? '#22c55e'   // xanh lá
    : percent <= 100 ? '#f59e0b'  // vàng
    : '#ef4444';                  // đỏ (vượt mục tiêu)

  return (
    <div className="card bg-base-100 border border-base-300">
      <div className="card-body p-5 items-center gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-base-content/50">Calo hôm nay</h3>

        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
            {/* Background ring */}
            <circle
              cx="60" cy="60" r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              className="text-base-300"
            />
            {/* Progress ring */}
            <circle
              cx="60" cy="60" r={radius}
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: 'stroke-dashoffset 0.8s ease-in-out, stroke 0.3s ease' }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold" style={{ color }}>{consumed}</span>
            <span className="text-xs text-base-content/50">kcal</span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-base-content/70">
            Mục tiêu: <span className="font-semibold text-base-content">{target} kcal</span>
          </p>
          <p className="text-xs text-base-content/50 mt-0.5">
            Còn lại: {Math.max(target - consumed, 0)} kcal
          </p>
        </div>
      </div>
    </div>
  );
}
