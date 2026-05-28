'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// utils/date.helper.js
// Tiện ích xử lý ngày tháng dùng chung toàn hệ thống.
// Thay thế các hàm toLocalDateString / toDateString bị duplicate ở 5+ file.
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Chuyển đổi Date object sang chuỗi YYYY-MM-DD theo local timezone.
 * Tránh lệch ngày khi dùng toISOString() (UTC).
 * @param {Date} d
 * @returns {string} YYYY-MM-DD
 */
const toLocalDateString = (d) => {
    const year  = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day   = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Chuẩn hóa đầu vào ngày tháng về chuỗi YYYY-MM-DD.
 * - Nếu không có → trả về ngày hôm nay.
 * - Nếu đã là YYYY-MM-DD hợp lệ → dùng thẳng.
 * - Nếu là Date object hoặc timestamp → parse và format.
 * @param {string|Date|null|undefined} date
 * @returns {string} YYYY-MM-DD
 */
const toDateString = (date) => {
    if (!date) return toLocalDateString(new Date());
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) return date;
    const d = new Date(date);
    if (isNaN(d.getTime())) return toLocalDateString(new Date());
    return toLocalDateString(d);
};

module.exports = { toLocalDateString, toDateString };
