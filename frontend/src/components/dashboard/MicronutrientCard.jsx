import React from 'react';

export default function MicronutrientCard({ consumed, gender }) {
  // RDI dựa trên giới tính/tuổi (lấy từ WHO/IOM)
  const isMale = gender === 'male';
  
  const rdi = {
    fiber: isMale ? 38 : 25,
    vitaminA: isMale ? 900 : 700,
    vitaminC: isMale ? 90 : 75,
    calcium: 1000,
    iron: isMale ? 8 : 18,
    sodium: 2300, // < 2300
    sugar: isMale ? 36 : 25, // < 36 (Nam) / < 25 (Nữ)
  };

  const data = [
    { key: 'fiber', label: 'Chất xơ', value: consumed?.fiber || 0, target: rdi.fiber, unit: 'g', icon: '🥦', color: 'bg-emerald-500' },
    { key: 'vitaminA', label: 'Vitamin A', value: consumed?.vitaminA || 0, target: rdi.vitaminA, unit: 'µg', icon: '🥕', color: 'bg-orange-500' },
    { key: 'vitaminC', label: 'Vitamin C', value: consumed?.vitaminC || 0, target: rdi.vitaminC, unit: 'mg', icon: '🍊', color: 'bg-yellow-500' },
    { key: 'calcium', label: 'Canxi', value: consumed?.calcium || 0, target: rdi.calcium, unit: 'mg', icon: '🥛', color: 'bg-blue-400' },
    { key: 'iron', label: 'Sắt', value: consumed?.iron || 0, target: rdi.iron, unit: 'mg', icon: '🥩', color: 'bg-red-500' },
    { key: 'sodium', label: 'Natri', value: consumed?.sodium || 0, target: rdi.sodium, unit: 'mg', icon: '🧂', color: 'bg-purple-500', reverse: true },
    { key: 'sugar', label: 'Đường', value: consumed?.sugar || 0, target: rdi.sugar, unit: 'g', icon: '🍬', color: 'bg-pink-500', reverse: true },
  ];

  return (
    <div className="glass-card rounded-3xl flex flex-col p-6 gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">✨</span>
          <h3 className="font-bold text-base-content/90">Vi chất hôm nay</h3>
        </div>
      </div>
      <div className="flex flex-col gap-3.5 mt-1">
        {data.map((item) => {
          const percent = item.target > 0 ? Math.round((item.value / item.target) * 100) : 0;
          const displayPercent = Math.min(percent, 100);
          
          // Với Natri và Đường, vượt 100% là cảnh báo (vượt mức cho phép)
          const isWarning = item.reverse && (item.value > item.target);
          
          return (
            <div key={item.key} className="flex items-center gap-3 text-sm group">
              <div className="w-7 h-7 rounded-full bg-base-200 flex items-center justify-center text-sm shadow-sm group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <div className="flex-grow flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-xs font-semibold text-base-content/80">
                  <span>{item.label}</span>
                  <span className={isWarning ? 'text-error font-bold' : ''}>
                    {item.value}{item.unit} <span className="font-normal opacity-50">/ {item.target}{item.unit}</span>
                  </span>
                </div>
                <div className="w-full h-1.5 bg-base-300 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${isWarning ? 'bg-error' : item.color}`}
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
