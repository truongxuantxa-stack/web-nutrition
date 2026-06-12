import {
  Chart as ChartJS,
  TimeScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';
import 'chartjs-adapter-dayjs-4';

ChartJS.register(
  TimeScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Tooltip, 
  Filler, 
  Legend, 
  annotationPlugin
);

export default function WeightTrendChart({ data, range, onRangeChange }) {
  if (!data) return null;

  const {
    rawPoints,
    trendLine,
    ribbonBounds,
    projectionLine,
    breakpoints,
    summary,
    hasSufficientData
  } = data;

  if (!rawPoints || rawPoints.length === 0) {
    return (
      <div className="tcl-card rounded-2xl p-6 h-80 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-[#F0F2F3] flex items-center justify-center mb-4">
          <span className="text-2xl">⚖️</span>
        </div>
        <h3 className="font-semibold text-lg mb-2 text-[#003139]">Chưa có dữ liệu xu hướng</h3>
        <p className="text-sm text-[#96A5A8] max-w-sm">
          Hãy nhập cân nặng liên tục ít nhất 5 ngày để hệ thống có thể phân tích và loại bỏ nhiễu nước, giúp bạn thấy xu hướng thực sự.
        </p>
      </div>
    );
  }

  // --- Process Chart Data ---
  
  // Upper & Lower bounds
  const upperData = ribbonBounds.map(b => ({ x: b.date, y: b.upper }));
  const lowerData = ribbonBounds.map(b => ({ x: b.date, y: b.lower }));
  
  // Trend line
  const emaData = trendLine.map(t => ({ x: t.date, y: t.ema }));
  
  // Raw points
  const rawData = rawPoints.map(r => ({ x: r.date, y: r.weight }));
  
  // Projection line
  const projData = projectionLine ? projectionLine.map(p => ({ x: p.date, y: p.projected })) : [];

  // Determine Ribbon Colors based on direction & goal
  const isGoalGain = summary.goal === 'gain_weight';
  const isDown = summary.direction === 'down';
  const isUp = summary.direction === 'up';
  
  // Good direction: lose_weight + down, OR gain_weight + up
  const isGoodDirection = (isDown && !isGoalGain) || (isUp && isGoalGain);
  const themeColor = isGoodDirection ? '14, 165, 233' : (summary.direction === 'stable' ? '156, 163, 175' : '239, 68, 68'); // sky-500 (good), red-500 (bad), gray-400 (stable)

  const chartDatasets = [
    {
      label: 'Khoảng dao động (Upper)',
      data: upperData,
      borderColor: 'transparent',
      backgroundColor: 'transparent',
      fill: false,
      pointRadius: 0,
      pointHoverRadius: 0,
      tension: 0.4
    },
    {
      label: 'Khoảng dao động (Lower)',
      data: lowerData,
      borderColor: 'transparent',
      backgroundColor: `rgba(${themeColor}, 0.12)`,
      fill: 0, // Fill to dataset 0 (Upper)
      pointRadius: 0,
      pointHoverRadius: 0,
      tension: 0.4
    },
    {
      label: 'Xu hướng (EMA)',
      data: emaData,
      borderColor: `rgb(${themeColor})`,
      borderWidth: 3.5,
      fill: false,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: 0.4
    },
    {
      label: 'Dữ liệu thô',
      data: rawData,
      borderColor: 'rgba(107, 114, 128, 0.3)',
      backgroundColor: 'transparent',
      pointBackgroundColor: 'rgba(107, 114, 128, 0.5)',
      pointBorderColor: 'rgba(107, 114, 128, 0.8)',
      pointBorderWidth: 1,
      borderWidth: 1.5,
      showLine: true,
      borderDash: [3, 3],
      pointRadius: 3,
      pointHoverRadius: 5
    }
  ];

  if (projData.length > 0) {
    chartDatasets.push({
      label: 'Dự đoán',
      data: projData,
      borderColor: `rgba(${themeColor}, 0.5)`,
      borderWidth: 2,
      borderDash: [6, 4],
      fill: false,
      pointRadius: 0,
      tension: 0.1
    });
  }

  // Define Annotations (Goal line & Breakpoints)
  const annotations = {};
  
  if (summary.goalWeight) {
    annotations.goalLine = {
      type: 'line',
      yMin: summary.goalWeight,
      yMax: summary.goalWeight,
      borderColor: 'rgba(156, 163, 175, 0.5)',
      borderWidth: 2,
      borderDash: [4, 4],
      label: {
        display: true,
        content: `Mục tiêu: ${summary.goalWeight} kg`,
        position: 'end',
        backgroundColor: 'rgba(0,0,0,0.5)',
        color: 'white',
        font: { size: 10 }
      }
    };
  }

  if (breakpoints && breakpoints.length > 0) {
    breakpoints.forEach((date, i) => {
      annotations[`break_${i}`] = {
        type: 'line',
        xMin: date,
        xMax: date,
        borderColor: 'rgba(255, 0, 0, 0.3)',
        borderWidth: 1,
        label: {
          display: true,
          content: 'Reset Trend',
          position: 'start',
          backgroundColor: 'transparent',
          color: 'rgba(255, 0, 0, 0.5)',
          font: { size: 10 }
        }
      };
    });
  }

  // Setup X Axis Max based on projection
  let xMax = undefined;
  if (projData.length > 0) {
    xMax = projData[projData.length - 1].x;
  }

  // Calculate suggested Y min/max to ensure nice view
  const allY = [...rawData.map(d=>d.y), ...upperData.map(d=>d.y), ...lowerData.map(d=>d.y)];
  if (summary.goalWeight) allY.push(summary.goalWeight);
  const minY = Math.floor(Math.min(...allY) - 1);
  const maxY = Math.ceil(Math.max(...allY) + 1);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: 'rgba(0,0,0,0.05)',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            if (label.includes('Khoảng dao động')) return null; // Hide ribbon bounds from tooltip
            return `${label}: ${context.raw.y} kg`;
          }
        }
      },
      annotation: {
        annotations
      }
    },
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'day',
          displayFormats: {
            day: 'DD/MM'
          },
          tooltipFormat: 'DD/MM/YYYY'
        },
        max: xMax,
        grid: { display: false, drawBorder: false },
        ticks: { font: { size: 11 }, maxTicksLimit: 7 }
      },
      y: {
        suggestedMin: minY,
        suggestedMax: maxY,
        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
        ticks: { font: { size: 11 }, maxTicksLimit: 6 }
      }
    }
  };

  const tabs = [
    { value: 7, label: '7D' },
    { value: 30, label: '30D' },
    { value: 90, label: '90D' },
    { value: 'all', label: 'Tất cả' }
  ];

  return (
    <div className="tcl-card rounded-2xl flex flex-col h-full overflow-hidden">
      <div className="px-5 pt-5 pb-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-[#96A5A8]">Biểu đồ xu hướng</h3>
          <div
            title="Đường xu hướng (EMA) giúp lọc bỏ các dao động ảo do lượng nước/thức ăn trong ngày, cho bạn thấy lượng mỡ/cơ thực sự đang tăng hay giảm."
            className="w-4 h-4 rounded-full border border-[#DFE3E4] flex items-center justify-center text-[10px] text-[#96A5A8] cursor-help"
          >?</div>
        </div>
        <div className="flex bg-[#F0F2F3] rounded-lg p-1">
          {tabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => onRangeChange(tab.value)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                range === tab.value
                  ? 'bg-[#003139] text-white shadow-sm'
                  : 'text-[#96A5A8] hover:text-[#244348]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-5 pt-2 pb-0 min-h-[250px] relative">
        <Line data={{ datasets: chartDatasets }} options={options} />
      </div>

      {/* Custom Legend */}
      <div className="px-5 pb-4 pt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-[#96A5A8]">
        <div className="flex items-center gap-1.5" title="Các lần bạn nhập cân nặng hằng ngày">
          <span className="w-2 h-2 rounded-full bg-[#96A5A8]"></span>
          <span>Cân thực tế (Răng cưa)</span>
        </div>
        <div className="flex items-center gap-1.5" title="Cân nặng thực sự của bạn sau khi đã lọc nhiễu nước">
          <span className={`w-4 h-1.5 rounded-full ${isGoodDirection ? 'bg-sky-500' : (summary.direction === 'stable' ? 'bg-gray-400' : 'bg-red-500')}`}></span>
          <span className="font-medium text-[#244348]">Xu hướng (Chuẩn)</span>
        </div>
        <div className="flex items-center gap-1.5" title="Nếu cân nặng nằm trong vùng này thì chỉ là do nước, không phải mỡ">
          <span className={`w-4 h-3 rounded-sm ${isGoodDirection ? 'bg-sky-500/20' : (summary.direction === 'stable' ? 'bg-gray-400/20' : 'bg-red-500/20')}`}></span>
          <span>Dao động nước cho phép</span>
        </div>
        {projData.length > 0 && (
          <div className="flex items-center gap-1.5" title="Dự báo cân nặng trong 4 tuần tới">
            <span className={`w-4 h-0 border-b-2 border-dashed ${isGoodDirection ? 'border-sky-500/50' : (summary.direction === 'stable' ? 'border-gray-400/50' : 'border-red-500/50')}`}></span>
            <span>Dự báo tương lai</span>
          </div>
        )}
      </div>
    </div>
  );
}
