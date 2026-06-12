import React from 'react';

const schemeConfig = {
  blue: {
    bg: 'bg-blue-50 border-blue-100',
    progress: 'bg-blue-500',
    text: 'text-blue-600',
    bar: 'bg-blue-100',
  },
  amber: {
    bg: 'bg-amber-50 border-amber-100',
    progress: 'bg-amber-400',
    text: 'text-amber-600',
    bar: 'bg-amber-100',
  },
  pink: {
    bg: 'bg-pink-50 border-pink-100',
    progress: 'bg-pink-500',
    text: 'text-pink-600',
    bar: 'bg-pink-100',
  },
  emerald: {
    bg: 'bg-[#5FE089]/10 border-[#5FE089]/20',
    progress: 'bg-[#2EA850]',
    text: 'text-[#2EA850]',
    bar: 'bg-[#5FE089]/20',
  },
};

export default function MacroSummaryCard({ icon, label, value, unit, target, colorScheme }) {
  const percent = target > 0 ? Math.min(Math.round((value / target) * 100), 150) : 0;
  const scheme  = schemeConfig[colorScheme] || schemeConfig.blue;

  return (
    <div className={`p-5 rounded-2xl border ${scheme.bg} hover:scale-[1.02] hover:shadow-md transition-all duration-200 flex flex-col justify-between min-w-[130px]`}>
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
            <div className={`h-1.5 ${scheme.bar} rounded-full overflow-hidden`}>
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
