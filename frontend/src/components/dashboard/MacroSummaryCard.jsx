import React from 'react';

export default function MacroSummaryCard({ icon, label, value, unit, target, colorScheme }) {
  // Tính phần trăm tiến trình
  const percent = target > 0 ? Math.min(Math.round((value / target) * 100), 150) : 0;
  
  // Xác định các class màu sắc dựa trên colorScheme
  const schemeClasses = {
    blue: {
      card: 'macro-card-blue',
      progress: 'bg-info',
      text: 'text-info',
    },
    amber: {
      card: 'macro-card-amber',
      progress: 'bg-warning',
      text: 'text-warning',
    },
    pink: {
      card: 'macro-card-pink',
      progress: 'bg-secondary',
      text: 'text-secondary',
    },
    emerald: {
      card: 'macro-card-emerald',
      progress: 'bg-success',
      text: 'text-success',
    },
  };

  const currentScheme = schemeClasses[colorScheme] || schemeClasses.blue;

  return (
    <div className={`p-5 rounded-2xl ${currentScheme.card} hover:scale-[1.02] hover:shadow-lg transition-all duration-200 flex flex-col justify-between min-w-[150px] flex-1 md:flex-initial lg:flex-1`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-base-content/70">{label}</span>
        <span className="text-2xl" role="img" aria-label={label}>{icon}</span>
      </div>
      
      <div>
        <div className="flex items-baseline gap-1 mb-2">
          <span className={`text-2xl font-extrabold ${currentScheme.text}`}>{value}</span>
          <span className="text-xs text-base-content/50 font-semibold">{unit}</span>
          {target > 0 && (
            <span className="text-xs text-base-content/40 font-normal">
              / {target}
              {unit}
            </span>
          )}
        </div>
        
        {target > 0 && (
          <div className="w-full">
            <div className="pill-progress h-2 bg-base-300/40 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${currentScheme.progress} transition-all duration-500`}
                style={{ width: `${Math.min(percent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center mt-1 text-[10px] text-base-content/50">
              <span>{percent}%</span>
              <span>{Math.max(0, target - value)} {unit} còn lại</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
