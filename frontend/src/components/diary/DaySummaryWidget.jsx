import { Flame } from 'lucide-react';

function MacroItem({ label, consumed, target, color, barColor, isHighlight }) {
  const pct = target > 0 ? Math.min(Math.round((consumed / target) * 100), 100) : 0;

  return (
    <div className={`flex flex-col gap-1.5 flex-1 rounded-2xl px-3.5 py-3 hover:scale-[1.02] transition-transform duration-300 ${isHighlight ? 'bg-base-200/70 border border-emerald-500/10 shadow-sm' : 'bg-base-200/30'}`}>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider ${color}`}>{label}</span>
        <span className={`text-[10px] font-bold ${pct >= 100 ? 'text-error' : 'text-base-content/40'}`}>{pct}%</span>
      </div>
      <div className="flex items-baseline gap-0.5 mt-0.5">
        <span className="text-base sm:text-lg font-black text-base-content">{consumed}</span>
        <span className="text-[10px] text-base-content/40 font-bold">/ {target}g</span>
      </div>
      <div className="h-2 rounded-full bg-base-content/10 overflow-hidden mt-1">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function DaySummaryWidget({ consumed = 0, target = 0, consumedMacros = {}, targetMacros = {} }) {
  const percent = target > 0 ? Math.round((consumed / target) * 100) : 0;
  const remaining = target - consumed;

  // SVG ring — kích thước vừa phải
  const size   = 88;
  const cx     = size / 2;
  const cy     = size / 2;
  const radius = 36;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(percent, 100) / 100) * circumference;

  const ringColor =
    percent > 100 ? 'stroke-error' :
    percent > 85  ? 'stroke-amber-400' :
    'stroke-emerald-500';

  const tipColor =
    percent > 100 ? 'text-error' :
    percent > 85  ? 'text-amber-500' :
    'text-emerald-500';

  const tip =
    percent > 100
      ? '⚠️ Đã vượt mục tiêu. Hãy kiểm soát bữa tiếp theo!'
      : percent > 85
        ? '💡 Gần đạt mục tiêu. Ưu tiên đạm nếu còn đói.'
        : '✅ Mức calo an toàn. Tiếp tục duy trì nhé!';

  return (
    <div className="glass-card overflow-hidden">
      <div className="card-body p-5 gap-0">

        {/* Title */}
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-4 h-4 text-emerald-500" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-base-content/40">Tóm tắt ngày</h3>
          {percent > 100 && (
            <span className="badge badge-error badge-xs ml-auto font-bold text-white py-1 px-2 h-auto text-[10px]">
              Vượt mục tiêu
            </span>
          )}
        </div>

        {/* Ring + Stats row */}
        <div className="flex items-center gap-5">

          {/* Ring */}
          <div className="relative shrink-0" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="-rotate-90" style={{ transform: 'rotate(-90deg)' }}>
              {/* track */}
              <circle cx={cx} cy={cy} r={radius} fill="none" strokeWidth={strokeWidth} className="stroke-base-content/10" />
              {/* glow track */}
              <circle
                cx={cx} cy={cy} r={radius} fill="none"
                strokeWidth={strokeWidth + 4}
                className={`opacity-[0.08] ${ringColor}`}
              />
              {/* progress */}
              <circle
                cx={cx} cy={cy} r={radius} fill="none"
                strokeWidth={strokeWidth}
                className={`transition-all duration-700 ease-out ${ringColor}`}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            {/* Center text — Còn lại / Vượt */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-1 text-center select-none">
              <span className="text-[9px] text-base-content/40 font-bold uppercase tracking-wider leading-none">
                {remaining >= 0 ? 'Còn lại' : 'Vượt'}
              </span>
              <span className={`text-lg font-black leading-none mt-1 transition-colors duration-500 ${remaining < 0 ? 'text-error' : 'text-emerald-500'}`}>
                {remaining >= 0 ? remaining.toLocaleString() : Math.abs(remaining).toLocaleString()}
              </span>
              <span className="text-[8px] text-base-content/30 font-bold mt-0.5">KCAL</span>
            </div>
          </div>

          {/* Calo stats */}
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs font-bold gap-2">
              <div className="flex flex-col">
                <span className="text-base-content/40 uppercase text-[9px] tracking-wider leading-none">Đã nạp</span>
                <span className="text-xl sm:text-2xl font-black text-base-content mt-1 leading-none">
                  {consumed.toLocaleString()} <span className="text-xs font-normal text-base-content/40">kcal</span>
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-base-content/40 uppercase text-[9px] tracking-wider leading-none">Mục tiêu</span>
                <span className="text-md sm:text-lg font-bold text-base-content/75 mt-1 leading-none">
                  {target.toLocaleString()} <span className="text-xs font-normal text-base-content/40">kcal</span>
                </span>
              </div>
            </div>

            {/* Calo progress bar */}
            <div className="h-3 rounded-full bg-base-content/10 overflow-hidden mt-1 relative">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  percent > 100 ? 'bg-error' : percent > 85 ? 'bg-amber-400' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[pulse_2s_infinite]" />
            </div>

            {/* Percentage label under progress bar */}
            <div className="flex justify-between items-center text-[10px] font-bold text-base-content/40 select-none">
              <span>Tiến độ ngày</span>
              <span className={percent > 100 ? 'text-error font-extrabold' : percent > 85 ? 'text-amber-500 font-extrabold' : 'text-emerald-500 font-extrabold'}>
                {percent}%
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-base-content/8 my-4" />

        {/* 3 Macros — ngang hàng */}
        <div className="flex gap-2">
          <MacroItem
            label="Protein"
            consumed={consumedMacros.protein || 0}
            target={targetMacros.protein || 0}
            color="text-blue-500"
            barColor="bg-blue-500"
            isHighlight={true}
          />
          <MacroItem
            label="Carbs"
            consumed={consumedMacros.carbs || 0}
            target={targetMacros.carbs || 0}
            color="text-amber-500"
            barColor="bg-amber-400"
            isHighlight={false}
          />
          <MacroItem
            label="Fat"
            consumed={consumedMacros.fat || 0}
            target={targetMacros.fat || 0}
            color="text-pink-500"
            barColor="bg-pink-500"
            isHighlight={false}
          />
        </div>

        {/* Tip */}
        <p className={`text-[11px] font-medium mt-3 ${tipColor}`}>{tip}</p>
      </div>
    </div>
  );
}
