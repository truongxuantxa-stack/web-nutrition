import { Flame } from 'lucide-react';

function MacroItem({ label, consumed, target, color, barColor, isHighlight }) {
  const pct = target > 0 ? Math.min(Math.round((consumed / target) * 100), 100) : 0;

  return (
    <div className={`flex flex-col gap-1.5 flex-1 rounded-2xl px-3.5 py-3 hover:scale-[1.02] transition-transform duration-300 ${isHighlight ? 'bg-[#F0F2F3] border border-emerald-500/10 shadow-sm' : 'bg-[#F0F2F3]/60'}`}>
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
    percent > 100 ? '#ef4444' :
    percent > 85  ? '#f59e0b' :
    '#10b981';

  const tipColor =
    percent > 100 ? 'text-red-500' :
    percent > 85  ? 'text-amber-500' :
    'text-[#2EA850]';

  const tip =
    percent > 100
      ? '⚠️ Đã vượt mục tiêu. Hãy kiểm soát bữa tiếp theo!'
      : percent > 85
        ? '💡 Gần đạt mục tiêu. Ưu tiên đạm nếu còn đói.'
        : '✅ Mức calo an toàn. Tiếp tục duy trì nhé!';

  return (
    <div className="tcl-card overflow-hidden">
      <div className="p-5 flex flex-col gap-0">

        {/* Title */}
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-4 h-4 text-emerald-500" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#96A5A8]">Tóm tắt ngày</h3>
          {percent > 100 && (
            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              Vượt mục tiêu
            </span>
          )}
        </div>

        {/* Ring + Stats row */}
        <div className="flex items-center gap-5">
          {/* Ring */}
          <div className="relative shrink-0" style={{ width: size, height: size }}>
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
              <span className={`text-lg font-black leading-none mt-1 transition-colors duration-500 ${remaining < 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                {remaining >= 0 ? remaining.toLocaleString() : Math.abs(remaining).toLocaleString()}
              </span>
              <span className="text-[8px] text-[#96A5A8] font-bold mt-0.5">KCAL</span>
            </div>
          </div>

          {/* Calo stats */}
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs font-bold gap-2">
              <div className="flex flex-col">
                <span className="text-[#96A5A8] uppercase text-[9px] tracking-wider leading-none">Đã nạp</span>
                <span className="text-xl sm:text-2xl font-black text-[#003139] mt-1 leading-none">
                  {consumed.toLocaleString()} <span className="text-xs font-normal text-[#96A5A8]">kcal</span>
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[#96A5A8] uppercase text-[9px] tracking-wider leading-none">Mục tiêu</span>
                <span className="text-md sm:text-lg font-bold text-[#244348] mt-1 leading-none">
                  {target.toLocaleString()} <span className="text-xs font-normal text-[#96A5A8]">kcal</span>
                </span>
              </div>
            </div>

            {/* Calo progress bar */}
            <div className="h-3 rounded-full bg-[#DFE3E4] overflow-hidden mt-1 relative">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${
                  percent > 100 ? 'bg-red-500' : percent > 85 ? 'bg-amber-400' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[pulse_2s_infinite]" />
            </div>

            {/* Percentage label */}
            <div className="flex justify-between items-center text-[10px] font-bold text-[#96A5A8] select-none">
              <span>Tiến độ ngày</span>
              <span className={percent > 100 ? 'text-red-500 font-extrabold' : percent > 85 ? 'text-amber-500 font-extrabold' : 'text-emerald-500 font-extrabold'}>
                {percent}%
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#DFE3E4] my-4" />

        {/* 3 Macros */}
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
