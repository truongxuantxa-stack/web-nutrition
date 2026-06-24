import React from 'react';

export default function MicronutrientCard({ consumed, gender }) {
  const isMale = gender === 'male';

  const rdi = {
    fiber:    isMale ? 38 : 25,
    vitaminA: isMale ? 900 : 700,
    vitaminC: isMale ? 90 : 75,
    calcium:  1000,
    iron:     isMale ? 8 : 18,
    sodium:   2300,
    sugar:    isMale ? 36 : 25,
  };

  const data = [
    { key: 'fiber',    label: 'Chất xơ',   value: consumed?.fiber    || 0, target: rdi.fiber,    unit: 'g',  icon: '🥦' },
    { key: 'vitaminA', label: 'Vitamin A',  value: consumed?.vitaminA || 0, target: rdi.vitaminA, unit: 'µg', icon: '🥕' },
    { key: 'vitaminC', label: 'Vitamin C',  value: consumed?.vitaminC || 0, target: rdi.vitaminC, unit: 'mg', icon: '🍊' },
    { key: 'calcium',  label: 'Canxi',      value: consumed?.calcium  || 0, target: rdi.calcium,  unit: 'mg', icon: '🥛' },
    { key: 'iron',     label: 'Sắt',        value: consumed?.iron     || 0, target: rdi.iron,     unit: 'mg', icon: '🥩' },
    { key: 'sodium',   label: 'Natri',      value: consumed?.sodium   || 0, target: rdi.sodium,   unit: 'mg', icon: '🧂', reverse: true },
    { key: 'sugar',    label: 'Đường',      value: consumed?.sugar    || 0, target: rdi.sugar,    unit: 'g',  icon: '🍬', reverse: true },
  ];

  return (
    <div className="tcl-card rounded-2xl flex flex-col p-6 gap-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">💊</span>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[#96A5A8]">Vi chất dinh dưỡng</h3>
      </div>

      <div className="flex flex-col gap-3.5">
        {data.map((item) => {
          const percent        = item.target > 0 ? Math.round((item.value / item.target) * 100) : 0;
          const displayPercent = Math.min(percent, 100);
          const isWarning      = item.reverse && item.value > item.target;

          const displayValue = ['fiber', 'iron'].includes(item.key) 
            ? (Number.isInteger(item.value) ? item.value : Number(item.value).toFixed(1)) 
            : Math.round(item.value);

          return (
            <div key={item.key} className="flex items-center gap-3 text-sm group">
              <div className="w-7 h-7 rounded-full bg-[#F0F2F3] flex items-center justify-center text-sm shadow-sm group-hover:scale-110 transition-transform flex-shrink-0">
                {item.icon}
              </div>
              <div className="flex-grow flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-[#244348]">
                  <span>{item.label}</span>
                  <span className={isWarning ? 'text-[#DC2626] font-bold' : ''}>
                    {displayValue}{item.unit} <span className="font-normal text-[#96A5A8]">/ {item.target}{item.unit}</span>
                  </span>
                </div>
                <div className="w-full h-1.5 bg-[#F0F2F3] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${isWarning ? 'bg-[#DC2626]' : 'bg-[#003139]'}`}
                    style={{ width: `${displayPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
