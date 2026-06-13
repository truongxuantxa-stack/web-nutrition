import React from 'react';

const schemeConfig = {
  protein:  { progress: 'bg-[#003139]', text: 'text-[#003139]' },
  carbs:    { progress: 'bg-[#C87C46]', text: 'text-[#003139]' },
  fat:      { progress: 'bg-[#96A5A8]', text: 'text-[#003139]' },
  calories: { progress: 'bg-[#2EA850]', text: 'text-[#2EA850]' },
};

export default function MacroSummaryCard({ icon, label, value, unit, target, colorScheme }) {
  const percent = target > 0 ? Math.min(Math.round((value / target) * 100), 150) : 0;
  const scheme  = schemeConfig[colorScheme] || schemeConfig.protein;

  return (
    <div className="tcl-card rounded-2xl p-5 hover:scale-[1.02] transition-all flex flex-col justify-between min-w-[130px]">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-[#244348]">{label}</span>
        <span className="text-2xl" role="img" aria-label={label}>{icon}</span>
      </div>

      <div>
        <div className="flex items-baseline gap-1 mb-2">
          <span className={`text-2xl font-extrabold ${scheme.text}`}>{value}</span>
          <span className="text-xs text-[#96A5A8] font-semibold">{unit}</span>
          {target > 0 && (
            <span className="text-xs text-[#96A5A8] font-normal">/ {target}{unit}</span>
          )}
        </div>

        {target > 0 && (
          <div>
            <div className="h-1.5 bg-[#F0F2F3] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${scheme.progress} transition-all duration-500`}
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1 text-[10px] text-[#96A5A8]">
              <span>{percent}%</span>
              <span>{Math.max(0, target - value)} {unit} còn lại</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
