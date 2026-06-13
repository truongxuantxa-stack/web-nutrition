import { Flame } from 'lucide-react';

function MacroItem({ label, consumed, target, color, barColor, isHighlight }) {
  const pct = target > 0 ? Math.min(Math.round((consumed / target) * 100), 100) : 0;

  return (
    <div className="flex flex-col gap-1.5 flex-1 rounded-2xl px-3.5 py-3 hover:scale-[1.02] transition-transform duration-300 bg-[#F0F2F3]">
      <div className="flex items-center justify-between">
        <span className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider ${color}`}>{label}</span>
        <span className={`text-[10px] font-bold ${pct >= 100 ? 'text-red-500' : 'text-[#96A5A8]'}`}>{pct}%</span>
      </div>
      <div className="flex items-baseline gap-0.5 mt-0.5">
        <span className="text-base sm:text-lg font-black text-[#003139]">{consumed}</span>
        <span className="text-[10px] text-[#96A5A8] font-bold">/ {target}g</span>
      </div>
      <div className="h-2 rounded-full bg-[#DFE3E4] overflow-hidden mt-1">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function DaySummaryWidget({ consumed = 0, target = 0, consumedMacros = {}, targetMacros = {} }) {
  const percent   = target > 0 ? Math.round((consumed / target) * 100) : 0;
  const remaining = target - consumed;

  // SVG ring
  const size          = 88;
  const cx            = size / 2;
  const cy            = size / 2;
  const radius        = 36;
  const strokeWidth   = 7;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(percent, 100) / 100) * circumference;

  // Colors — TCL-safe (no DaisyUI stroke-* classes)
  const ringStroke =
    percent > 100 ? '#DC2626' :
    percent > 85  ? '#C87C46' :
    '#2EA850';

  const tipColor =
    percent > 100 ? 'text-[#DC2626]' :
    percent > 85  ? 'text-[#C87C46]' :
    'text-[#2EA850]';

  const tip =
    percent > 100
      ? '⚠️ Đã vượt mục tiêu. Hãy kiểm soát bữa tiếp theo!'
      : percent > 85
        ? '💡 Gần đạt mục tiêu. Ưu tiên đạm nếu còn đói.'
        : '✅ Mức calo an toàn. Tiếp tục duy trì nhé!';

  return (
    <div className="tcl-card bg-white border border-[#DFE3E4] rounded-2xl p-6 shadow-sm overflow-hidden">
      <div className="flex flex-col gap-0">

        {/* Title */}
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-4 h-4 text-[#003139]" />
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[#96A5A8]">Tóm tắt ngày</h3>
          {percent > 100 && (
            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              Vượt mục tiêu
            </span>
          )}
        </div>

        {/* Content Area: Ring Left | Vertical Divider | Macros Right */}
        <div className="flex flex-col md:flex-row items-center gap-6 mt-4">
          
          {/* Left: Calorie Ring */}
          <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
              {/* track */}
              <circle cx={cx} cy={cy} r={radius} fill="none" strokeWidth={strokeWidth} stroke="#DFE3E4" />
              {/* glow track */}
              <circle cx={cx} cy={cy} r={radius} fill="none" strokeWidth={strokeWidth + 4} stroke={ringStroke} opacity="0.08" />
              {/* progress */}
              <circle
                cx={cx} cy={cy} r={radius} fill="none"
                strokeWidth={strokeWidth}
                stroke={ringStroke}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.7s ease-out' }}
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center p-1 text-center select-none">
              <span className="text-[9px] text-[#96A5A8] font-bold uppercase tracking-wider leading-none">
                {remaining >= 0 ? 'Còn lại' : 'Vượt'}
              </span>
              <span className={`text-lg font-black leading-none mt-1 transition-colors duration-500 ${remaining < 0 ? 'text-[#DC2626]' : 'text-[#2EA850]'}`}>
                {remaining >= 0 ? remaining.toLocaleString() : Math.abs(remaining).toLocaleString()}
              </span>
              <span className="text-[8px] text-[#96A5A8] font-bold mt-0.5">KCAL</span>
            </div>
          </div>

          {/* Vertical Divider (only visible on md+) */}
          <div className="hidden md:block w-px h-24 bg-[#DFE3E4]" />
          
          {/* Horizontal Divider (only visible on mobile) */}
          <div className="w-full h-px bg-[#DFE3E4] md:hidden" />

          {/* Right: Macro Bars */}
          <div className="flex flex-col gap-4 flex-1 w-full">
            {/* Header for macros: Consumed / Target */}
            <div className="flex justify-between items-end mb-1 px-1">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-[#003139] leading-none">{consumed.toLocaleString()}</span>
                <span className="text-xs text-[#96A5A8] font-bold uppercase tracking-wider">đã nạp</span>
              </div>
              <div className="flex items-baseline gap-1.5 text-right">
                <span className="text-lg sm:text-xl font-bold text-[#244348] leading-none">{target.toLocaleString()}</span>
                <span className="text-xs text-[#96A5A8] font-bold uppercase tracking-wider">mục tiêu</span>
              </div>
            </div>

            {/* Macro Cards Grid */}
            <div className="grid grid-cols-3 gap-3">
              <MacroItem
                label="Protein"
                consumed={consumedMacros.protein || 0}
                target={targetMacros.protein || 0}
                color="text-[#003139]"
                barColor="bg-[#003139]"
              />
              <MacroItem
                label="Carbs"
                consumed={consumedMacros.carbs || 0}
                target={targetMacros.carbs || 0}
                color="text-[#C87C46]"
                barColor="bg-[#C87C46]"
              />
              <MacroItem
                label="Fat"
                consumed={consumedMacros.fat || 0}
                target={targetMacros.fat || 0}
                color="text-[#96A5A8]"
                barColor="bg-[#96A5A8]"
              />
            </div>
          </div>
        </div>


        {/* Tip */}
        <p className={`text-[11px] font-medium mt-3 ${tipColor}`}>{tip}</p>
      </div>
    </div>
  );
}
