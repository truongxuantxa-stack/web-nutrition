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

  const goPrev   = () => onDateChange(dayjs(date).subtract(1, 'day').format('YYYY-MM-DD'));
  const goNext   = () => {
    const next = dayjs(date).add(1, 'day').format('YYYY-MM-DD');
    if (next <= today) onDateChange(next);
  };
  const goToday  = () => onDateChange(today);
  const isToday  = date === today;

  const btnBase = 'inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#244348] hover:bg-[#F0F2F3] transition-colors disabled:opacity-30';

  return (
    <div className="flex items-center gap-1 bg-[#F0F2F3] rounded-xl p-1">
      <button id="date-nav-prev" onClick={goPrev} className={btnBase} aria-label="Ngày trước">
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        id="date-nav-label"
        onClick={goToday}
        className={`px-3 py-1.5 rounded-lg text-sm font-semibold min-w-32 text-center transition-colors ${
          isToday ? 'bg-[#003139] text-white' : 'text-[#244348] hover:bg-white hover:shadow-sm'
        }`}
        title="Về hôm nay"
      >
        {toDisplayDate(date)}
      </button>

      <button id="date-nav-next" onClick={goNext} disabled={isToday} className={btnBase} aria-label="Ngày sau">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
