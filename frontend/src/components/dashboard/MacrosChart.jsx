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
      backgroundColor: ['#3b82f6', '#f59e0b', '#ec4899'],
      borderColor    : ['#2563eb', '#d97706', '#db2777'],
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
    <div className="glass-card rounded-3xl">
      <div className="card-body p-5 gap-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-base-content/50">Macros</h3>
        <div className="h-48">
          <Doughnut data={chartData} options={options} />
        </div>
        {/* Text summary */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          {[
            { label: 'Protein', val: protein, goal: target?.protein, color: 'text-blue-500' },
            { label: 'Carbs',   val: carbs,   goal: target?.carbs,   color: 'text-amber-500' },
            { label: 'Fat',     val: fat,     goal: target?.fat,     color: 'text-pink-500' },
          ].map(({ label, val, goal, color }) => (
            <div key={label}>
              <span className={`font-bold ${color}`}>{val}g</span>
              {goal != null && (
                <span className="text-base-content/40"> /{goal}g</span>
              )}
              <p className="text-base-content/50">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
