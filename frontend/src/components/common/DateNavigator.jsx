import dayjs from '../../lib/dayjs';
import { getToday, toDisplayDate } from '../../lib/dayjs';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * DateNavigator — component tái sử dụng điều hướng ngày
 * Props:
 *   date: string YYYY-MM-DD
 *   onDateChange: (newDate: string) => void
 */
export default function DateNavigator({ date, onDateChange }) {
  const today = getToday();

  const goPrev = () => onDateChange(dayjs(date).subtract(1, 'day').format('YYYY-MM-DD'));
  const goNext = () => {
    const next = dayjs(date).add(1, 'day').format('YYYY-MM-DD');
    if (next <= today) onDateChange(next);
  };
  const goToday = () => onDateChange(today);

  const isToday = date === today;

  return (
    <div className="flex items-center gap-2">
      <button
        id="date-nav-prev"
        onClick={goPrev}
        className="btn btn-ghost btn-sm btn-square"
        aria-label="Ngày trước"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        id="date-nav-label"
        onClick={goToday}
        className={`btn btn-ghost btn-sm font-medium min-w-32 text-center ${isToday ? 'text-primary' : ''}`}
        title="Về hôm nay"
      >
        {toDisplayDate(date)}
      </button>

      <button
        id="date-nav-next"
        onClick={goNext}
        disabled={isToday}
        className="btn btn-ghost btn-sm btn-square disabled:opacity-30"
        aria-label="Ngày sau"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
