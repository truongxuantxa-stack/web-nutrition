/**
 * CalorieRing — Vòng tròn SVG animated hiển thị % calo đã nạp / mục tiêu
 */
export default function CalorieRing({ consumed, target, noCard = false }) {
  const percent     = target > 0 ? Math.min((consumed / target) * 100, 150) : 0;
  const displayPct  = Math.min(percent, 100);
  const radius      = 54;
  const circumference = 2 * Math.PI * radius;
  const offset      = circumference - (displayPct / 100) * circumference;

  const content = (
    <>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-base-content/50">Calo hôm nay</h3>

      <div className="relative w-48 h-48 my-2">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          {/* Background ring */}
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-base-300"
          />
          {/* Progress ring */}
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={percent > 100 ? '#ef4444' : 'url(#ring-gradient)'}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              '--ring-circumference': circumference,
              '--ring-offset': offset,
              animation: 'ring-draw 1s ease-out forwards',
              filter: percent > 100 
                ? 'drop-shadow(0 0 12px rgba(239,68,68,0.6))' 
                : percent > 50 
                  ? 'drop-shadow(0 0 14px rgba(16,185,129,0.7))' 
                  : 'drop-shadow(0 0 6px rgba(16,185,129,0.3))',
              transition: 'stroke-dashoffset 0.8s ease-in-out, stroke 0.3s ease',
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-black tracking-tight ${percent > 100 ? 'text-error' : 'text-emerald-500'}`}>{consumed}</span>
          <span className="text-[11px] uppercase font-bold text-base-content/40 tracking-wider">kcal</span>
          <span className="text-[11px] text-base-content/60 font-semibold mt-1 bg-base-300/40 px-2 py-0.5 rounded-full shadow-sm">
            {percent.toFixed(0)}% mục tiêu
          </span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-base-content/75">
          Mục tiêu: <span className="font-bold text-base-content">{target} kcal</span>
        </p>
        <p className="text-xs text-base-content/50 mt-1">
          {percent > 100 ? (
            <span className="text-error font-semibold">Vượt mục tiêu: {consumed - target} kcal</span>
          ) : (
            <span>Còn lại: <span className="font-semibold">{target - consumed} kcal</span></span>
          )}
        </p>
      </div>
    </>
  );

  if (noCard) {
    return (
      <div className="flex flex-col items-center gap-3">
        {content}
      </div>
    );
  }

  return (
    <div className="glass-card">
      <div className="card-body p-6 items-center gap-3">
        {content}
      </div>
    </div>
  );
}
