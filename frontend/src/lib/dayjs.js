import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.locale('vi');
dayjs.extend(relativeTime);

/**
 * Trả về ngày hôm nay theo local timezone dạng YYYY-MM-DD
 */
export const getToday = () => {
  const d = new Date();
  const year  = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day   = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Chuyển date về chuỗi YYYY-MM-DD cho API query
 */
export const toDateString = (date) => {
  if (!date) return getToday();
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
  return dayjs(date).format('YYYY-MM-DD');
};

/**
 * Hiển thị smart label: "Hôm nay", "Hôm qua", hoặc DD/MM/YYYY
 */
export const toDisplayDate = (dateStr) => {
  const today     = getToday();
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');

  if (dateStr === today)     return 'Hôm nay';
  if (dateStr === yesterday) return 'Hôm qua';
  return dayjs(dateStr).format('DD/MM/YYYY');
};

export default dayjs;
