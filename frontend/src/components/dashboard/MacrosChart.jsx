import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

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

  return (
    <div className="tcl-card rounded-2xl">
      <div className="p-5 flex flex-col gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[#96A5A8]">🍽️ Tỷ lệ dinh dưỡng</h3>
        <div className="h-48">
          <Doughnut id="macros-chart" data={chartData} options={options} />
        </div>
        {/* Text summary */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {[
            { label: 'Protein', val: protein, goal: target?.protein, color: 'text-[#003139]' },
            { label: 'Carbs',   val: carbs,   goal: target?.carbs,   color: 'text-[#003139]' },
            { label: 'Fat',     val: fat,     goal: target?.fat,     color: 'text-[#003139]' },
          ].map(({ label, val, goal, color }) => (
            <div key={label}>
              <span className={`font-bold ${color}`}>{val}g</span>
              {goal != null && (
                <span className="text-[#96A5A8]"> /{goal}g</span>
              )}
              <p className="text-[#96A5A8]">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
