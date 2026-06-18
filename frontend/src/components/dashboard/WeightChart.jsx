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
      <div className="tcl-card rounded-2xl">
        <div className="p-5 flex items-center justify-center h-48">
          <p className="text-[#96A5A8] text-sm">Chưa có dữ liệu cân nặng</p>
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
      borderColor    : '#2EA850',
      backgroundColor: (context) => {
        const { ctx, chartArea } = context.chart;
        if (!chartArea) return 'rgba(46,168,80,0.12)';
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, 'rgba(46,168,80,0.15)');
        gradient.addColorStop(1, 'rgba(46,168,80,0.02)');
        return gradient;
      },
      borderWidth    : 2,
      fill           : true,
      tension        : 0.35,
      pointRadius    : 4,
      pointHoverRadius: 6,
      pointBackgroundColor: '#2EA850',
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
      x: { grid: { display: true, color: '#F0F2F3' }, ticks: { font: { size: 11 } } },
      y: { grid: { display: true, color: '#F0F2F3' }, ticks: { font: { size: 11 } } },
    },
  };

  return (
    <div className="tcl-card rounded-2xl">
      <div className="p-5 flex flex-col gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[#96A5A8]">⚖️ Cân nặng {chartData.length} ngày</h3>
        <div className="h-44">
          <Line id="weight-chart" data={data} options={options} />
        </div>
      </div>
    </div>
  );
}
