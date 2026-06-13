import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import dayjs, { getToday } from '../../lib/dayjs';

/**
 * WeeklyCalendarStrip — Lịch tuần 7 ngày (Thứ 2 - Chủ Nhật)
 * Props:
 *   date: string YYYY-MM-DD
 *   onDateChange: (newDate: string) => void
 */
export default function WeeklyCalendarStrip({ date, onDateChange }) {
  const today = getToday();
  const selected = dayjs(date);
  
  // Tìm Thứ 2 của tuần chứa ngày đang chọn
  const dayOfWeek = selected.day(); // 0 (CN) - 6 (T7)
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = selected.add(diffToMonday, 'day');
  
  // Tạo danh sách 7 ngày từ T2 đến CN
  const days = Array.from({ length: 7 }, (_, i) => monday.add(i, 'day'));
  
  const goPrevWeek = () => {
    onDateChange(selected.subtract(1, 'week').format('YYYY-MM-DD'));
  };
  
  const goNextWeek = () => {
    const nextWeek = selected.add(1, 'week');
    if (nextWeek.isAfter(dayjs(today))) {
      onDateChange(today);
    } else {
      onDateChange(nextWeek.format('YYYY-MM-DD'));
    }
  };
  
  const handleDayClick = (day) => {
    const dayStr = day.format('YYYY-MM-DD');
    if (day.isAfter(dayjs(today))) return; // Khóa ngày tương lai
    onDateChange(dayStr);
  };
  
  const dayNamesVi = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  
  // Định dạng hiển thị Tháng và Năm, ví dụ: "Tháng 05, 2026"
  const monthYearLabel = selected.format('[Tháng] MM, YYYY');
  
  return (
    <div className="tcl-card p-5 flex flex-col gap-3">
      {/* Header của lịch tuần */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#003139]" />
          <span className="text-sm font-bold text-[#244348]">{monthYearLabel}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={goPrevWeek}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#244348] hover:bg-[#F0F2F3] transition-colors"
            title="Tuần trước"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDateChange(today)}
            disabled={date === today}
            className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#244348] hover:bg-[#F0F2F3] rounded-lg disabled:opacity-20 transition-colors"
          >
            Hôm nay
          </button>

          <button
            onClick={goNextWeek}
            disabled={selected.endOf('week').isAfter(dayjs(today)) || selected.format('YYYY-MM-DD') === today}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#244348] hover:bg-[#F0F2F3] disabled:opacity-20 transition-colors"
            title="Tuần sau"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* 7 ngày trong tuần */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((day) => {
          const dayStr    = day.format('YYYY-MM-DD');
          const isSelected = dayStr === date;
          const isToday   = dayStr === today;
          const isFuture  = day.isAfter(dayjs(today));
          const dayName   = dayNamesVi[day.day()];
          const dayNum    = day.date();

          return (
            <button
              key={dayStr}
              onClick={() => handleDayClick(day)}
              disabled={isFuture}
              className={`flex flex-col items-center justify-center py-2 sm:py-3 rounded-2xl transition-all duration-300 relative ${
                isSelected
                  ? 'bg-[#003139] text-white shadow-lg shadow-[#003139]/20 scale-105 z-10'
                  : isFuture
                  ? 'opacity-25 cursor-not-allowed text-[#96A5A8]'
                  : 'hover:bg-[#F0F2F3] active:scale-95 text-[#244348]'
              }`}
            >
              {/* Tên thứ */}
              <span className={`text-[9px] font-bold uppercase tracking-wider ${
                isSelected ? 'text-white/80' : isToday ? 'text-[#2EA850]' : 'text-[#96A5A8]'
              }`}>
                {dayName}
              </span>

              {/* Số ngày */}
              <span className={`text-sm sm:text-base font-black mt-0.5 sm:mt-1 ${
                isSelected ? 'text-white' : 'text-[#003139]'
              }`}>
                {dayNum}
              </span>

              {/* Dấu chấm tròn biểu thị ngày hiện tại */}
              {isToday && !isSelected && (
                <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-[#2EA850] animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
