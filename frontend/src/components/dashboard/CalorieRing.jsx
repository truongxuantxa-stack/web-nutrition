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
      <h3 className="text-xs font-semibold uppercase tracking-widest text-[#96A5A8]">Calo hôm nay</h3>

      <div className="relative w-48 h-48 my-2">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4A767E" />
              <stop offset="100%" stopColor="#003139" />
            </linearGradient>
          </defs>
          {/* Background ring */}
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke="#DFE3E4"
            strokeWidth="8"
          />
          {/* Progress ring */}
          <circle
            cx="60" cy="60" r={radius}
            fill="none"
            stroke={percent > 100 ? '#DC2626' : 'url(#ring-gradient)'}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              '--ring-circumference': circumference,
              '--ring-offset': offset,
              animation: 'ring-draw 1s ease-out forwards',
              transition: 'stroke-dashoffset 0.8s ease-in-out, stroke 0.3s ease',
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-black tracking-tight ${percent > 100 ? 'text-[#DC2626]' : 'text-[#003139]'}`}>{consumed}</span>
          <span className="text-[11px] uppercase font-bold text-[#96A5A8] tracking-wider">kcal</span>
          <span className="text-[11px] text-[#244348] font-semibold mt-1 bg-[#F0F2F3] px-2 py-0.5 rounded-full">
            {percent.toFixed(0)}% mục tiêu
          </span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-[#244348]">
          Mục tiêu: <span className="font-bold text-[#003139]">{target} kcal</span>
        </p>
        <p className="text-xs text-[#96A5A8] mt-1">
          {percent > 100 ? (
            <span className="text-[#DC2626] font-semibold">Vượt mục tiêu: {consumed - target} kcal</span>
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
    <div className="tcl-card rounded-2xl">
      <div className="p-6 flex flex-col items-center gap-3">
        {content}
      </div>
    </div>
  );
}
