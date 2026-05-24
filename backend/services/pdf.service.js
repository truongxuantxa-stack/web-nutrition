'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// services/pdf.service.js
// PDFKit rendering engine — Xuất báo cáo dinh dưỡng PDF chuyên nghiệp
// ═══════════════════════════════════════════════════════════════════════════════

const PDFDocument = require('pdfkit');
const path = require('path');

// ── Đường dẫn font ───────────────────────────────────────────────────────────
const FONT_REGULAR = path.join(__dirname, '../public/fonts/Roboto-Regular.ttf');
const FONT_BOLD = path.join(__dirname, '../public/fonts/Roboto-Bold.ttf');

// ── Bảng màu Green/Health ────────────────────────────────────────────────────
const COLORS = {
    primary: '#10B981', // Emerald-500
    dark: '#065F46', // Header dark
    light: '#F0FDF4', // Green-50
    gray: '#6B7280', // Gray-500
    grayLight: '#D1D5DB', // Gray-300
    zebraRow: '#F9FAFB', // Gray-50
    white: '#FFFFFF',
    black: '#111827',
    accent: '#059669', // Emerald-600
};

const PAGE_MARGIN = 50;

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
 * Helper: Vẽ header trang 1.
 */
const drawCoverHeader = (doc, period) => {
    // Nền header
    doc.save()
        .rect(0, 0, doc.page.width, 90)
        .fillColor(COLORS.zebraRow) // xám nhạt
        .fill()
        .restore();

    // Logo NMS (góc trái)
    doc.save()
        .circle(PAGE_MARGIN + 20, 45, 20)
        .fillColor(COLORS.primary)
        .fill()
        .restore();

    doc.font(FONT_BOLD).fontSize(14).fillColor(COLORS.white)
        .text('NMS', PAGE_MARGIN, 38, {
            width: 40,
            align: 'center',
        });

    // Tiêu đề & Sub (góc phải)
    doc.font(FONT_BOLD).fontSize(20).fillColor('#1E293B')
        .text('BÁO CÁO DINH DƯỠNG CÁ NHÂN HÓA', PAGE_MARGIN + 60, 28, {
            width: doc.page.width - PAGE_MARGIN * 2 - 60,
            align: 'right',
        });

    doc.font(FONT_REGULAR).fontSize(11).fillColor(COLORS.gray)
        .text(`📊  ${period.rangeLabel}  •  ${period.label}`, PAGE_MARGIN + 60, 56, {
            width: doc.page.width - PAGE_MARGIN * 2 - 60,
            align: 'right',
        });
};

/**
 * Helper: Vẽ trang bìa độc lập (Cover Page) sang trọng.
 */
const drawCoverPage = (doc, user, period) => {
    const bgPath = path.join(__dirname, '../public/images/cover_bg.png');
    
    // 1. Vẽ hình nền AI bao phủ toàn bộ trang bìa A4
    try {
        doc.image(bgPath, 0, 0, { width: doc.page.width, height: doc.page.height });
    } catch (err) {
        console.error("Lỗi khi load ảnh nền cover:", err);
        // Fallback: Vẽ nền màu emerald/white tối giản nếu file ảnh gặp sự cố
        doc.save()
            .rect(0, 0, doc.page.width, doc.page.height)
            .fillColor('#F9FAFB')
            .fill()
            .restore();
    }

    // 2. Viền trang bìa mỏng và sang trọng
    doc.save()
        .rect(15, 15, doc.page.width - 30, doc.page.height - 30)
        .strokeColor('rgba(16, 185, 129, 0.15)')
        .lineWidth(1)
        .stroke()
        .restore();

    // 3. Logo NMS tinh tế nằm ở trục giữa phía trên
    const centerX = doc.page.width / 2;
    const logoY = 100;

    // Vòng tròn ngoài nét đứt mảnh tinh xảo
    doc.save()
        .circle(centerX, logoY, 32)
        .strokeColor('rgba(16, 185, 129, 0.35)')
        .lineWidth(0.75)
        .dash(3, { space: 3 })
        .stroke()
        .restore();

    // Vòng tròn trong màu lục đậm thương hiệu
    doc.save()
        .circle(centerX, logoY, 26)
        .fillColor('#065F46')
        .fill()
        .restore();

    // Chữ NMS sắc nét ở giữa logo
    doc.font('Bold').fontSize(11).fillColor(COLORS.white)
        .text('NMS', centerX - 25, logoY - 8, { width: 50, align: 'center' });
        
    doc.font('Regular').fontSize(4.5).fillColor('#A7F3D0')
        .text('HEALTH SYSTEM', centerX - 25, logoY + 4, { width: 50, align: 'center', characterSpacing: 0.5 });

    // 4. Typography Tiêu đề và Subtitle hoành tráng nhưng thanh lịch
    doc.font('Bold').fontSize(26).fillColor('#0F172A')
        .text('BÁO CÁO DINH DƯỠNG', PAGE_MARGIN, 175, {
            width: doc.page.width - PAGE_MARGIN * 2,
            align: 'center',
            characterSpacing: 0.5
        });

    doc.font('Regular').fontSize(9).fillColor('#059669')
        .text('HỆ THỐNG PHÂN TÍCH & THÍCH ỨNG TDEE TỰ ĐỘNG', PAGE_MARGIN, 207, {
            width: doc.page.width - PAGE_MARGIN * 2,
            align: 'center',
            characterSpacing: 1.5
        });

    // 5. Thẻ thông tin người dùng được thiết kế dạng Glassmorphism cao cấp
    const cardW = 320;
    const cardH = 115;
    const cardX = centerX - cardW / 2;
    const cardY = doc.page.height / 2 - 15;

    // Lớp nền trắng bán trong suốt sang trọng
    doc.save()
        .roundedRect(cardX, cardY, cardW, cardH, 8)
        .fillColor('rgba(255, 255, 255, 0.92)')
        .fill()
        .restore();

    // Đường viền thẻ màu lục nhạt
    doc.save()
        .roundedRect(cardX, cardY, cardW, cardH, 8)
        .strokeColor('rgba(16, 185, 129, 0.22)')
        .lineWidth(0.75)
        .stroke()
        .restore();

    // Nội dung text trong thẻ
    doc.font('Regular').fontSize(7.5).fillColor('#94A3B8')
        .text('BÁO CÁO ĐƯỢC CHUẨN BỊ CHO', cardX, cardY + 18, { width: cardW, align: 'center', characterSpacing: 1.5 });

    doc.font('Bold').fontSize(16).fillColor('#0F172A')
        .text(user.fullName || 'Người dùng', cardX, cardY + 34, { width: cardW, align: 'center' });

    // Đường gạch ngang phân tách siêu mảnh
    doc.save()
        .moveTo(centerX - 40, cardY + 62)
        .lineTo(centerX + 40, cardY + 62)
        .strokeColor('#E2E8F0')
        .lineWidth(0.5)
        .stroke()
        .restore();

    doc.font('Regular').fontSize(9.5).fillColor('#475569')
        .text(`Kỳ báo cáo: ${period.rangeLabel}  •  ${period.label}`, cardX, cardY + 74, { width: cardW, align: 'center' });

    // 6. Câu trích dẫn động lực truyền cảm hứng ở sát chân trang
    const QUOTES = [
        "\"Hãy để thức ăn là thuốc của bạn, và thuốc là thức ăn của bạn.\" — Hippocrates",
        "\"Sức khỏe không phải là thứ chúng ta có thể mua. Tuy nhiên, nó có thể là một tài khoản tiết kiệm cực kỳ giá trị.\" — Anne Wilson Schaef",
        "\"Một cơ thể khỏe mạnh là phòng khách của tâm hồn, một cơ thể ốm yếu là nhà tù.\" — Francis Bacon",
        "\"Kỷ luật là cầu nối giữa mục tiêu và thành tựu.\" — Jim Rohn",
        "\"Ăn uống là một nhu cầu, nhưng ăn uống thông minh là một nghệ thuật.\" — François de La Rochefoucauld",
        "\"Đầu tư vào sức khỏe hôm nay là tiết kiệm chi phí chữa bệnh ngày mai.\"",
        "\"Chế độ ăn của bạn là một tài khoản ngân hàng. Lựa chọn thực phẩm tốt là các khoản đầu tư tốt.\" — Bethenny Frankel"
    ];
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    const quoteY = doc.page.height - 65;

    doc.font('Regular').fontSize(8.5).fillColor('#475569')
        .text(randomQuote, PAGE_MARGIN + 30, quoteY, {
            width: doc.page.width - PAGE_MARGIN * 2 - 60,
            align: 'center',
            lineGap: 3
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
    const { user, period, metrics, dailyLog, summary, adaptiveTDEE, adaptiveInsight, isEmpty } = reportData;

    const doc = new PDFDocument({
        size: 'A4',
        margins: { top: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN, bottom: 20 },
        bufferPages: true, // Cho phép sửa các trang cũ để vẽ footer sau cùng
        info: {
            Title: `Báo cáo dinh dưỡng — ${period.label}`,
            Author: 'NMS — Nutrition Management System',
            Subject: 'Báo cáo dinh dưỡng cá nhân',
        },
    });

    // Register fonts
    doc.registerFont('Regular', FONT_REGULAR);
    doc.registerFont('Bold', FONT_BOLD);

    // 1. Vẽ trang bìa độc lập (Cover Page)
    drawCoverPage(doc, user, period);

    // 2. Chuyển sang trang 2 để bắt đầu vẽ Dashboard
    doc.addPage();

    // Các biến chung cho trang 2 & 3
    const targetCal = metrics.targetCalories || 2000;
    const avgCal = summary.avgCalories || 0;
    const calPct = targetCal > 0 ? Math.round((avgCal / targetCal) * 100) : 0;

    const macros = metrics.macros || { protein: 120, carbs: 200, fat: 60 };
    const avgP = summary.avgProtein || 0;
    const avgC = summary.avgCarbs || 0;
    const avgF = summary.avgFat || 0;

    const pctP = macros.protein > 0 ? Math.round((avgP / macros.protein) * 100) : 0;
    const pctC = macros.carbs > 0 ? Math.round((avgC / macros.carbs) * 100) : 0;
    const pctF = macros.fat > 0 ? Math.round((avgF / macros.fat) * 100) : 0;

    const avgFiber = summary.avgFiber || 0;

    // ═══════════════════════════════════════════════════════════════════════
    // TRANG 1: Cover + Thông Tin Cá Nhân + Dashboard Chỉ Số
    // ═══════════════════════════════════════════════════════════════════════
    drawCoverHeader(doc, period);

    let y = 110;

    // ── Section: Thông tin cá nhân ──────────────────────────────────────
    // Profile Card bo góc
    doc.save()
        .rect(PAGE_MARGIN, y, doc.page.width - PAGE_MARGIN * 2, 70)
        .fillColor('#F8FAFC')
        .roundedRect(PAGE_MARGIN, y, doc.page.width - PAGE_MARGIN * 2, 70, 8)
        .fill()
        .restore();

    doc.font(FONT_BOLD).fontSize(14).fillColor(COLORS.black)
        .text(`${user.fullName || 'Chưa cập nhật'}`, PAGE_MARGIN + 15, y + 15);

    doc.font(FONT_REGULAR).fontSize(10).fillColor(COLORS.gray)
        .text(`${user.age !== '–' ? user.age + ' tuổi' : ''}  •  ${user.gender}  •  ${user.height !== '–' ? user.height + ' cm' : ''}  •  ${user.weight !== '–' ? user.weight + ' kg' : ''}`, PAGE_MARGIN + 15, y + 35);

    // BMI Badge
    let bmiColor = COLORS.gray;
    if (metrics.bmi) {
        if (metrics.bmi < 18.5) bmiColor = '#3B82F6'; // Xanh dương
        else if (metrics.bmi < 25) bmiColor = '#10B981'; // Xanh lá
        else if (metrics.bmi < 30) bmiColor = '#F59E0B'; // Vàng
        else bmiColor = '#EF4444'; // Đỏ
    }

    doc.save()
        .rect(doc.page.width - PAGE_MARGIN - 150, y + 15, 135, 20)
        .fillColor(bmiColor)
        .roundedRect(doc.page.width - PAGE_MARGIN - 150, y + 15, 135, 20, 10)
        .fill()
        .restore();

    doc.font(FONT_BOLD).fontSize(9).fillColor(COLORS.white)
        .text(`BMI: ${metrics.bmi || '–'} - ${metrics.bmiClass}`, doc.page.width - PAGE_MARGIN - 150, y + 20, { width: 135, align: 'center' });

    doc.font(FONT_REGULAR).fontSize(10).fillColor(COLORS.black)
        .text(`TDEE Thực tế: ${metrics.adaptiveTDEE || metrics.tdee || '–'} kcal`, doc.page.width - PAGE_MARGIN - 150, y + 42, { width: 135, align: 'center' });

    y += 90;

    if (isEmpty) {
        // ── Empty State ──────────────────────────────────────────────────
        doc.save()
            .roundedRect(PAGE_MARGIN, y, doc.page.width - PAGE_MARGIN * 2, 80, 6)
            .fillColor(COLORS.light)
            .fill()
            .restore();

        doc.font(FONT_BOLD).fontSize(11).fillColor(COLORS.dark)
            .text('Chưa có dữ liệu nhật ký trong khoảng thời gian này.', PAGE_MARGIN + 10, y + 20, {
                width: doc.page.width - PAGE_MARGIN * 2 - 20,
                align: 'center',
            });

        doc.font(FONT_REGULAR).fontSize(9).fillColor(COLORS.gray)
            .text('Hãy bắt đầu ghi nhật ký ăn uống và cân nặng hàng ngày để hệ thống tổng hợp báo cáo chuyên sâu.', PAGE_MARGIN + 10, y + 42, {
                width: doc.page.width - PAGE_MARGIN * 2 - 20,
                align: 'center',
            });

        renderAllFooters(doc);
        doc.end();
        return doc;
    }

    // ── Section: Dashboard Chỉ Số ────────────────────────────────────────
    y = drawSectionTitle(doc, '📊  TIẾN ĐỘ DINH DƯỠNG TRUNG BÌNH', y);
    y += 15;

    // Thanh tiến trình Tổng Calories
    let calColor = '#10B981'; // Xanh lá
    if (calPct > 110) calColor = '#EF4444'; // Đỏ
    else if (calPct < 90) calColor = '#F59E0B'; // Cam

    doc.font(FONT_BOLD).fontSize(10).fillColor(COLORS.black)
        .text(`Tổng Calories`, PAGE_MARGIN, y);
    doc.font(FONT_BOLD).fontSize(10).fillColor(calColor)
        .text(`${avgCal} / ${targetCal} kcal (${calPct}%)`, PAGE_MARGIN, y, { align: 'right', width: doc.page.width - PAGE_MARGIN * 2 });

    y += 15;
    const barWidth = doc.page.width - PAGE_MARGIN * 2;
    // Nền thanh
    doc.save().rect(PAGE_MARGIN, y, barWidth, 12).fillColor(COLORS.grayLight).roundedRect(PAGE_MARGIN, y, barWidth, 12, 6).fill().restore();
    // Fill thanh
    const calFillW = Math.min(barWidth, (barWidth * calPct) / 100);
    if (calFillW > 0) {
        doc.save().rect(PAGE_MARGIN, y, calFillW, 12).fillColor(calColor).roundedRect(PAGE_MARGIN, y, calFillW, 12, 6).fill().restore();
    }

    y += 25;

    // Biểu đồ Macro Balance
    const drawMacroBar = (label, actual, target, pct, color, startY) => {
        doc.font(FONT_REGULAR).fontSize(9).fillColor(COLORS.gray).text(label, PAGE_MARGIN, startY);
        doc.font(FONT_BOLD).fontSize(9).fillColor(COLORS.black).text(`${actual}g / ${target}g (${pct}%)`, PAGE_MARGIN, startY, { align: 'right', width: barWidth });

        startY += 12;
        // Nền thanh
        doc.save().rect(PAGE_MARGIN, startY, barWidth, 8).fillColor(COLORS.grayLight).roundedRect(PAGE_MARGIN, startY, barWidth, 8, 4).fill().restore();
        // Fill thanh
        const fillW = Math.min(barWidth, (barWidth * pct) / 100);
        if (fillW > 0) {
            doc.save().rect(PAGE_MARGIN, startY, fillW, 8).fillColor(color).roundedRect(PAGE_MARGIN, startY, fillW, 8, 4).fill().restore();
        }
        return startY + 18;
    };

    y = drawMacroBar('Protein (Chất đạm)', avgP, macros.protein || 120, pctP, '#10B981', y);
    y = drawMacroBar('Carbohydrate (Tinh bột)', avgC, macros.carbs || 200, pctC, '#3B82F6', y);
    y = drawMacroBar('Lipid (Chất béo)', avgF, macros.fat || 60, pctF, '#F59E0B', y);
    y += 10;

    // ── 3. Cân nặng & Vận động ──────────────────────────────────────────────
    y = drawSectionTitle(doc, '⚖️  CÂN NẶNG & VẬN ĐỘNG', y);
    y += 4;

    const bodyRows = [
        ['Cân nặng đầu kỳ', summary.weightStart ? `${summary.weightStart} kg` : 'Chưa có dữ liệu'],
        ['Cân nặng cuối kỳ', summary.weightEnd ? `${summary.weightEnd} kg` : 'Chưa có dữ liệu'],
        ['Thay đổi cân nặng', summary.weightDelta !== null
            ? `${summary.weightDelta > 0 ? '+' : ''}${summary.weightDelta} kg`
            : 'Không đủ dữ liệu'],
        ['Tổng calo tiêu hao từ tập luyện', `${summary.totalExerciseCalories} kcal`],
        ['Tỷ lệ tuân thủ calo mục tiêu', `${summary.calorieCompliance}%  (${Math.round(summary.daysWithData * summary.calorieCompliance / 100)} / ${summary.daysWithData} ngày đạt chuẩn ±10%)`],
    ];

    bodyRows.forEach((row, i) => {
        drawInfoRow(doc, PAGE_MARGIN, y, row[0], row[1], i % 2 === 0);
        y += 20;
    });
    y += 10;

    // ── 4. TDEE Thích ứng ──────────────────────────────────────────────────
    y = drawSectionTitle(doc, '🧠  TDEE THÍCH ỨNG (ADAPTIVE TDEE)', y);
    y += 8;

    if (metrics.adaptiveTDEE && metrics.tdee) {
        const staticTDEE = metrics.tdee;
        const adaptiveTDEEVal = metrics.adaptiveTDEE;
        const diff = adaptiveTDEEVal - staticTDEE;
        const diffPct = Math.round((diff / staticTDEE) * 100);
        const diffSign = diff >= 0 ? '+' : '';

        const boxW = doc.page.width - PAGE_MARGIN * 2;
        const halfW = boxW / 2 - 4;

        // --- Ô TDEE Tĩnh (trái) ---
        doc.save()
            .rect(PAGE_MARGIN, y, halfW, 36)
            .fillColor(COLORS.zebraRow)
            .fill()
            .restore();
        doc.font(FONT_REGULAR).fontSize(8).fillColor(COLORS.gray)
            .text('TDEE Tĩnh (Mifflin-St Jeor)', PAGE_MARGIN + 6, y + 4, { width: halfW - 12 });
        doc.font(FONT_BOLD).fontSize(11).fillColor(COLORS.black)
            .text(`${staticTDEE} kcal/ngày`, PAGE_MARGIN + 6, y + 16, { width: halfW - 12 });

        // --- Ô TDEE Thích ứng (phải) ---
        doc.save()
            .rect(PAGE_MARGIN + halfW + 8, y, halfW, 36)
            .fillColor(COLORS.light)
            .fill()
            .restore();
        doc.font(FONT_REGULAR).fontSize(8).fillColor(COLORS.accent)
            .text('TDEE Thích ứng (thực tế)', PAGE_MARGIN + halfW + 10, y + 4, { width: halfW - 12 });
        doc.font(FONT_BOLD).fontSize(11).fillColor(COLORS.dark)
            .text(`${adaptiveTDEEVal} kcal/ngày`, PAGE_MARGIN + halfW + 10, y + 16, { width: halfW - 12 });

        y += 42;

        let insight;
        if (Math.abs(diffPct) <= 3) {
            insight = `TDEE Thích ứng xác nhận công thức tĩnh phản ánh rất sát với cơ địa thực tế của bạn.`;
        } else if (diff > 0) {
            insight = `Công thức tĩnh ước tính hơi thấp. TDEE Thích ứng đã điều chỉnh tăng, giúp bạn có thể ăn nhiều hơn mà vẫn bám sát mục tiêu.`;
        } else {
            insight = `Công thức tĩnh ước tính calo cao hơn thực tế (dễ gây tăng cân). TDEE Thích ứng đã kịp thời điều chỉnh giảm để bảo vệ thành quả của bạn.`;
        }

        const textToPrint = `Chênh lệch: ${diffSign}${diff} kcal (${diffSign}${diffPct}%)  •  ${insight}`;

        doc.font(FONT_REGULAR).fontSize(8);
        const textH = doc.heightOfString(textToPrint, { width: boxW - 12 });
        const boxH = textH + 8; // Padding 4px on top and bottom

        let bgColor = COLORS.light;
        let tColor = COLORS.primary;

        if (diff > 0) {
            bgColor = '#FEF3C7'; // Vàng nhạt (Amber-100)
            tColor = '#B45309';  // Cam đậm (Amber-700)
        } else if (diff < 0) {
            bgColor = '#E0F2FE'; // Xanh dương nhạt (Sky-100)
            tColor = '#0369A1';  // Xanh dương đậm (Sky-700)
        } else {
            bgColor = COLORS.zebraRow; // Xám nhạt
            tColor = COLORS.gray;
        }

        doc.save()
            .rect(PAGE_MARGIN, y, boxW, boxH)
            .fillColor(bgColor)
            .fill()
            .restore();

        doc.fillColor(tColor)
            .text(textToPrint, PAGE_MARGIN + 6, y + 4, { width: boxW - 12 });
        y += boxH + 8;

        // Bảng lịch sử tuần nếu có
        if (adaptiveTDEE && adaptiveTDEE.length > 0) {
            doc.font(FONT_BOLD).fontSize(8.5).fillColor(COLORS.dark)
                .text('Lịch sử TDEE thích ứng qua các tuần:', PAGE_MARGIN, y);
            y += 12;

            const aCols = [
                { label: 'Tuần bắt đầu', width: 110 },
                { label: 'Tuần kết thúc', width: 110 },
                { label: 'TDEE tính (kcal)', width: 120 },
                { label: 'Trạng thái', width: 155 },
            ];

            doc.save()
                .rect(PAGE_MARGIN, y, boxW, 15)
                .fillColor(COLORS.light)
                .fill()
                .restore();

            let ax = PAGE_MARGIN;
            aCols.forEach(col => {
                doc.font(FONT_BOLD).fontSize(7.5).fillColor(COLORS.accent)
                    .text(col.label, ax + 4, y + 4, { width: col.width - 8 });
                ax += col.width;
            });
            y += 15;

            const sortedLogs = [...adaptiveTDEE].reverse();
            sortedLogs.forEach((log, idx) => {
                if (idx % 2 === 0) {
                    doc.save()
                        .rect(PAGE_MARGIN, y, boxW, 14)
                        .fillColor(COLORS.zebraRow)
                        .fill()
                        .restore();
                }

                const fmtDate = (d) => {
                    if (!d) return '–';
                    const dt = new Date(d);
                    return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}`;
                };

                const STATUS_LABELS = {
                    applied: 'Hợp lệ',
                    clamped: 'Cập giới hạn',
                    skipped_low_data: 'Thiếu dữ liệu',
                    skipped_by_user: 'Bỏ qua',
                };

                const vals = [
                    fmtDate(log.weekStart),
                    fmtDate(log.weekEnd),
                    log.tdee ? Math.round(log.tdee).toLocaleString('vi-VN') : '–',
                    STATUS_LABELS[log.status] || log.status || '–',
                ];

                let bx = PAGE_MARGIN;
                vals.forEach((val, j) => {
                    doc.font(j === 2 ? FONT_BOLD : FONT_REGULAR).fontSize(7.5).fillColor(COLORS.black)
                        .text(val, bx + 4, y + 3, { width: aCols[j].width - 8 });
                    bx += aCols[j].width;
                });
                y += 14;
            });
        }

    } else if (metrics.useAdaptiveTDEE && !metrics.adaptiveTDEE) {
        doc.font(FONT_REGULAR).fontSize(8.5).fillColor(COLORS.gray)
            .text('💡 TDEE thích ứng chưa kích hoạt (cần ghi chép liên tục ≥2 tuần để hệ thống thu thập đủ dữ liệu cân nặng & calories).', PAGE_MARGIN + 6, y);
        y += 18;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TRANG 2: Đánh Giá Chuyên Sâu & Khuyến Nghị
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage();
    y = PAGE_MARGIN;

    doc.font(FONT_BOLD).fontSize(14).fillColor(COLORS.dark)
        .text('ĐÁNH GIÁ CHUYÊN SÂU & GỢI Ý THỰC ĐƠN', PAGE_MARGIN, y, {
            width: doc.page.width - PAGE_MARGIN * 2,
        });
    y += 20;

    doc.font(FONT_REGULAR).fontSize(8.5).fillColor(COLORS.gray)
        .text(`Kỳ báo cáo: ${period.label}  •  ${period.rangeLabel}`, PAGE_MARGIN, y);
    y += 16;
    drawHRule(doc, y, '#E2E8F0');
    y += 15;

    // ── Checklist Đánh giá sức khỏe ──────────────────────────────────────
    y = drawSectionTitle(doc, '📋  ĐÁNH GIÁ CHỈ SỐ SỨC KHỎE (HEALTH EVALUATION)', y);
    y += 12;

    const isCalOk = calPct >= 90 && calPct <= 110;
    const calCheck = isCalOk
        ? `✅ Năng lượng nạp vào: Đạt chuẩn hàng ngày (trung bình nạp ${avgCal.toLocaleString('vi-VN')} kcal / mục tiêu ${targetCal.toLocaleString('vi-VN')} kcal, đạt ${calPct}%).`
        : `⚠️ Năng lượng nạp vào: Chưa tối ưu (trung bình nạp ${avgCal.toLocaleString('vi-VN')} kcal so với mục tiêu ${targetCal.toLocaleString('vi-VN')} kcal, đạt ${calPct}%).`;

    const isMacroOk = pctP >= 70 && pctC >= 70 && pctF >= 70;
    const macroCheck = isMacroOk
        ? `✅ Cân bằng đa lượng (Macros): Tỷ lệ nạp Protein, Carbs, Fat đạt trên 70% mục tiêu khuyến nghị.`
        : `⚠️ Cân bằng đa lượng (Macros): Cần cải thiện, tỷ lệ nạp Protein (${pctP}%), Carbs (${pctC}%), Fat (${pctF}%) chưa đồng đều với mục tiêu.`;

    const fiberTarget = Math.round((targetCal / 1000) * 14);
    const fiberPct = fiberTarget > 0 ? Math.round((avgFiber / fiberTarget) * 100) : 0;
    const isFiberOk = fiberPct >= 70;
    const fiberCheck = isFiberOk
        ? `✅ Chất xơ (Fiber): Đạt khuyến nghị IOM (${avgFiber}g / ${fiberTarget}g mục tiêu - đạt ${fiberPct}%).`
        : `⚠️ Chất xơ (Fiber): Chưa đạt chuẩn IOM (${avgFiber}g / ${fiberTarget}g mục tiêu - đạt ${fiberPct}%). Hãy tăng cường rau xanh.`;

    const waterGoal = metrics.waterGoal || 2000;
    const waterPct = Math.round((summary.avgWater / waterGoal) * 100);
    const isWaterOk = waterPct >= 90;
    const waterCheck = isWaterOk
        ? `✅ Lượng nước uống: Đầy đủ và khoa học (trung bình đạt ${summary.avgWater.toLocaleString('vi-VN')} ml / mục tiêu ${waterGoal.toLocaleString('vi-VN')} ml - đạt ${waterPct}%).`
        : `⚠️ Lượng nước uống: Còn thiếu nước (trung bình đạt ${summary.avgWater.toLocaleString('vi-VN')} ml / mục tiêu ${waterGoal.toLocaleString('vi-VN')} ml - đạt ${waterPct}%).`;

    const isComplianceOk = summary.calorieCompliance >= 70;
    const complianceCheck = isComplianceOk
        ? `✅ Kỷ luật dinh dưỡng: Tốt (${summary.calorieCompliance}% số ngày bám sát mục tiêu calo ±10%).`
        : `⚠️ Kỷ luật dinh dưỡng: Cần cải thiện (chỉ ${summary.calorieCompliance}% số ngày bám sát mục tiêu calo ±10%).`;

    const checks = [calCheck, macroCheck, fiberCheck, waterCheck, complianceCheck];
    checks.forEach(check => {
        doc.font(FONT_REGULAR).fontSize(9).fillColor(COLORS.black)
            .text(check, PAGE_MARGIN + 8, y, { width: doc.page.width - PAGE_MARGIN * 2 - 16, lineGap: 3 });
        y += doc.heightOfString(check, { width: doc.page.width - PAGE_MARGIN * 2 - 16 }) + 10;
    });
    y += 10;

    // ── Kế hoạch hành động từ TDEE Thích ứng (Actionable Insights) ───────────
    // Bảo vệ tràn trang: nếu còn ít hơn 150px trước vùng footer thì sang trang mới
    if (y > doc.page.height - PAGE_MARGIN - 40 - 150) {
        doc.addPage();
        y = PAGE_MARGIN;
    }
    y = drawSectionTitle(doc, '⚡  KẾ HOẠCH HÀNH ĐỘNG CHO TUẦN TỚI (ACTIONABLE INSIGHTS)', y);
    y += 12;

    const insightBoxW = doc.page.width - PAGE_MARGIN * 2;
    const insightText = adaptiveInsight.message || '';
    
    // Tính chiều cao của box dựa trên độ dài tin nhắn
    doc.font(FONT_REGULAR).fontSize(8.5);
    const insightTextH = doc.heightOfString(insightText, { width: insightBoxW - 24 });
    
    let insightBgColor = COLORS.light;
    let insightTextColor = COLORS.dark;

    if (adaptiveInsight.hasData) {
        if (adaptiveInsight.isPlateauing) {
            insightBgColor = '#E0F2FE'; // Sky-100
            insightTextColor = '#0369A1'; // Sky-700
        } else if (adaptiveInsight.diffPct > 5) {
            insightBgColor = '#FEF3C7'; // Amber-100
            insightTextColor = '#B45309'; // Amber-700
        }
    } else {
        insightBgColor = '#F9FAFB'; // Gray-50
        insightTextColor = COLORS.gray;
    }

    // Vẽ box nền
    let boxTotalH = insightTextH + 16;
    if (adaptiveInsight.hasData && adaptiveInsight.isPlateauing) {
        boxTotalH += 45; // Thêm chiều cao cho bảng so sánh
    }

    doc.save()
        .roundedRect(PAGE_MARGIN, y, insightBoxW, boxTotalH, 6)
        .fillColor(insightBgColor)
        .fill()
        .restore();

    // Vẽ text tin nhắn
    doc.font(FONT_REGULAR).fontSize(8.5).fillColor(insightTextColor)
        .text(insightText, PAGE_MARGIN + 12, y + 8, { width: insightBoxW - 24, lineGap: 2 });

    // Nếu đang chững cân, vẽ thêm bảng so sánh 2 cột nổi bật
    if (adaptiveInsight.hasData && adaptiveInsight.isPlateauing) {
        const compareY = y + insightTextH + 16;
        const colW = (insightBoxW - 32) / 2;

        // Cột trái: Hiện tại
        doc.save()
            .roundedRect(PAGE_MARGIN + 12, compareY, colW, 28, 4)
            .fillColor(COLORS.white)
            .fill()
            .restore();
        doc.font(FONT_REGULAR).fontSize(8).fillColor(COLORS.gray)
            .text('Mục tiêu hiện tại:', PAGE_MARGIN + 18, compareY + 4);
        doc.font(FONT_BOLD).fontSize(9.5).fillColor(COLORS.black)
            .text(`${adaptiveInsight.currentTargetCalories} kcal/ngày`, PAGE_MARGIN + 18, compareY + 14);

        // Cột phải: Đề xuất
        doc.save()
            .roundedRect(PAGE_MARGIN + 12 + colW + 8, compareY, colW, 28, 4)
            .fillColor('#F0FDF4') // Green-50
            .fill()
            .restore();
        doc.font(FONT_REGULAR).fontSize(8).fillColor('#047857') // Green-700
            .text('Mục tiêu đề xuất mới:', PAGE_MARGIN + 18 + colW + 8, compareY + 4);
        doc.font(FONT_BOLD).fontSize(9.5).fillColor('#065F46') // Green-800
            .text(`${adaptiveInsight.suggestedTargetCalories} kcal/ngày  ↓`, PAGE_MARGIN + 18 + colW + 8, compareY + 14);
    }

    y += boxTotalH + 15;

    // ── Khuyến nghị từ hệ thống (Recommendations) ─────────────────────────
    // Bảo vệ tràn trang: cần ít nhất 180px để vẽ section title + ít nhất 1 dòng khuyến nghị
    if (y > doc.page.height - PAGE_MARGIN - 40 - 180) {
        doc.addPage();
        y = PAGE_MARGIN;
    }
    y = drawSectionTitle(doc, '💡  GỢI Ý THỰC ĐƠN & LỐI SỐNG (AI RECOMMENDATIONS)', y);
    y += 12;

    const recs = [];
    if (pctP < 70) {
        recs.push('🥚 Tăng cường chất đạm (Protein): Lượng đạm của bạn hơi thấp. Nên bổ sung thêm các thực phẩm giàu protein như: Ức gà, Trứng luộc, Cá hồi, Thịt bò nạc hoặc đậu nành để duy trì cơ bắp.');
    }
    if (fiberPct < 70) {
        recs.push('🥦 Tăng cường chất xơ (Fiber): Lượng xơ chưa đạt tiêu chuẩn IOM. Hãy bổ sung thêm các loại rau củ như: Bông cải xanh, Khoai lang, Rau muống hoặc Yến mạch trong các bữa ăn chính.');
    }
    if (pctF > 110) {
        recs.push('🍳 Kiểm soát chất béo (Fat): Lượng chất béo trung bình nạp vào cao hơn mục tiêu. Hạn chế các món chiên rán nhiều dầu mỡ, tăng cường các món luộc, hấp hoặc dùng chất béo tốt từ quả bơ, hạt điều.');
    }
    if (summary.avgWater < 1500) {
        recs.push('💧 Bổ sung nước uống: Cơ thể bạn đang thiếu nước nghiêm trọng (trung bình dưới 1.5L/ngày). Hãy trang bị một bình nước lớn 2L ngay bàn học/bàn làm việc để tạo thói quen uống nước đều đặn.');
    } else if (waterPct < 90) {
        recs.push('🥤 Tăng lượng nước uống: Bạn chưa uống đủ lượng nước mục tiêu khuyến nghị. Cố gắng uống thêm 1-2 ly nước vào các thời điểm cố định trong ngày.');
    }
    if (summary.totalExerciseCalories === 0) {
        recs.push('🏃 Kích hoạt vận động: Bạn có lối sống khá tĩnh tại trong kỳ báo cáo (0 kcal tập luyện). Nên dành ít nhất 15-20 phút đi bộ nhanh hoặc tập thể dục nhẹ mỗi ngày để kích hoạt cơ chế trao đổi chất tốt hơn.');
    } else {
        recs.push('🏋️ Duy trì thể lực: Bạn vận động rất tốt với tổng cộng ' + summary.totalExerciseCalories + ' kcal tiêu thụ từ tập luyện. Hãy tiếp tục duy trì thói quen tập luyện đều đặn này!');
    }

    // Gợi ý thực đơn theo mục tiêu
    if (user.goal.includes('Giảm cân')) {
        recs.push('🥗 Gợi ý thực đơn giảm cân: Ưu tiên các thực phẩm giàu thể tích nhưng ít calo như dưa chuột, bí ngòi, và các loại rau lá xanh đậm. Sử dụng Meal Planner trên ứng dụng để tối ưu khối lượng bữa ăn.');
    } else if (user.goal.includes('Tăng cân')) {
        recs.push('🥜 Gợi ý thực đơn tăng cân: Bổ sung thêm các bữa phụ dinh dưỡng bằng hạt sấy khô, sữa tươi nguyên kem, bơ đậu phộng để tăng calo tự nhiên mà không gây đầy bụng.');
    } else {
        recs.push('🥩 Gợi ý duy trì sức khỏe: Duy trì tỷ lệ dinh dưỡng cân bằng. Ăn uống đa dạng nguồn thực phẩm, kết hợp nhiều màu sắc rau củ và không bỏ bữa.');
    }

    const recsBoxY = y;
    let tempY = y + 10;
    recs.forEach(rec => {
        tempY += doc.heightOfString(rec, { width: doc.page.width - PAGE_MARGIN * 2 - 24 }) + 8;
    });
    const recsBoxH = tempY - recsBoxY + 4;

    doc.save()
        .roundedRect(PAGE_MARGIN, recsBoxY, doc.page.width - PAGE_MARGIN * 2, recsBoxH, 6)
        .fillColor(COLORS.light)
        .fill()
        .restore();

    let ry = recsBoxY + 10;
    recs.forEach(rec => {
        doc.font(FONT_REGULAR).fontSize(8.5).fillColor(COLORS.dark)
            .text(rec, PAGE_MARGIN + 12, ry, { width: doc.page.width - PAGE_MARGIN * 2 - 24, lineGap: 2.5 });
        ry += doc.heightOfString(rec, { width: doc.page.width - PAGE_MARGIN * 2 - 24 }) + 8;
    });

    // ═══════════════════════════════════════════════════════════════════════
    // TRANG 3: Bảng Nhật Ký Chi Tiết
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage();
    y = PAGE_MARGIN;

    doc.font(FONT_BOLD).fontSize(14).fillColor(COLORS.dark)
        .text('CHI TIẾT THEO NGÀY', PAGE_MARGIN, y, {
            width: doc.page.width - PAGE_MARGIN * 2,
        });
    y += 20;

    doc.font(FONT_REGULAR).fontSize(8.5).fillColor(COLORS.gray)
        .text(`Kỳ báo cáo: ${period.label}`, PAGE_MARGIN, y);
    y += 16;
    drawHRule(doc, y, '#E2E8F0');
    y += 15;

    // ── Bảng nhật ký ngày tối giản không đường kẻ dọc ───────────────────────
    const cols = [
        { label: 'Ngày', width: 60 },
        { label: 'Cân nặng', width: 75 },
        { label: 'Calories', width: 85 },
        { label: 'Nước (ml)', width: 85 },
        { label: 'Tập (kcal)', width: 90 },
        { label: 'Trạng thái', width: 100 },
    ];

    const tableWidth = doc.page.width - PAGE_MARGIN * 2;

    const drawTableHeader = (startY) => {
        doc.save()
            .rect(PAGE_MARGIN, startY, tableWidth, 20)
            .fillColor(COLORS.dark)
            .fill()
            .restore();

        let currentX = PAGE_MARGIN;
        cols.forEach(col => {
            doc.font(FONT_BOLD).fontSize(8).fillColor(COLORS.white)
                .text(col.label, currentX + 6, startY + 6, { width: col.width - 12 });
            currentX += col.width;
        });
        return startY + 20;
    };

    y = drawTableHeader(y);

    const getStatus = (calories, target) => {
        if (!target) return { label: '➖ B.thường', color: '#6B7280' };
        const pct = calories / target;
        if (pct < 0.9) return { label: '⚠️ Thiếu', color: '#D97706' };
        if (pct > 1.1) return { label: '⛔ Vượt', color: '#DC2626' };
        return { label: '✅ Đạt', color: '#059669' };
    };

    const allRows = [...dailyLog];

    if (allRows.length === 0) {
        doc.save()
            .rect(PAGE_MARGIN, y, tableWidth, 20)
            .fillColor(COLORS.zebraRow)
            .fill()
            .restore();
        doc.font(FONT_REGULAR).fontSize(8.5).fillColor(COLORS.gray)
            .text('Chưa có dữ liệu nhật ký cho kỳ này.', PAGE_MARGIN + 6, y + 6, { width: tableWidth - 12 });
        y += 20;
    } else {
        allRows.forEach((row, i) => {
            if (y + 18 > doc.page.height - PAGE_MARGIN - 40) {
                doc.addPage();
                doc.font(FONT_BOLD).fontSize(10).fillColor(COLORS.dark)
                    .text('CHI TIẾT THEO NGÀY (tiếp theo)', PAGE_MARGIN, PAGE_MARGIN);
                y = drawTableHeader(PAGE_MARGIN + 16);
            }

            // Dùng xen kẽ nền xám nhạt (Zebra row)
            if (i % 2 === 0) {
                doc.save()
                    .rect(PAGE_MARGIN, y, tableWidth, 18)
                    .fillColor(COLORS.zebraRow)
                    .fill()
                    .restore();
            }

            // Kẻ đường phân cách ngang mỏng màu #E2E8F0
            doc.save()
                .moveTo(PAGE_MARGIN, y + 18)
                .lineTo(PAGE_MARGIN + tableWidth, y + 18)
                .strokeColor('#E2E8F0')
                .lineWidth(0.5)
                .stroke()
                .restore();

            const status = getStatus(row.calories, metrics.targetCalories);

            const rowData = [
                row.dateFormatted,
                row.weight ? `${row.weight} kg` : '– kg',
                `${row.calories} kcal`,
                `${row.water} ml`,
                `${row.exerciseBurned} kcal`,
                status.label
            ];

            let cx = PAGE_MARGIN;
            rowData.forEach((val, j) => {
                const isStatusCol = j === 5;
                const textColor = isStatusCol ? status.color : COLORS.black;
                doc.font(isStatusCol || j === 0 ? FONT_BOLD : FONT_REGULAR).fontSize(8).fillColor(textColor)
                    .text(String(val), cx + 6, y + 5, { width: cols[j].width - 12 });
                cx += cols[j].width;
            });
            y += 18;
        });

        // Hàng trung bình / Tổng kết dưới cùng
        if (y + 20 > doc.page.height - PAGE_MARGIN - 40) {
            doc.addPage();
            doc.font(FONT_BOLD).fontSize(10).fillColor(COLORS.dark)
                .text('CHI TIẾT THEO NGÀY (tiếp theo)', PAGE_MARGIN, PAGE_MARGIN);
            y = drawTableHeader(PAGE_MARGIN + 16);
        }

        doc.save()
            .rect(PAGE_MARGIN, y, tableWidth, 20)
            .fillColor(COLORS.primary)
            .fill()
            .restore();

        const avgData = [
            'T.Bình',
            summary.weightEnd ? `${summary.weightEnd} kg` : '– kg',
            `${summary.avgCalories} kcal`,
            `${summary.avgWater} ml`,
            `${Math.round(summary.totalExerciseCalories / (summary.daysWithData || 1))} kcal`,
            getStatus(summary.avgCalories, metrics.targetCalories).label
        ];

        let cx = PAGE_MARGIN;
        avgData.forEach((val, j) => {
            doc.font(FONT_BOLD).fontSize(8).fillColor(COLORS.white)
                .text(String(val), cx + 6, y + 6, { width: cols[j].width - 12 });
            cx += cols[j].width;
        });
        y += 20;
    }

    renderAllFooters(doc);
    doc.end();
    return doc;
};

/**
 * Hàm hỗ trợ vẽ footer lên TẤT CẢ các trang nội dung (bỏ qua trang bìa).
 * Đánh số trang bắt đầu từ 1 cho trang nội dung đầu tiên (sau trang bìa).
 */
function renderAllFooters(doc) {
    const range = doc.bufferedPageRange();
    const totalContentPages = range.count - 1; // Tổng trang nội dung (không tính bìa)
    for (let i = range.start + 1; i < range.start + range.count; i++) {
        doc.switchToPage(i);
        const contentPageNum = i - range.start; // 1, 2, 3, ...
        drawFooter(doc, contentPageNum, totalContentPages);
    }
}

module.exports = { generateReportPDF };
