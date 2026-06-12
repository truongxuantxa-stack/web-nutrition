'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// controllers/report.controller.js
// Điều phối luồng xuất báo cáo PDF
// ═══════════════════════════════════════════════════════════════════════════════

const { getReportData }    = require('../../services/report.service');
const { generateReportPDF, renderAllFooters } = require('../../services/pdf.service');

/**
 * GET /api/report/pdf?range=week|month
 * Tải về file báo cáo PDF dinh dưỡng cá nhân.
 */
const downloadReport = async (req, res) => {
    try {
        const range = ['week', 'month'].includes(req.query.range) ? req.query.range : 'week';
        const userId = req.user.id;

        // 1. Thu thập dữ liệu
        const reportData = await getReportData(userId, range);

        // 2. Tạo tên file
        const rangeLabel = range === 'week' ? '7ngay' : '30ngay';
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const filename = `baocao-dinhduong-${rangeLabel}-${today}.pdf`;

        // 3. Tạo PDF và thu thập vào buffer
        // Lý do dùng buffer thay vì stream: PDFKit với bufferPages=true cần giữ toàn bộ
        // trang trong memory để renderAllFooters dùng switchToPage(). Pipe trực tiếp
        // sẽ flush buffer sớm gây mất nội dung.
        const pdfDoc = await generateReportPDF(reportData);
        
        const chunks = [];
        pdfDoc.on('data', chunk => chunks.push(chunk));
        pdfDoc.on('end', () => {
            const pdfBuffer = Buffer.concat(chunks);
            
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            res.end(pdfBuffer);
        });

        renderAllFooters(pdfDoc);
        pdfDoc.end();

    } catch (err) {
        console.error('[ReportController] Lỗi xuất PDF:', err);
        // Nếu headers chưa gửi → trả JSON error
        if (!res.headersSent) {
            return res.status(500).json({ success: false, message: 'Không thể tạo báo cáo PDF. Vui lòng thử lại.' });
        }
    }
};

module.exports = { downloadReport };
