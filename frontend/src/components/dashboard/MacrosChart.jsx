import { Doughnut } from 'react-chartjs-2';
// ChartJS đã register tập trung ở main.jsx via chartSetup.js

export default function MacrosChart({ consumed, target }) {
  const protein = consumed?.protein || 0;
  const carbs   = consumed?.carbs   || 0;
  const fat     = consumed?.fat     || 0;

  const chartData = {
    labels  : ['Protein', 'Carbs', 'Fat'],
    datasets: [{
      data           : [protein, carbs, fat],
      backgroundColor: ['#003139', '#C87C46', '#96A5A8'],
      borderColor    : ['#002126', '#A36031', '#7E8D90'],
      borderWidth    : 2,
      hoverOffset    : 4,
    }],
  };

  const options = {
    responsive       : true,
    maintainAspectRatio: false,
    cutout           : '65%',
    plugins: {
      legend: {
        position: 'bottom',
        labels  : {
          boxWidth   : 10,
          padding    : 16,
          font       : { size: 12 },
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.label}: ${ctx.raw}g`,
        },
      },
    },
  };

  // Tính tổng calo tương đương (Protein/Carbs: 4 kcal/g, Fat: 9 kcal/g)
  const proteinKcal = protein * 4;
  const carbsKcal   = carbs   * 4;
  const fatKcal     = fat     * 9;
  const totalKcal   = proteinKcal + carbsKcal + fatKcal || 1;

  const proteinPct = Math.round((proteinKcal / totalKcal) * 100);
  const carbsPct   = Math.round((carbsKcal   / totalKcal) * 100);
  const fatPct     = Math.round((fatKcal     / totalKcal) * 100);

  const macros = [
    { label: 'Protein', pct: proteinPct, val: protein, color: 'text-[#003139]',  dot: 'bg-[#003139]' },
    { label: 'Carbs',   pct: carbsPct,   val: carbs,   color: 'text-[#C87C46]',  dot: 'bg-[#C87C46]' },
    { label: 'Fat',     pct: fatPct,     val: fat,     color: 'text-[#96A5A8]',  dot: 'bg-[#96A5A8]' },
  ];

  return (
    <div className="tcl-card rounded-2xl">
      <div className="p-5 flex flex-col gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[#96A5A8]">🍽️ Tỷ lệ dinh dưỡng</h3>
        <div className="h-48">
          <Doughnut data={chartData} options={options} />
        </div>
        {/* Text summary — hiển thị % thay vì gram để thể hiện cấu trúc bữa ăn */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {macros.map(({ label, pct, val, color, dot }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span className={`font-black text-base ${color}`}>{pct}%</span>
              <span className="text-[#96A5A8]">{val}g</span>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                <p className="text-[#96A5A8]">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
