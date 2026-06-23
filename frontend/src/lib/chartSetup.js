/**
 * Centralized Chart.js Registration
 * Tất cả Chart.js components được register MỘT LẦN DUY NHẤT ở đây.
 * Không được gọi ChartJS.register() ở bất kỳ file nào khác.
 */
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(
  CategoryScale,
  LinearScale,
  TimeScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Filler,
  Legend,
  annotationPlugin
);

export { ChartJS };
