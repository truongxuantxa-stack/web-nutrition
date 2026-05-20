'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// services/pdf.service.js
// PDFKit rendering engine — Xuất báo cáo dinh dưỡng PDF chuyên nghiệp
// ═══════════════════════════════════════════════════════════════════════════════

const PDFDocument = require('pdfkit');
const path = require('path');

// ── Đường dẫn font ───────────────────────────────────────────────────────────
const FONT_REGULAR = path.join(__dirname, '../public/fonts/Roboto-Regular.ttf');
const FONT_BOLD    = path.join(__dirname, '../public/fonts/Roboto-Bold.ttf');

// ── Bảng màu Green/Health ────────────────────────────────────────────────────
const COLORS = {
    primary:    '#10B981', // Emerald-500
    dark:       '#065F46', // Header dark
    light:      '#F0FDF4', // Green-50
    gray:       '#6B7280', // Gray-500
    grayLight:  '#D1D5DB', // Gray-300
    zebraRow:   '#F9FAFB', // Gray-50
    white:      '#FFFFFF',
    black:      '#111827',
    accent:     '#059669', // Emerald-600
};

const PAGE_MARGIN = 50;
const LINE_GAP    = 1.4;

/**
 * Helper: Vẽ đường kẻ ngang.
 */
const drawHRule = (doc, y, color = COLORS.grayLight) => {
    doc.save()
       .moveTo(PAGE_MARGIN, y)
       .lineTo(doc.page.width - PAGE_MARGIN, y)
       .strokeColor(color)
       .lineWidth(0.5)
       .stroke()
       .restore();
};

/**
 * Helper: Vẽ một hàng trong bảng 2 cột (label | value).
 */
const drawInfoRow = (doc, x, y, label, value, isZebra = false) => {
    const rowH = 20;
    const colW = (doc.page.width - PAGE_MARGIN * 2) / 2;

    if (isZebra) {
        doc.save()
           .rect(PAGE_MARGIN, y, doc.page.width - PAGE_MARGIN * 2, rowH)
           .fillColor(COLORS.zebraRow)
           .fill()
           .restore();
    }

    doc.font(FONT_REGULAR).fontSize(9).fillColor(COLORS.gray)
       .text(label, PAGE_MARGIN + 6, y + 5, { width: colW - 10 });

    doc.font(FONT_BOLD).fontSize(9).fillColor(COLORS.black)
       .text(String(value), PAGE_MARGIN + colW + 6, y + 5, { width: colW - 10 });
};

/**
 * Helper: Vẽ tiêu đề section.
 */
const drawSectionTitle = (doc, title, y) => {
    doc.save()
       .rect(PAGE_MARGIN, y, doc.page.width - PAGE_MARGIN * 2, 22)
       .fillColor(COLORS.dark)
       .fill()
       .restore();

    doc.font(FONT_BOLD).fontSize(10).fillColor(COLORS.white)
       .text(title, PAGE_MARGIN + 8, y + 6, { width: doc.page.width - PAGE_MARGIN * 2 - 16 });

    return y + 22;
};

/**
 * Helper: Vẽ footer mỗi trang.
 */
const drawFooter = (doc, pageNum, totalPages) => {
    const y = doc.page.height - 35;
    const width = doc.page.width - PAGE_MARGIN * 2;

    drawHRule(doc, y - 5);

    doc.font(FONT_REGULAR).fontSize(8).fillColor(COLORS.gray)
       .text('NMS — Hệ thống Quản lý Dinh dưỡng', PAGE_MARGIN, y + 2, { width, align: 'left', lineBreak: false })
       .text(
           `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}   |   Trang ${pageNum}/${totalPages}`,
           PAGE_MARGIN, y + 2, { width, align: 'right', lineBreak: false }
       );
};

/**
 * Helper: Kiểm tra và ngắt trang tự động nếu y vượt quá giới hạn
 */
const checkPageBreak = (doc, currentY, requiredHeight) => {
    if (currentY + requiredHeight > doc.page.height - PAGE_MARGIN - 40) {
        doc.addPage();
        return PAGE_MARGIN;
    }
    return currentY;
};

/**
 * Helper: Vẽ header trang 1.
 */
const drawCoverHeader = (doc, period) => {
    // Nền header
    doc.save()
       .rect(0, 0, doc.page.width, 90)
       .fillColor(COLORS.dark)
       .fill()
       .restore();

    doc.font(FONT_BOLD).fontSize(22).fillColor(COLORS.white)
       .text('BÁO CÁO DINH DƯỠNG', PAGE_MARGIN, 22, {
           width: doc.page.width - PAGE_MARGIN * 2,
           align: 'center',
       });

    doc.font(FONT_REGULAR).fontSize(11).fillColor('#A7F3D0')
       .text(`📊  ${period.rangeLabel}  •  ${period.label}`, PAGE_MARGIN, 52, {
           width: doc.page.width - PAGE_MARGIN * 2,
           align: 'center',
       });
};

// ──────────────────────────────────────────────────────────────────────────────
// Hàm chính: Tạo PDFDocument và stream về
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Tạo báo cáo PDF từ reportData.
 * @param {Object} reportData - Dữ liệu từ report.service.js
 * @returns {PDFDocument} Stream PDF
 */
const generateReportPDF = (reportData) => {
    const { user, period, metrics, dailyLog, summary, isEmpty } = reportData;

    const doc = new PDFDocument({
        size: 'A4',
        margins: { top: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN, bottom: 20 },
        bufferPages: true, // Cho phép sửa các trang cũ để vẽ footer sau cùng
        info: {
            Title:   `Báo cáo dinh dưỡng — ${period.label}`,
            Author:  'NMS — Nutrition Management System',
            Subject: 'Báo cáo dinh dưỡng cá nhân',
        },
    });

    // Register fonts
    doc.registerFont('Regular', FONT_REGULAR);
    doc.registerFont('Bold',    FONT_BOLD);

    // ═══════════════════════════════════════════════════════════════════════
    // TRANG 1: Cover + Thông Tin Cá Nhân
    // ═══════════════════════════════════════════════════════════════════════
    drawCoverHeader(doc, period);

    let y = 110;

    // ── Section: Thông tin cá nhân ──────────────────────────────────────
    y = drawSectionTitle(doc, '👤  THÔNG TIN CÁ NHÂN', y);

    const profileRows = [
        ['Họ và tên',   user.fullName],
        ['Email',       user.email || '–'],
        ['Giới tính',   user.gender],
        ['Tuổi',        user.age !== '–' ? `${user.age} tuổi` : '–'],
        ['Chiều cao',   user.height !== '–' ? `${user.height} cm` : '–'],
        ['Cân nặng',    user.weight !== '–' ? `${user.weight} kg` : '–'],
        ['Mục tiêu',    user.goal],
    ];

    profileRows.forEach((row, i) => {
        y = checkPageBreak(doc, y, 20);
        drawInfoRow(doc, PAGE_MARGIN, y, row[0], row[1], i % 2 === 0);
        y += 20;
    });

    y += 12;

    // ── Section: Chỉ số sức khỏe ────────────────────────────────────────
    y = drawSectionTitle(doc, '📊  CHỈ SỐ SỨC KHỎE', y);

    const metricsRows = [
        ['BMI',                       metrics.bmi ? `${metrics.bmi}  (${metrics.bmiClass})` : '–'],
        ['BMR (Trao đổi chất nền)',    metrics.bmr ? `${metrics.bmr} kcal/ngày` : '–'],
        ['TDEE (Năng lượng tiêu hao)', metrics.tdee ? `${metrics.tdee} kcal/ngày` : '–'],
        ['Mục tiêu calo/ngày',        metrics.targetCalories ? `${metrics.targetCalories} kcal` : '–'],
        ['Protein mục tiêu',          metrics.macros?.protein ? `${metrics.macros.protein} g/ngày (${metrics.macroRatios?.protein || 30}%)` : '–'],
        ['Carbs mục tiêu',            metrics.macros?.carbs ? `${metrics.macros.carbs} g/ngày (${metrics.macroRatios?.carbs || 40}%)` : '–'],
        ['Fat mục tiêu',              metrics.macros?.fat ? `${metrics.macros.fat} g/ngày (${metrics.macroRatios?.fat || 30}%)` : '–'],
        ['Nước uống mục tiêu',        metrics.waterGoal ? `${metrics.waterGoal} ml/ngày` : '–'],
    ];

    metricsRows.forEach((row, i) => {
        y = checkPageBreak(doc, y, 20);
        drawInfoRow(doc, PAGE_MARGIN, y, row[0], row[1], i % 2 === 0);
        y += 20;
    });

    // ═══════════════════════════════════════════════════════════════════════
    // TRANG 2: Tổng Hợp & Đánh Giá
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage();

    y = PAGE_MARGIN;

    // ── Tiêu đề trang 2 ──────────────────────────────────────────────────
    doc.font(FONT_BOLD).fontSize(14).fillColor(COLORS.dark)
       .text('TỔNG HỢP & ĐÁNH GIÁ', PAGE_MARGIN, y, {
           width: doc.page.width - PAGE_MARGIN * 2,
       });
    y += 20;

    doc.font(FONT_REGULAR).fontSize(9).fillColor(COLORS.gray)
       .text(`Kỳ báo cáo: ${period.label}  •  ${period.rangeLabel}`, PAGE_MARGIN, y);
    y += 18;
    drawHRule(doc, y);
    y += 12;

    if (isEmpty) {
        // ── Empty State ──────────────────────────────────────────────────
        doc.save()
           .rect(PAGE_MARGIN, y, doc.page.width - PAGE_MARGIN * 2, 60)
           .fillColor(COLORS.light)
           .roundedRect(PAGE_MARGIN, y, doc.page.width - PAGE_MARGIN * 2, 60, 6)
           .fill()
           .restore();

        doc.font(FONT_BOLD).fontSize(11).fillColor(COLORS.gray)
           .text('Chưa có dữ liệu nhật ký trong khoảng thời gian này.', PAGE_MARGIN + 10, y + 12, {
               width: doc.page.width - PAGE_MARGIN * 2 - 20,
               align: 'center',
           });

        doc.font(FONT_REGULAR).fontSize(9).fillColor(COLORS.gray)
           .text('Hãy bắt đầu ghi nhật ký ăn uống hàng ngày để theo dõi tiến độ sức khỏe của bạn.', PAGE_MARGIN + 10, y + 30, {
               width: doc.page.width - PAGE_MARGIN * 2 - 20,
               align: 'center',
           });

        // Render footers for empty state
        renderAllFooters(doc);
        doc.end();
        return doc;
    }

    // ── Section: Trung bình mỗi ngày ────────────────────────────────────
    y = drawSectionTitle(doc, '📅  TRUNG BÌNH MỖI NGÀY', y);

    const avgRows = [
        ['Calories nạp vào', `${summary.avgCalories} kcal`],
        ['Protein',          `${summary.avgProtein} g`],
        ['Carbohydrate',     `${summary.avgCarbs} g`],
        ['Chất béo (Fat)',   `${summary.avgFat} g`],
        ['Nước uống',        `${summary.avgWater} ml`],
        ['Số ngày có dữ liệu', `${summary.daysWithData} / ${period.totalDays} ngày`],
    ];

    avgRows.forEach((row, i) => {
        y = checkPageBreak(doc, y, 20);
        drawInfoRow(doc, PAGE_MARGIN, y, row[0], row[1], i % 2 === 0);
        y += 20;
    });
    y += 10;

    // ── Section: So sánh với mục tiêu ───────────────────────────────────
    y = drawSectionTitle(doc, '🎯  SO SÁNH VỚI MỤC TIÊU', y);

    const targetRows = [
        ['Mục tiêu calo',   `${metrics.targetCalories || '–'} kcal`,  `${summary.avgCalories} kcal`],
        ['Protein',         `${metrics.macros?.protein || '–'} g`,     `${summary.avgProtein} g`],
        ['Carbs',           `${metrics.macros?.carbs || '–'} g`,       `${summary.avgCarbs} g`],
        ['Fat',             `${metrics.macros?.fat || '–'} g`,         `${summary.avgFat} g`],
        ['Nước uống',       `${metrics.waterGoal || '–'} ml`,          `${summary.avgWater} ml`],
    ];

    // Header bảng so sánh
    const colW3 = (doc.page.width - PAGE_MARGIN * 2) / 3;
    doc.save()
       .rect(PAGE_MARGIN, y, doc.page.width - PAGE_MARGIN * 2, 18)
       .fillColor(COLORS.light)
       .fill()
       .restore();

    doc.font(FONT_BOLD).fontSize(8).fillColor(COLORS.accent)
       .text('Chỉ số',     PAGE_MARGIN + 6, y + 5, { width: colW3 - 10 })
       .text('Mục tiêu',   PAGE_MARGIN + colW3 + 6, y + 5, { width: colW3 - 10 })
       .text('Trung bình thực tế', PAGE_MARGIN + colW3 * 2 + 6, y + 5, { width: colW3 - 10 });
    y += 18;

    targetRows.forEach((row, i) => {
        y = checkPageBreak(doc, y, 18);
        if (i % 2 === 0) {
            doc.save()
               .rect(PAGE_MARGIN, y, doc.page.width - PAGE_MARGIN * 2, 18)
               .fillColor(COLORS.zebraRow)
               .fill()
               .restore();
        }
        doc.font(FONT_REGULAR).fontSize(8).fillColor(COLORS.gray)
           .text(row[0], PAGE_MARGIN + 6, y + 5, { width: colW3 - 10 });
        doc.font(FONT_BOLD).fontSize(8).fillColor(COLORS.black)
           .text(row[1], PAGE_MARGIN + colW3 + 6, y + 5, { width: colW3 - 10 });
        doc.font(FONT_BOLD).fontSize(8).fillColor(COLORS.accent)
           .text(row[2], PAGE_MARGIN + colW3 * 2 + 6, y + 5, { width: colW3 - 10 });
        y += 18;
    });
    y += 10;

    // ── Section: Nhận xét & Đánh giá ───────────────────────────────────
    y = drawSectionTitle(doc, '💬  NHẬN XÉT & ĐÁNH GIÁ', y);
    y += 8;

    const insights = buildInsights(summary, metrics, period);
    insights.forEach((line, i) => {
        const requiredHeight = doc.heightOfString(line, { width: doc.page.width - PAGE_MARGIN * 2 - 12 }) + 10;
        y = checkPageBreak(doc, y, requiredHeight);
        
        doc.font(FONT_REGULAR).fontSize(9).fillColor(COLORS.black)
           .text(line, PAGE_MARGIN + 6, y, {
               width: doc.page.width - PAGE_MARGIN * 2 - 12,
               lineGap: 2,
           });
        y += requiredHeight;
    });

    // ── Section: Cân nặng & Vận động ────────────────────────────────────
    y += 6;
    y = checkPageBreak(doc, y, 150); // Đảm bảo đủ chỗ cho nguyên bảng cân nặng
    y = drawSectionTitle(doc, '⚖️  CÂN NẶNG & VẬN ĐỘNG', y);

    const bodyRows = [
        ['Cân nặng đầu kỳ', summary.weightStart ? `${summary.weightStart} kg` : 'Chưa có dữ liệu'],
        ['Cân nặng cuối kỳ', summary.weightEnd ? `${summary.weightEnd} kg` : 'Chưa có dữ liệu'],
        ['Thay đổi cân nặng', summary.weightDelta !== null
            ? `${summary.weightDelta > 0 ? '+' : ''}${summary.weightDelta} kg`
            : 'Không đủ dữ liệu'],
        ['Tổng calo đốt (tập luyện)', `${summary.totalExerciseCalories} kcal`],
        ['Tỷ lệ tuân thủ calo', `${summary.calorieCompliance}%  (${Math.round(summary.daysWithData * summary.calorieCompliance / 100)} / ${summary.daysWithData} ngày đạt ±10%)`],
    ];

    bodyRows.forEach((row, i) => {
        y = checkPageBreak(doc, y, 20);
        drawInfoRow(doc, PAGE_MARGIN, y, row[0], row[1], i % 2 === 0);
        y += 20;
    });

    // ═══════════════════════════════════════════════════════════════════════
    // TRANG 3: Bảng Chi Tiết Theo Ngày
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage();

    y = PAGE_MARGIN;

    doc.font(FONT_BOLD).fontSize(14).fillColor(COLORS.dark)
       .text('CHI TIẾT THEO NGÀY', PAGE_MARGIN, y, {
           width: doc.page.width - PAGE_MARGIN * 2,
       });
    y += 20;

    doc.font(FONT_REGULAR).fontSize(9).fillColor(COLORS.gray)
       .text(`Kỳ báo cáo: ${period.label}`, PAGE_MARGIN, y);
    y += 16;
    drawHRule(doc, y);
    y += 10;

    // ── Bảng chi tiết ngày ───────────────────────────────────────────────
    const cols = [
        { label: 'Ngày',       width: 48 },
        { label: 'Calories',   width: 66 },
        { label: 'Protein (g)',width: 66 },
        { label: 'Carbs (g)',  width: 66 },
        { label: 'Fat (g)',    width: 55 },
        { label: 'Nước (ml)',  width: 65 },
        { label: 'Tập (kcal)',  width: 64 },
    ];

    const tableWidth = doc.page.width - PAGE_MARGIN * 2;

    // Hàm vẽ header bảng chi tiết (dùng lại khi sang trang mới)
    const drawTableHeader = (startY) => {
        doc.save()
           .rect(PAGE_MARGIN, startY, tableWidth, 20)
           .fillColor(COLORS.dark)
           .fill()
           .restore();
           
        let currentX = PAGE_MARGIN;
        cols.forEach(col => {
            doc.font(FONT_BOLD).fontSize(8).fillColor(COLORS.white)
               .text(col.label, currentX + 4, startY + 6, { width: col.width - 8 });
            currentX += col.width;
        });
        return startY + 20;
    };

    y = drawTableHeader(y);

    // Rows
    const allRows = [...dailyLog];

    if (allRows.length === 0) {
        doc.save()
           .rect(PAGE_MARGIN, y, tableWidth, 20)
           .fillColor(COLORS.zebraRow)
           .fill()
           .restore();
        doc.font(FONT_REGULAR).fontSize(9).fillColor(COLORS.gray)
           .text('Chưa có dữ liệu', PAGE_MARGIN + 6, y + 6, { width: tableWidth - 12 });
        y += 20;
    } else {
        allRows.forEach((row, i) => {
            // Kiểm tra ngắt trang cho từng hàng
            if (y + 18 > doc.page.height - PAGE_MARGIN - 40) {
                doc.addPage();
                y = drawTableHeader(PAGE_MARGIN); // Vẽ lại header ở trang mới
            }

            if (i % 2 === 0) {
                doc.save()
                   .rect(PAGE_MARGIN, y, tableWidth, 18)
                   .fillColor(COLORS.zebraRow)
                   .fill()
                   .restore();
            }

            const rowData = [
                row.dateFormatted,
                row.calories,
                row.protein,
                row.carbs,
                row.fat,
                row.water,
                row.exerciseBurned,
            ];

            let cx = PAGE_MARGIN;
            rowData.forEach((val, j) => {
                doc.font(FONT_REGULAR).fontSize(8).fillColor(COLORS.black)
                   .text(String(val), cx + 4, y + 5, { width: cols[j].width - 8 });
                cx += cols[j].width;
            });
            y += 18;
        });

        y = checkPageBreak(doc, y, 20);
        
        // Hàng trung bình
        doc.save()
           .rect(PAGE_MARGIN, y, tableWidth, 20)
           .fillColor(COLORS.primary)
           .fill()
           .restore();

        const avgData = [
            'Trung bình',
            summary.avgCalories,
            summary.avgProtein,
            summary.avgCarbs,
            summary.avgFat,
            summary.avgWater,
            Math.round(summary.totalExerciseCalories / (summary.daysWithData || 1)),
        ];

        let cx = PAGE_MARGIN;
        avgData.forEach((val, j) => {
            doc.font(FONT_BOLD).fontSize(8).fillColor(COLORS.white)
               .text(String(val), cx + 4, y + 6, { width: cols[j].width - 8 });
            cx += cols[j].width;
        });
        y += 20;
    }

    renderAllFooters(doc);
    doc.end();
    return doc;
};

/**
 * Hàm hỗ trợ vẽ footer lên TẤT CẢ các trang đã được buffer.
 */
function renderAllFooters(doc) {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        drawFooter(doc, i + 1, range.count);
    }
}

/**
 * Tạo các câu nhận xét tự động dựa trên dữ liệu tổng hợp.
 */
const buildInsights = (summary, metrics, period) => {
    const lines = [];
    const target = metrics.targetCalories;

    // Nhận xét compliance
    if (summary.calorieCompliance >= 70) {
        lines.push(`✅ Tuân thủ calo tốt: Bạn đạt mục tiêu calo (±10%) trong ${summary.calorieCompliance}% số ngày có ghi chép. Tiếp tục duy trì nhé!`);
    } else if (summary.calorieCompliance >= 40) {
        lines.push(`⚡ Tuân thủ calo ở mức trung bình (${summary.calorieCompliance}%). Hãy cố gắng ghi chép đều đặn hơn và bám sát mục tiêu hàng ngày.`);
    } else {
        lines.push(`⚠️ Tỷ lệ tuân thủ calo còn thấp (${summary.calorieCompliance}%). Hãy kiên trì ghi nhật ký mỗi ngày để hệ thống đưa ra gợi ý chính xác hơn.`);
    }

    // Nhận xét calo trung bình vs target
    if (target) {
        const diff = summary.avgCalories - target;
        if (Math.abs(diff) <= target * 0.1) {
            lines.push(`✅ Calo trung bình (${summary.avgCalories} kcal) rất gần mục tiêu (${target} kcal). Bạn đang làm rất tốt!`);
        } else if (diff > 0) {
            lines.push(`⚠️ Calo trung bình cao hơn mục tiêu ${diff} kcal/ngày. Hãy xem lại khẩu phần ăn, đặc biệt là chất béo và tinh bột.`);
        } else {
            lines.push(`ℹ️ Calo trung bình thấp hơn mục tiêu ${Math.abs(diff)} kcal/ngày. Đảm bảo cơ thể được cung cấp đủ năng lượng để hoạt động hiệu quả.`);
        }
    }

    // Nhận xét cân nặng
    if (summary.weightDelta !== null) {
        const deltaAbs = Math.abs(summary.weightDelta);
        if (summary.weightDelta < 0) {
            lines.push(`📉 Cân nặng giảm ${deltaAbs} kg trong ${period.totalDays} ngày (${summary.weightStart} → ${summary.weightEnd} kg).`);
        } else if (summary.weightDelta > 0) {
            lines.push(`📈 Cân nặng tăng ${deltaAbs} kg trong ${period.totalDays} ngày (${summary.weightStart} → ${summary.weightEnd} kg).`);
        } else {
            lines.push(`⚖️ Cân nặng ổn định trong kỳ báo cáo (${summary.weightStart} kg). Duy trì tốt!`);
        }
    } else {
        lines.push(`ℹ️ Chưa có đủ dữ liệu cân nặng để đánh giá xu hướng. Hãy cân và ghi lại đều đặn mỗi sáng.`);
    }

    // Nhận xét nước uống
    if (metrics.waterGoal && summary.avgWater > 0) {
        const waterPct = Math.round((summary.avgWater / metrics.waterGoal) * 100);
        if (waterPct >= 90) {
            lines.push(`💧 Nước uống trung bình tốt: ${summary.avgWater} ml/ngày (${waterPct}% mục tiêu). Duy trì thói quen uống nước đều đặn!`);
        } else {
            lines.push(`💧 Nước uống trung bình còn thấp: ${summary.avgWater} ml/ngày (chỉ ${waterPct}% mục tiêu ${metrics.waterGoal} ml). Hãy uống nước thường xuyên hơn.`);
        }
    }

    return lines;
};

module.exports = { generateReportPDF };
