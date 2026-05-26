import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

export default function WeightChart({ chartData = [] }) {
  if (!chartData.length) {
    return (
      <div className="glass-card rounded-3xl">
        <div className="card-body p-5 items-center justify-center h-48">
          <p className="text-base-content/40 text-sm">Chưa có dữ liệu cân nặng</p>
        </div>
      </div>
    );
  }

  const labels  = chartData.map(d => {
    if (!d.date || typeof d.date !== 'string') return '';
    const parts = d.date.split('T')[0].split('-');
    if (parts.length < 3) return d.date;
    const [, m, day] = parts;
    return `${day}/${m}`;
  });
  const weights = chartData.map(d => d.weight);

  const data = {
    labels,
    datasets: [{
      label          : 'Cân nặng (kg)',
      data           : weights,
      borderColor    : '#22c55e',
      backgroundColor: (context) => {
        const { ctx, chartArea } = context.chart;
        if (!chartArea) return 'rgba(34,197,94,0.12)';
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, 'rgba(34,197,94,0.25)');
        gradient.addColorStop(1, 'rgba(34,197,94,0.02)');
        return gradient;
      },
      borderWidth    : 2,
      fill           : true,
      tension        : 0.35,
      pointRadius    : 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#22c55e',
    }],
  };

  const options = {
    responsive         : true,
    maintainAspectRatio: false,
    plugins: {
      legend : { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.raw} kg`,
        },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { display: false }, ticks: { font: { size: 11 } } },
    },
  };

  return (
    <div className="glass-card rounded-3xl">
      <div className="card-body p-5 gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-base-content/50">Cân nặng 7 ngày</h3>
        <div className="h-44">
          <Line data={data} options={options} />
        </div>
      </div>
    </div>
  );
}
