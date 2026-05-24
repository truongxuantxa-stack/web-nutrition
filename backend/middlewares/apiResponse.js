/**
 * Middleware chuẩn hóa API response.
 * Gắn res.success(), res.error(), res.validationError() cho mọi request đi qua /api/*.
 */
module.exports = (req, res, next) => {
    /**
     * Trả response thành công.
     * @param {*} data - Dữ liệu trả về (null nếu không có)
     * @param {string} message - Thông báo thành công
     */
    res.success = (data = null, message = '') => {
        return res.json({ success: true, data, message });
    };

    /**
     * Trả response lỗi.
     * @param {string} message - Thông báo lỗi
     * @param {number} statusCode - HTTP status code (default 400)
     */
    res.error = (message = 'Có lỗi xảy ra.', statusCode = 400) => {
        return res.status(statusCode).json({ success: false, message });
    };

    /**
     * Trả lỗi validation chi tiết theo từng field.
     * @param {Array} errors - Mảng [{ field, msg }]
     */
    res.validationError = (errors) => {
        return res.status(422).json({
            success: false,
            message: 'Dữ liệu không hợp lệ.',
            errors, // [{ field: 'email', msg: '...' }, ...]
        });
    };

    next();
};
