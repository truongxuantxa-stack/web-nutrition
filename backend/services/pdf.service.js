'use strict';

// ═══════════════════════════════════════════════════════════════════════════════
// services/pdf.service.js
// PDFKit rendering engine — Xuất báo cáo dinh dưỡng PDF chuyên nghiệp
// ═══════════════════════════════════════════════════════════════════════════════

const PDFDocument = require('pdfkit');
const path = require('path');
const https = require('https');
const QRCode = require('qrcode');

// URL ứng dụng — được dùng cho QR Code trang bìa
const APP_URL = process.env.APP_URL || 'https://nms-nutrition.vercel.app';

// ── QuickChart.io helper (Task 5) ────────────────────────────────────────────
/**
 * Fetch một chart image từ QuickChart.io về dạng Buffer.
 * Trả null nếu timeout hoặc lỗi (graceful degradation).
 */
const fetchChartImage = (chartConfig, width = 400, height = 250) => {
    return new Promise((resolve) => {
        const url = `https://quickchart.io/chart?c=${encodeURIComponent(JSON.stringify(chartConfig))}&w=${width}&h=${height}&f=png&bkg=white`;
        const req = https.get(url, { timeout: 8000 }, (res) => {
            if (res.statusCode !== 200) {
                console.warn(`[PDF Chart] QuickChart trả HTTP ${res.statusCode}`);
                res.resume(); // Xả drain socket
                resolve(null);
                return;
            }
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => {
                const buf = Buffer.concat(chunks);
                // Kiểm tra PNG header (89 50 4E 47)
                if (buf.length > 4 && buf[0] === 0x89 && buf[1] === 0x50) {
                    resolve(buf);
                } else {
                    resolve(null); // Không phải PNG hợp lệ
                }
            });
        });
        req.on('error', () => resolve(null));
        req.on('timeout', () => { req.destroy(); resolve(null); });
    });
};

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

    doc.font('Regular').fontSize(9).fillColor(COLORS.gray)
        .text(label, PAGE_MARGIN + 6, y + 5, { width: colW - 10 });

    doc.font('Bold').fontSize(9).fillColor(COLORS.black)
        .text(String(value), PAGE_MARGIN + colW + 6, y + 5, { width: colW - 10 });
};

/**
 * Helper: Vẽ tiêu đề section. (Task 4: tăng height 22→26, font 10→11pt)
 */
const drawSectionTitle = (doc, title, y) => {
    doc.save()
        .rect(PAGE_MARGIN, y, doc.page.width - PAGE_MARGIN * 2, 26)
        .fillColor(COLORS.dark)
        .fill()
        .restore();

    doc.font('Bold').fontSize(11).fillColor(COLORS.white)
        .text(title, PAGE_MARGIN + 10, y + 7, { width: doc.page.width - PAGE_MARGIN * 2 - 20 });

    return y + 26;
};

/**
 * Helper: Vẽ KPI Card (Task 2).
 */
const drawKPICard = (doc, x, y, w, h, icon, value, label, accentColor) => {
    // Nền bo góc nhạt
    doc.save()
        .roundedRect(x, y, w, h, 6)
        .fillColor('#F8FAFC')
        .fill()
        .restore();

    // Thanh accent 3px trên cùng
    doc.save()
        .rect(x, y, w, 3)
        .fillColor(accentColor)
        .fill()
        .restore();

    // Giá trị số (16pt Bold)
    doc.font('Bold').fontSize(16).fillColor(COLORS.black)
        .text(value, x, y + 10, { width: w, align: 'center' });

    // Label nhỏ bên dưới (8.5pt Regular)
    doc.font('Regular').fontSize(8.5).fillColor(COLORS.gray)
        .text(label, x, y + 33, { width: w, align: 'center' });
};

/**
 * Helper: Vẽ footer mỗi trang.
 */
const drawFooter = (doc, pageNum, totalPages) => {
    const y = doc.page.height - 35;
    const width = doc.page.width - PAGE_MARGIN * 2;

    drawHRule(doc, y - 5);

    doc.font('Regular').fontSize(8).fillColor(COLORS.gray)
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

    doc.font('Bold').fontSize(14).fillColor(COLORS.white)
        .text('NMS', PAGE_MARGIN, 38, {
            width: 40,
            align: 'center',
        });

    // Tiêu đề & Sub (góc phải)
    doc.font('Bold').fontSize(20).fillColor('#1E293B')
        .text('BÁO CÁO DINH DƯỠNG CÁ NHÂN HÓA', PAGE_MARGIN + 60, 28, {
            width: doc.page.width - PAGE_MARGIN * 2 - 60,
            align: 'right',
        });

    doc.font('Regular').fontSize(11).fillColor(COLORS.gray)
        .text(`${period.rangeLabel}  •  ${period.label}`, PAGE_MARGIN + 60, 56, {
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
        .strokeColor('#10B981').strokeOpacity(0.15)
        .lineWidth(1)
        .stroke()
        .restore();

    // 3. Logo NMS tinh tế nằm ở trục giữa phía trên
    const centerX = doc.page.width / 2;
    const logoY = 100;

    // Vòng tròn ngoài nét đứt mảnh tinh xảo
    doc.save()
        .circle(centerX, logoY, 32)
        .strokeColor('#10B981').strokeOpacity(0.35)
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
        .fillColor('#FFFFFF').fillOpacity(0.92)
        .fill()
        .restore();

    // Đường viền thẻ màu lục nhạt
    doc.save()
        .roundedRect(cardX, cardY, cardW, cardH, 8)
        .strokeColor('#10B981').strokeOpacity(0.22)
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
    const quoteY = doc.page.height - 80;

    doc.font('Regular').fontSize(8.5).fillColor('#475569')
        .text(randomQuote, PAGE_MARGIN + 30, quoteY, {
            width: doc.page.width - PAGE_MARGIN * 2 - 60,
            align: 'center',
            lineGap: 2
        });
};

/**
 * Helper: Vẽ bảng Top Foods (2 cột layout)
 */
const drawTopFoodsTable = (doc, title, icon, data, unit, x, y, colWidth) => {
    // Header nhỏ
    doc.font('Bold').fontSize(8.5).fillColor(COLORS.dark)
        .text(icon ? `${icon} ${title}` : title, x, y);
    
    let currentY = y + 14;
    
    data.forEach((item) => {
        // Tên thực phẩm
        doc.font('Regular').fontSize(8).fillColor(COLORS.black)
            .text(`${item.rank}. ${item.name}`, x, currentY, { width: colWidth - 55, lineBreak: false });
        
        // Giá trị & phần trăm
        doc.font('Bold').fontSize(8).fillColor(COLORS.gray)
            .text(`${item.value}${unit} (${item.percentage}%)`, x + colWidth - 55, currentY, { width: 55, align: 'right', lineBreak: false });
        
        currentY += 12;
        
        // Mini progress bar
        doc.save()
            .rect(x, currentY, colWidth, 3)
            .fillColor(COLORS.grayLight)
            .fill()
            .restore();
            
        const fillW = Math.max(0, Math.min(colWidth, (colWidth * item.percentage) / 100));
        if (fillW > 0) {
            doc.save()
                .rect(x, currentY, fillW, 3)
                .fillColor(COLORS.accent)
                .fill()
                .restore();
        }
        
        currentY += 8; // Khoảng cách giữa các row
    });
    
    return currentY;
};

// ──────────────────────────────────────────────────────────────────────────────
// Hàm chính: Tạo PDFDocument và stream về
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Tạo báo cáo PDF từ reportData.
 * @param {Object} reportData - Dữ liệu từ report.service.js
 * @returns {Promise<PDFDocument>} Stream PDF
 */
const generateReportPDF = async (reportData) => {
    const { user, period, metrics, dailyLog, summary, adaptiveTDEE, adaptiveInsight, isEmpty, healthInsights, healthScore, topFoods, foodScoringReport } = reportData;

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

    // 1. Sinh QR Code (Task 1) + Fetch Charts (Task 5) — song song
    let qrBuffer = null;
    let chartMacroBuffer = null;
    let chartCalorieBuffer = null;
    let chartWeightBuffer = null;

    // Chuẩn bị chart configs
    const macroChartConfig = {
        type: 'doughnut',
        data: {
            labels: ['Protein', 'Carbs', 'Fat'],
            datasets: [{
                data: [summary.avgProtein || 0, summary.avgCarbs || 0, summary.avgFat || 0],
                backgroundColor: ['#10B981', '#3B82F6', '#F59E0B'],
                borderWidth: 2,
                borderColor: '#ffffff',
            }],
        },
        options: {
            plugins: {
                legend: { position: 'bottom', labels: { font: { size: 13 }, padding: 10 } },
                title: { display: true, text: 'Tỷ lệ Macro (g)', font: { size: 14, weight: 'bold' } },
            },
        },
    };

    const calorieLabels = (dailyLog || []).map(d => d.dateFormatted);
    const calorieData  = (dailyLog || []).map(d => d.calories);
    const targetCalVal = Math.round(metrics.targetCalories || 2000);
    const calorieChartConfig = {
        type: 'bar',
        data: {
            labels: calorieLabels,
            datasets: [
                {
                    label: 'Thực tế (kcal)',
                    data: calorieData,
                    backgroundColor: '#10B981',
                    borderRadius: 4,
                },
                {
                    label: `Mục tiêu (${targetCalVal})`,
                    data: calorieLabels.map(() => targetCalVal),
                    type: 'line',
                    borderColor: '#EF4444',
                    borderWidth: 2,
                    borderDash: [5, 3],
                    fill: false,
                    pointRadius: 0,
                },
            ],
        },
        options: {
            plugins: {
                title: { display: true, text: 'Calories theo ngày', font: { size: 14, weight: 'bold' } },
                legend: { labels: { font: { size: 12 } } },
            },
            scales: { y: { beginAtZero: true } },
        },
    };

    const weightLogs = (dailyLog || []).filter(d => d.weight);
    const weightChartConfig = {
        type: 'line',
        data: {
            labels: weightLogs.map(d => d.dateFormatted),
            datasets: [{
                label: 'Cân nặng (kg)',
                data: weightLogs.map(d => d.weight),
                borderColor: '#6366F1',
                backgroundColor: 'rgba(99,102,241,0.1)',
                borderWidth: 2.5,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#6366F1',
                pointRadius: 4,
            }],
        },
        options: {
            plugins: {
                title: { display: true, text: 'Xu hướng cân nặng (kg)', font: { size: 14, weight: 'bold' } },
                legend: { labels: { font: { size: 12 } } },
            },
            scales: { y: { beginAtZero: false } },
        },
    };

    // Fetch tất cả song song (race với QR)
    try {
        const [qrDataUrl, macBuf, calBuf, wgtBuf] = await Promise.all([
            QRCode.toDataURL(APP_URL, {
                width: 120, margin: 1, color: { dark: '#065F46', light: '#FFFFFF' }
            }),
            fetchChartImage(macroChartConfig, 200, 200),
            fetchChartImage(calorieChartConfig, 275, 200),
            weightLogs.length >= 2 ? fetchChartImage(weightChartConfig, 495, 200) : Promise.resolve(null),
        ]);
        qrBuffer        = Buffer.from(qrDataUrl.split(',')[1], 'base64');
        chartMacroBuffer   = macBuf;
        chartCalorieBuffer = calBuf;
        chartWeightBuffer  = wgtBuf;
    } catch (err) {
        console.error('[PDF] Lỗi khi tải tài nguyên async:', err.message);
    }

    // 2. Vẽ trang bìa độc lập (Cover Page)
    const pageCountBeforeCover = doc.bufferedPageRange().count;
    drawCoverPage(doc, user, period);

    // Chèn QR code góc phải dưới trang bìa (Task 1)
    if (qrBuffer) {
        // Đảm bảo đang ở trang bìa (page 0) trước khi vẽ QR
        doc.switchToPage(0);
        const qrX = doc.page.width - PAGE_MARGIN - 65;
        const qrY = doc.page.height - 100;
        doc.image(qrBuffer, qrX, qrY, { width: 60, height: 60 });
        doc.font('Regular').fontSize(6.5).fillColor('#94A3B8')
            .text('Quét để truy cập', qrX - 5, qrY + 63, { width: 70, align: 'center', lineBreak: false });
    }

    // 3. Chuyển sang trang 2 để bắt đầu vẽ Dashboard
    // Bảo vệ: nếu PDFKit auto-paginated (tạo trang thừa do text overflow),
    // chỉ switchToPage thay vì addPage để tránh trang trắng.
    const pageCountAfterCover = doc.bufferedPageRange().count;
    if (pageCountAfterCover > pageCountBeforeCover) {
        // PDFKit đã tự addPage do text overflow — dùng trang đó
        doc.switchToPage(pageCountAfterCover - 1);
    } else {
        doc.addPage();
    }

    // Các biến chung cho trang 2 & 3
    const targetCal = Math.round(metrics.targetCalories || 2000);
    const avgCal = summary.avgCalories || 0;
    const calPct = targetCal > 0 ? Math.round((avgCal / targetCal) * 100) : 0;

    const macros = metrics.macros || { protein: 120, carbs: 200, fat: 60 };
    const avgP = summary.avgProtein || 0;
    const avgC = summary.avgCarbs || 0;
    const avgF = summary.avgFat || 0;

    const pctP = macros.protein > 0 ? Math.round((avgP / macros.protein) * 100) : 0;
    const pctC = macros.carbs > 0 ? Math.round((avgC / macros.carbs) * 100) : 0;
    const pctF = macros.fat > 0 ? Math.round((avgF / macros.fat) * 100) : 0;

    const isMale = user.gender === 'Nam';

    const avgFiber = summary.avgFiber || 0;
    const fiberTarget = Math.round((targetCal / 1000) * 14);
    const fiberPct = fiberTarget > 0 ? Math.round((avgFiber / fiberTarget) * 100) : 0;
    
    const avgVitA = summary.avgVitaminA || 0;
    const vitATarget = isMale ? 900 : 700;
    const vitAPct = Math.round((avgVitA / vitATarget) * 100);

    const avgVitC = summary.avgVitaminC || 0;
    const vitCTarget = isMale ? 90 : 75;
    const vitCPct = Math.round((avgVitC / vitCTarget) * 100);

    const avgCalcium = summary.avgCalcium || 0;
    const calciumTarget = 1000;
    const calciumPct = Math.round((avgCalcium / calciumTarget) * 100);

    const avgIron = summary.avgIron || 0;
    const ironTarget = isMale ? 8 : 18;
    const ironPct = Math.round((avgIron / ironTarget) * 100);

    const waterGoal = metrics.waterGoal || 2000;
    const waterPct = waterGoal > 0 ? Math.round((summary.avgWater / waterGoal) * 100) : 0;

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

    doc.font('Bold').fontSize(14).fillColor(COLORS.black)
        .text(`${user.fullName || 'Chưa cập nhật'}`, PAGE_MARGIN + 15, y + 15);

    doc.font('Regular').fontSize(10).fillColor(COLORS.gray)
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

    doc.font('Bold').fontSize(9).fillColor(COLORS.white)
        .text(`BMI: ${metrics.bmi || '–'} - ${metrics.bmiClass}`, doc.page.width - PAGE_MARGIN - 150, y + 20, { width: 135, align: 'center' });

    doc.font('Regular').fontSize(10).fillColor(COLORS.black)
        .text(`TDEE Thực tế: ${metrics.adaptiveTDEE || metrics.tdee || '–'} kcal`, doc.page.width - PAGE_MARGIN - 150, y + 42, { width: 135, align: 'center' });

    y += 90;

    // ── KPI Summary Cards (Task 2) ───────────────────────────────────────────
    if (!isEmpty) {
        const kpiW = 119;
        const kpiH = 55;
        const kpiGap = 4;
        const kpiStartX = PAGE_MARGIN;

        // KPI 1: Calo TB/ngày
        let kpi1Color = '#10B981';
        if (calPct > 110) kpi1Color = '#EF4444';
        else if (calPct < 90) kpi1Color = '#F59E0B';
        drawKPICard(doc, kpiStartX, y, kpiW, kpiH, '⚡', `${avgCal}`, 'Calo TB/ngày', kpi1Color);

        // KPI 2: Tuân thủ calo
        let kpi2Color = '#10B981';
        if (summary.calorieCompliance < 60) kpi2Color = '#EF4444';
        else if (summary.calorieCompliance < 80) kpi2Color = '#F59E0B';
        drawKPICard(doc, kpiStartX + kpiW + kpiGap, y, kpiW, kpiH, '📊', `${summary.calorieCompliance}%`, 'Tuân thủ calo', kpi2Color);

        // KPI 3: Thay đổi cân
        const deltaVal = summary.weightDelta !== null ? `${summary.weightDelta > 0 ? '+' : ''}${summary.weightDelta}kg` : '–';
        drawKPICard(doc, kpiStartX + (kpiW + kpiGap) * 2, y, kpiW, kpiH, '⚖️', deltaVal, 'Thay đổi cân', '#6366F1');

        // KPI 4: Tập luyện
        drawKPICard(doc, kpiStartX + (kpiW + kpiGap) * 3, y, kpiW, kpiH, '🏃', `${summary.totalExerciseCalories}`, 'Tập luyện (kcal)', '#3B82F6');

        y += kpiH + 15;
    }

    // ── Charts (Task 5) — sau KPI, trước isEmpty ─────────────────────────────
    if (!isEmpty && (chartMacroBuffer || chartCalorieBuffer || chartWeightBuffer)) {
        const chartW = doc.page.width - PAGE_MARGIN * 2; // 495px
        const chartH = 200;
        const donutW = 200;
        const barW   = chartW - donutW - 20; // ~275px

        // Hàng 1: Donut (trái) + Calorie Bar (phải)
        if (chartMacroBuffer || chartCalorieBuffer) {
            // Kiểm tra đủ chỗ
            if (y + chartH + 20 > doc.page.height - PAGE_MARGIN - 40) {
                doc.addPage();
                y = PAGE_MARGIN;
            }
            if (chartMacroBuffer) {
                doc.image(chartMacroBuffer, PAGE_MARGIN, y, { width: donutW, height: chartH });
            }
            if (chartCalorieBuffer) {
                doc.image(chartCalorieBuffer, PAGE_MARGIN + donutW + 20, y, { width: barW, height: chartH });
            }
            y += chartH + 14;
        }

        // Hàng 2: Weight Line (full-width)
        if (y + chartH + 20 > doc.page.height - PAGE_MARGIN - 40) {
            doc.addPage();
            y = PAGE_MARGIN;
        }

        if (chartWeightBuffer) {
            doc.image(chartWeightBuffer, PAGE_MARGIN, y, { width: chartW, height: chartH });
        } else {
            // Placeholder cho biểu đồ cân nặng
            doc.save()
                .roundedRect(PAGE_MARGIN, y, chartW, chartH, 6)
                .fillColor('#F9FAFB')
                .fill()
                .restore();
            
            doc.font('Bold').fontSize(12).fillColor(COLORS.gray)
                .text('Chưa đủ dữ liệu cân nặng', PAGE_MARGIN, y + chartH / 2 - 10, { width: chartW, align: 'center' });
            doc.font('Regular').fontSize(9).fillColor(COLORS.grayLight)
                .text('Cần ghi nhận cân nặng ít nhất 2 ngày trong kỳ báo cáo để vẽ biểu đồ xu hướng', PAGE_MARGIN, y + chartH / 2 + 8, { width: chartW, align: 'center' });
        }
        y += chartH + 14;
    }

    if (isEmpty) {
        // ── Empty State ──────────────────────────────────────────────────
        doc.save()
            .roundedRect(PAGE_MARGIN, y, doc.page.width - PAGE_MARGIN * 2, 80, 6)
            .fillColor(COLORS.light)
            .fill()
            .restore();

        doc.font('Bold').fontSize(11).fillColor(COLORS.dark)
            .text('Chưa có dữ liệu nhật ký trong khoảng thời gian này.', PAGE_MARGIN + 10, y + 20, {
                width: doc.page.width - PAGE_MARGIN * 2 - 20,
                align: 'center',
            });

        doc.font('Regular').fontSize(9).fillColor(COLORS.gray)
            .text('Hãy bắt đầu ghi nhật ký ăn uống và cân nặng hàng ngày để hệ thống tổng hợp báo cáo chuyên sâu.', PAGE_MARGIN + 10, y + 42, {
                width: doc.page.width - PAGE_MARGIN * 2 - 20,
                align: 'center',
            });

        return doc;
    }

    // ── Section: Dashboard Chỉ Số ────────────────────────────────────────
    if (y + 150 > doc.page.height - PAGE_MARGIN - 40) {
        doc.addPage();
        y = PAGE_MARGIN;
    }
    y = drawSectionTitle(doc, 'TIẾN ĐỘ DINH DƯỠNG TRUNG BÌNH', y);
    y += 18;

    // Thanh tiến trình Tổng Calories
    let calColor = '#10B981'; // Xanh lá
    if (calPct > 110) calColor = '#EF4444'; // Đỏ
    else if (calPct < 90) calColor = '#F59E0B'; // Cam

    doc.font('Bold').fontSize(10).fillColor(COLORS.black)
        .text(`Tổng Calories`, PAGE_MARGIN, y);
    doc.font('Bold').fontSize(10).fillColor(calColor)
        .text(`${avgCal} / ${targetCal} kcal (${calPct}%)`, PAGE_MARGIN, y, { align: 'right', width: doc.page.width - PAGE_MARGIN * 2 });

    y += 16;
    const barWidth = doc.page.width - PAGE_MARGIN * 2;
    // Nền thanh
    doc.save().rect(PAGE_MARGIN, y, barWidth, 12).fillColor(COLORS.grayLight).roundedRect(PAGE_MARGIN, y, barWidth, 12, 6).fill().restore();
    // Fill thanh
    const calFillW = Math.min(barWidth, (barWidth * calPct) / 100);
    if (calFillW > 0) {
        doc.save().rect(PAGE_MARGIN, y, calFillW, 12).fillColor(calColor).roundedRect(PAGE_MARGIN, y, calFillW, 12, 6).fill().restore();
    }

    y += 26;

    // Biểu đồ Macro Balance (Task 4: font 9→10pt, spacing 18→22px)
    const drawMacroBar = (label, actual, target, pct, color, startY, unit = 'g') => {
        // Tự động sang trang nếu hết chỗ (tránh bị đè lên footer)
        if (startY + 30 > doc.page.height - PAGE_MARGIN - 35) {
            doc.addPage();
            startY = PAGE_MARGIN;
        }

        doc.font('Regular').fontSize(10).fillColor(COLORS.gray).text(label, PAGE_MARGIN, startY);
        doc.font('Bold').fontSize(10).fillColor(COLORS.black).text(`${actual}${unit} / ${target}${unit} (${pct}%)`, PAGE_MARGIN, startY, { align: 'right', width: barWidth });

        startY += 14;
        // Nền thanh
        doc.save().rect(PAGE_MARGIN, startY, barWidth, 8).fillColor(COLORS.grayLight).roundedRect(PAGE_MARGIN, startY, barWidth, 8, 4).fill().restore();
        // Fill thanh
        const fillW = Math.min(barWidth, (barWidth * (pct || 0)) / 100);
        if (fillW > 0) {
            doc.save().rect(PAGE_MARGIN, startY, fillW, 8).fillColor(color).roundedRect(PAGE_MARGIN, startY, fillW, 8, 4).fill().restore();
        }
        return startY + 22;
    };

    y = drawMacroBar('Protein (Chất đạm)', avgP, macros.protein || 120, pctP, '#10B981', y);
    y = drawMacroBar('Carbohydrate (Tinh bột)', avgC, macros.carbs || 200, pctC, '#3B82F6', y);
    y = drawMacroBar('Lipid (Chất béo)', avgF, macros.fat || 60, pctF, '#F59E0B', y);
    
    // Vi chất dinh dưỡng
    y = drawMacroBar('Chất xơ', avgFiber, fiberTarget, fiberPct, '#8B5CF6', y, 'g');
    y = drawMacroBar('Vitamin A', avgVitA, vitATarget, vitAPct, '#EC4899', y, 'mcg');
    y = drawMacroBar('Vitamin C', avgVitC, vitCTarget, vitCPct, '#F43F5E', y, 'mg');
    y = drawMacroBar('Canxi', avgCalcium, calciumTarget, calciumPct, '#14B8A6', y, 'mg');
    y = drawMacroBar('Sắt', avgIron, ironTarget, ironPct, '#6366F1', y, 'mg');

    y += 10;

    // ── 3. Cân nặng & Vận động ──────────────────────────────────────────────
    if (y + 140 > doc.page.height - PAGE_MARGIN - 40) {
        doc.addPage();
        y = PAGE_MARGIN;
    }
    y = drawSectionTitle(doc, 'CÂN NẶNG & VẬN ĐỘNG', y);
    y += 4;

    const bodyRows = [
        ['Cân nặng đầu kỳ', summary.weightStart ? `${summary.weightStart} kg` : 'Chưa có dữ liệu'],
        ['Cân nặng cuối kỳ', summary.weightEnd ? `${summary.weightEnd} kg` : 'Chưa có dữ liệu'],
        ['Thay đổi cân nặng', summary.weightDelta !== null && summary.weightDelta !== undefined
            ? `${summary.weightDelta > 0 ? '+' : ''}${summary.weightDelta} kg`
            : 'Không đủ dữ liệu'],
        ['Tổng calo tiêu hao từ tập luyện', `${summary.totalExerciseCalories || 0} kcal`],
        ['Tỷ lệ tuân thủ calo mục tiêu', `${summary.calorieCompliance || 0}%  (${Math.round((summary.daysWithData || 0) * (summary.calorieCompliance || 0) / 100)} / ${summary.daysWithData || 0} ngày đạt chuẩn ±10%)`],
    ];

    bodyRows.forEach((row, i) => {
        drawInfoRow(doc, PAGE_MARGIN, y, row[0], row[1], i % 2 === 0);
        y += 20;
    });
    y += 10;

    // ── 4. TDEE Thích ứng ──────────────────────────────────────────────────
    if (y + 160 > doc.page.height - PAGE_MARGIN - 40) {
        doc.addPage();
        y = PAGE_MARGIN;
    }
    y = drawSectionTitle(doc, 'TDEE THÍCH ỨNG (ADAPTIVE TDEE)', y);
    y += 8;

    if (metrics.adaptiveTDEE && metrics.tdee) {
        const staticTDEE = metrics.tdee;
        const adaptiveTDEEVal = metrics.adaptiveTDEE;
        const diff = adaptiveTDEEVal - staticTDEE;
        const diffPct = Math.round((diff / staticTDEE) * 100) || 0;
        const diffSign = diff >= 0 ? '+' : '';

        const boxW = doc.page.width - PAGE_MARGIN * 2;
        const halfW = boxW / 2 - 4;

        // --- Ô TDEE Tĩnh (trái) ---
        doc.save()
            .rect(PAGE_MARGIN, y, halfW, 36)
            .fillColor(COLORS.zebraRow)
            .fill()
            .restore();
        doc.font('Regular').fontSize(8).fillColor(COLORS.gray)
            .text('TDEE Tĩnh (Mifflin-St Jeor)', PAGE_MARGIN + 6, y + 4, { width: halfW - 12 });
        doc.font('Bold').fontSize(11).fillColor(COLORS.black)
            .text(`${staticTDEE} kcal/ngày`, PAGE_MARGIN + 6, y + 16, { width: halfW - 12 });

        // --- Ô TDEE Thích ứng (phải) ---
        doc.save()
            .rect(PAGE_MARGIN + halfW + 8, y, halfW, 36)
            .fillColor(COLORS.light)
            .fill()
            .restore();
        doc.font('Regular').fontSize(8).fillColor(COLORS.accent)
            .text('TDEE Thích ứng (thực tế)', PAGE_MARGIN + halfW + 10, y + 4, { width: halfW - 12 });
        doc.font('Bold').fontSize(11).fillColor(COLORS.dark)
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

        doc.font('Regular').fontSize(8);
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
            doc.font('Bold').fontSize(8.5).fillColor(COLORS.dark)
                .text('Lịch sử TDEE thích ứng qua các tuần:', PAGE_MARGIN, y, { lineBreak: false });
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
                doc.font('Bold').fontSize(7.5).fillColor(COLORS.accent)
                    .text(col.label, ax + 4, y + 4, { width: col.width - 8, lineBreak: false });
                ax += col.width;
            });
            y += 15;

            // Hàm format ngày — khai báo một lần ngoài vòng lặp
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

            const sortedLogs = [...adaptiveTDEE].reverse();
            sortedLogs.forEach((log, idx) => {
                if (y + 14 > doc.page.height - PAGE_MARGIN - 40) {
                    doc.addPage();
                    y = PAGE_MARGIN;
                    
                    // Vẽ lại Header bảng
                    doc.save()
                        .rect(PAGE_MARGIN, y, boxW, 15)
                        .fillColor(COLORS.light)
                        .fill()
                        .restore();
                    let hx = PAGE_MARGIN;
                    aCols.forEach(col => {
                        doc.font('Bold').fontSize(7.5).fillColor(COLORS.accent)
                            .text(col.label, hx + 4, y + 4, { width: col.width - 8, lineBreak: false });
                        hx += col.width;
                    });
                    y += 15;
                }

                if (idx % 2 === 0) {
                    doc.save()
                        .rect(PAGE_MARGIN, y, boxW, 14)
                        .fillColor(COLORS.zebraRow)
                        .fill()
                        .restore();
                }

                const vals = [
                    fmtDate(log.weekStart),
                    fmtDate(log.weekEnd),
                    log.tdee ? Math.round(log.tdee).toLocaleString('vi-VN') : '–',
                    STATUS_LABELS[log.status] || log.status || '–',
                ];

                let bx = PAGE_MARGIN;
                vals.forEach((val, j) => {
                    doc.font(j === 2 ? FONT_BOLD : FONT_REGULAR).fontSize(7.5).fillColor(COLORS.black)
                        .text(val, bx + 4, y + 3, { width: aCols[j].width - 8, lineBreak: false });
                    bx += aCols[j].width;
                });
                y += 14;
            });
        }

    } else if (metrics.useAdaptiveTDEE && !metrics.adaptiveTDEE) {
        doc.font('Regular').fontSize(8.5).fillColor(COLORS.gray)
            .text('TDEE thích ứng chưa kích hoạt (cần ghi chép liên tục ≥2 tuần để hệ thống thu thập đủ dữ liệu cân nặng & calories).', PAGE_MARGIN + 6, y);
        y += 18;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TRANG 2: Đánh Giá Chuyên Sâu & Khuyến Nghị
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage();
    y = PAGE_MARGIN;

    doc.font('Bold').fontSize(14).fillColor(COLORS.dark)
        .text('ĐÁNH GIÁ CHUYÊN SÂU & GỢI Ý THỰC ĐƠN', PAGE_MARGIN, y, {
            width: doc.page.width - PAGE_MARGIN * 2,
        });
    y += 20;

    doc.font('Regular').fontSize(8.5).fillColor(COLORS.gray)
        .text(`Kỳ báo cáo: ${period.label}  •  ${period.rangeLabel}`, PAGE_MARGIN, y);
    y += 16;
    drawHRule(doc, y, '#E2E8F0');
    y += 15;

    // ── Health Score Card ──────────────────────────────────────
    y = drawSectionTitle(doc, 'ĐÁNH GIÁ CHỈ SỐ SỨC KHỎE', y);
    y += 12;

    const scoreBoxW = doc.page.width - PAGE_MARGIN * 2;
    
    // Tính chiều cao card dựa trên số lượng bonus
    const numBonuses = (healthScore && healthScore.bonuses && healthScore.bonuses.length > 0) ? healthScore.bonuses.length : 1;
    const scoreCardH = Math.max(70, 45 + numBonuses * 14);

    doc.save()
        .roundedRect(PAGE_MARGIN, y, scoreBoxW, scoreCardH, 6)
        .fillColor(COLORS.light)
        .fill()
        .restore();

    // Điểm số bên trái
    let scoreColor = '#EF4444'; // Red
    if (healthScore && healthScore.score >= 90) scoreColor = '#10B981'; // Green
    else if (healthScore && healthScore.score >= 75) scoreColor = '#3B82F6'; // Blue
    else if (healthScore && healthScore.score >= 60) scoreColor = '#F59E0B'; // Yellow

    doc.font('Bold').fontSize(28).fillColor(scoreColor)
        .text(`${healthScore && healthScore.score !== null && healthScore.score !== undefined ? healthScore.score : '–'}`, PAGE_MARGIN + 15, y + 15, { width: 50, align: 'center', lineBreak: false });
    
    doc.font('Regular').fontSize(10).fillColor(COLORS.gray)
        .text('/100', PAGE_MARGIN + 15, y + 45, { width: 50, align: 'center', lineBreak: false });

    // Label và emoji
    if (healthScore) {
        doc.font('Bold').fontSize(12).fillColor(COLORS.dark)
            .text(healthScore.label || '', PAGE_MARGIN + 80, y + 15);
    }

    // Bonuses
    let bonusY = y + 35;
    if (healthScore && healthScore.bonuses && healthScore.bonuses.length > 0) {
        healthScore.bonuses.forEach(b => {
            doc.font('Regular').fontSize(8.5).fillColor(COLORS.black)
                .text(`${b.label} (+${b.points}đ)`, PAGE_MARGIN + 80, bonusY);
            bonusY += 14;
        });
    } else {
        doc.font('Regular').fontSize(8.5).fillColor(COLORS.gray)
            .text('Chưa có thông tin điểm thưởng.', PAGE_MARGIN + 80, bonusY);
    }
    
    y += scoreCardH + 15;

    // ── Phân tích thực phẩm (Top Contributors) ───────────────────────────────────
    if (topFoods) {
        // Check tràn trang cho section title
        if (y + 130 > doc.page.height - PAGE_MARGIN - 40) {
            doc.addPage();
            y = PAGE_MARGIN;
        }

        y = drawSectionTitle(doc, 'PHÂN TÍCH THỰC PHẨM (TOP CONTRIBUTORS)', y);
        y += 10;
        
        const halfW = (doc.page.width - PAGE_MARGIN * 2 - 12) / 2;  // gap 12px giữa 2 cột
        const leftX = PAGE_MARGIN;
        const rightX = PAGE_MARGIN + halfW + 12;
        
        // Chỉ render Sugar (trái) và Sodium (phải)
        if ((topFoods.sugar && topFoods.sugar.length > 0) || (topFoods.sodium && topFoods.sodium.length > 0)) {
            if (y + 110 > doc.page.height - PAGE_MARGIN - 40) { doc.addPage(); y = PAGE_MARGIN; }
            const y2Left  = topFoods.sugar && topFoods.sugar.length > 0
                ? drawTopFoodsTable(doc, 'Đường (Sugar)', '', topFoods.sugar, 'g', leftX, y, halfW) : y;
            const y2Right = topFoods.sodium && topFoods.sodium.length > 0
                ? drawTopFoodsTable(doc, 'Natri (Sodium)', '', topFoods.sodium, 'mg', rightX, y, halfW) : y;
            let yRow = Math.max(y2Left, y2Right);
            if (yRow > y) y = yRow + 8;
        }

        y += 10;
    }

    // ── Phân tích chất lượng dinh dưỡng (Nutrient Density) ─────────
    if (foodScoringReport) {
        if (y + 200 > doc.page.height - PAGE_MARGIN - 40) {
            doc.addPage();
            y = PAGE_MARGIN;
        }

        y = drawSectionTitle(doc, 'PHÂN TÍCH CHẤT LƯỢNG DINH DƯỠNG (NUTRIENT DENSITY)', y);
        y += 12;

        const { stats, goodHabits, badHabits, scoredFoods } = foodScoringReport;

        // 1. Header Box
        let verdictColor = '#10B981'; // Green
        let verdictBgColor = '#ECFDF5'; // Green-50
        if (stats.weeklyVerdict === 'poor') {
            verdictColor = '#EF4444';
            verdictBgColor = '#FEF2F2';
        } else if (stats.weeklyVerdict === 'concerning') {
            verdictColor = '#F59E0B';
            verdictBgColor = '#FFFBEB';
        }

        doc.save()
            .roundedRect(PAGE_MARGIN, y, doc.page.width - PAGE_MARGIN * 2, 28, 4)
            .fillColor(verdictBgColor)
            .fill()
            .restore();

        const cleanVerdict = stats.weeklyVerdictLabel.replace(/^(🟢|🔴|🟡|🌟|🥤)\s*/, '');
        doc.font('Bold').fontSize(9.5).fillColor(verdictColor)
            .text(`${cleanVerdict}`, PAGE_MARGIN + 10, y + 8, { lineBreak: false });
        doc.font('Bold').fontSize(9.5).fillColor(COLORS.gray)
            .text(`Điểm chất lượng TB: ${stats.avgQualityScore}/100`, doc.page.width - PAGE_MARGIN - 150, y + 8, { width: 140, align: 'right', lineBreak: false });
        
        y += 40;

        // 2. Traffic Light Bar
        const barWidth = doc.page.width - PAGE_MARGIN * 2;
        const greenW = Math.max(0, (barWidth * stats.greenPercentage) / 100);
        const yellowW = Math.max(0, (barWidth * stats.yellowPercentage) / 100);
        const redW = Math.max(0, (barWidth * stats.redFlagPercentage) / 100);
        
        // Vẽ thanh ngang
        doc.save().rect(PAGE_MARGIN, y, barWidth, 10).fillColor(COLORS.grayLight).fill().restore(); // Fallback bg
        
        let curX = PAGE_MARGIN;
        if (greenW > 0) {
            doc.save().rect(curX, y, greenW, 10).fillColor('#10B981').fill().restore();
            curX += greenW;
        }
        if (yellowW > 0) {
            doc.save().rect(curX, y, yellowW, 10).fillColor('#F59E0B').fill().restore();
            curX += yellowW;
        }
        if (redW > 0) {
            doc.save().rect(curX, y, redW, 10).fillColor('#EF4444').fill().restore();
        }

        y += 14;
        
        // Labels for traffic light
        doc.font('Regular').fontSize(8).fillColor(COLORS.gray);
        doc.text(`${stats.greenPercentage}% Xanh`, PAGE_MARGIN, y, { width: barWidth / 3 });
        doc.text(`${stats.yellowPercentage}% Vàng`, PAGE_MARGIN, y, { width: barWidth, align: 'center' });
        doc.text(`${stats.redFlagPercentage}% Đỏ`, PAGE_MARGIN, y, { width: barWidth, align: 'right' });

        y += 20;

        // 3. Top Habits Tables (2 cột)
        const drawHabitTable = (title, data, isGood, startX, startY, colW) => {
            doc.font('Bold').fontSize(8.5).fillColor(COLORS.dark)
                .text(title, startX, startY);
            
            // Vẽ đường gạch ngang dưới title
            doc.save()
                .moveTo(startX, startY + 12)
                .lineTo(startX + colW, startY + 12)
                .strokeColor(COLORS.grayLight)
                .lineWidth(0.5)
                .stroke()
                .restore();

            let hY = startY + 18;
            if (data.length === 0) {
                doc.font('Regular').fontSize(8).fillColor(COLORS.gray)
                    .text('Không có dữ liệu.', startX, hY);
                return hY + 15;
            }

            data.forEach(item => {
                doc.font('Regular').fontSize(8).fillColor(COLORS.black)
                    .text(`${item.rank}. ${item.name} (${item.count} lần)`, startX, hY, { width: colW - 30, lineBreak: false });
                doc.font('Bold').fontSize(8).fillColor(isGood ? '#10B981' : '#EF4444')
                    .text(`[${item.qualityScore}đ]`, startX + colW - 30, hY, { width: 30, align: 'right' });
                
                hY += 12;
                if (item.badges && item.badges.length > 0) {
                    const cleanBadges = item.badges.map(b => b.replace(/^(🟢|🔴|🟡|🌟|🥤)\s*/, '')).join('  ');
                    doc.font('Regular').fontSize(7.5).fillColor(COLORS.gray)
                        .text(`   ${cleanBadges}`, startX, hY);
                    hY += 10;
                }
                hY += 4;
            });
            return hY;
        };

        const halfW = (doc.page.width - PAGE_MARGIN * 2 - 16) / 2;
        const yGood = drawHabitTable('TOP THÓI QUEN TỐT', goodHabits, true, PAGE_MARGIN, y, halfW);
        const yBad = drawHabitTable('THÓI QUEN CẦN LƯU Ý', badHabits, false, PAGE_MARGIN + halfW + 16, y, halfW);
        
        y = Math.max(yGood, yBad) + 15;

        // 4. Compact Traffic Light Table
        if (scoredFoods && scoredFoods.length > 0) {
            // Kiểm tra xem có đủ chỗ cho Header và 1 hàng không
            if (y + 40 > doc.page.height - PAGE_MARGIN - 40) {
                doc.addPage();
                y = PAGE_MARGIN;
            }

            // Vẽ bảng
            const drawCompactHeader = (startY) => {
                doc.save()
                    .rect(PAGE_MARGIN, startY, barWidth, 18)
                    .fillColor(COLORS.dark)
                    .fill()
                    .restore();

                const cCols = [
                    { label: 'Món ăn', w: 155, align: 'left' },
                    { label: 'Lần', w: 30, align: 'center' },
                    { label: 'Kcal', w: 40, align: 'center' },
                    { label: 'Natri', w: 55, align: 'center' },
                    { label: 'Đường', w: 55, align: 'center' },
                    { label: 'Đạm', w: 55, align: 'center' },
                    { label: 'Xơ', w: 55, align: 'center' },
                    { label: 'Điểm', w: 50, align: 'center' },
                ];

                let curX = PAGE_MARGIN;
                cCols.forEach(c => {
                    doc.font('Bold').fontSize(8).fillColor(COLORS.white)
                        .text(c.label, curX, startY + 5, { width: c.w, align: c.align });
                    curX += c.w;
                });
                return startY + 18;
            };

            y = drawCompactHeader(y);

            const cColsWidth = [155, 30, 40, 55, 55, 55, 55, 50];

            scoredFoods.forEach((item, index) => {
                if (y + 16 > doc.page.height - PAGE_MARGIN - 40) {
                    doc.addPage();
                    y = drawCompactHeader(PAGE_MARGIN);
                }

                // Nền hàng
                const sLevel = item.scoring.qualityLevel;
                let bgRow = index % 2 === 0 ? COLORS.white : COLORS.zebraRow;
                
                doc.save()
                    .rect(PAGE_MARGIN, y, barWidth, 16)
                    .fillColor(bgRow)
                    .fill()
                    .restore();

                // Màu nền cột điểm
                let scoreBg = '#F3F4F6';
                if (!item.scoring.skipped) {
                    if (sLevel === 'excellent') scoreBg = '#D1FAE5';
                    else if (sLevel === 'good') scoreBg = '#ECFDF5';
                    else if (sLevel === 'moderate') scoreBg = '#FEF3C7';
                    else if (sLevel === 'poor') scoreBg = '#FEE2E2';
                }

                doc.save()
                    .rect(PAGE_MARGIN + barWidth - 50, y, 50, 16)
                    .fillColor(scoreBg)
                    .fill()
                    .restore();

                const truncateString = (str, num) => {
                    if (str.length <= num) return str;
                    return str.slice(0, num) + '…';
                };

                const getNutriCellText = (nutriRes) => {
                    if (!nutriRes.available) return '–';
                    const val = Number(nutriRes.density);
                    if (Number.isFinite(val)) {
                        return Number.isInteger(val) ? `${val}` : val.toFixed(1);
                    }
                    return `${nutriRes.density}`;
                };

                const getNutriColor = (nutriRes) => {
                    if (!nutriRes.available) return COLORS.gray;
                    if (nutriRes.level === 'danger') return '#EF4444';
                    if (nutriRes.level === 'warning') return '#F59E0B';
                    if (nutriRes.level === 'safe' || nutriRes.level === 'good') return '#059669'; // Emerald-600
                    if (nutriRes.level === 'excellent') return '#059669';
                    return COLORS.black;
                };

                const isSkipped = item.scoring.skipped;
                
                const cData = [
                    { text: truncateString(item.name, 22), color: COLORS.black },
                    { text: `${item.count}`, color: COLORS.black },
                    { text: `${item.avgCaloriesPerServing}`, color: COLORS.black },
                    { text: isSkipped ? '–' : getNutriCellText(item.scoring.sodium), color: isSkipped ? COLORS.gray : getNutriColor(item.scoring.sodium) },
                    { text: isSkipped ? '–' : getNutriCellText(item.scoring.sugar), color: isSkipped ? COLORS.gray : getNutriColor(item.scoring.sugar) },
                    { text: isSkipped ? '–' : getNutriCellText(item.scoring.protein), color: isSkipped ? COLORS.gray : getNutriColor(item.scoring.protein) },
                    { text: isSkipped ? '–' : getNutriCellText(item.scoring.fiber), color: isSkipped ? COLORS.gray : getNutriColor(item.scoring.fiber) },
                    { text: isSkipped ? '–' : `${item.scoring.qualityScore}`, color: COLORS.black }
                ];

                let cx = PAGE_MARGIN;
                cData.forEach((cell, j) => {
                    const isCenter = j > 0;
                    doc.font(j === 7 && !isSkipped ? FONT_BOLD : FONT_REGULAR).fontSize(8).fillColor(cell.color)
                        .text(cell.text, cx + (isCenter ? 0 : 5), y + 4, { width: cColsWidth[j] - (isCenter ? 0 : 10), align: isCenter ? 'center' : 'left' });
                    cx += cColsWidth[j];
                });
                
                y += 16;
            });
            
            // Score Legend & Disclaimer
            y += 6;
            doc.font('Regular').fontSize(7.5).fillColor(COLORS.gray)
                .text(
                    'Chú giải:  0-39đ (Kém)  |  40-59đ (Trung bình)  |  60-79đ (Khá)  |  80-100đ (Lành mạnh)',
                    PAGE_MARGIN, y,
                    { width: doc.page.width - PAGE_MARGIN * 2, align: 'right' }
                );
            y += 12;
            doc.font('Regular').fontSize(7).fillColor('#9CA3AF') // Lighter gray for disclaimer
                .text(
                    '*Lưu ý: Thuật toán chấm điểm món ăn chỉ mang tính chất tham khảo tương đối dựa trên mật độ dinh dưỡng (Đạm, Xơ, Đường, Natri) trên 100 kcal. Khuyến nghị này không thay thế lời khuyên y khoa từ bác sĩ.',
                    PAGE_MARGIN, y,
                    { width: doc.page.width - PAGE_MARGIN * 2, align: 'right' }
                );
            y += 20;
        }
    }

    // ── Health Insights ───────────────────────────────────────────
    // Bảo vệ tràn trang cho section title
    if (y > doc.page.height - PAGE_MARGIN - 60) {
        doc.addPage();
        y = PAGE_MARGIN;
    }

    y = drawSectionTitle(doc, 'CẢNH BÁO DINH DƯỠNG (HEALTH INSIGHTS)', y);
    y += 12;

    if (!healthInsights || healthInsights.length === 0) {
        doc.save()
            .roundedRect(PAGE_MARGIN, y, scoreBoxW, 30, 4)
            .fillColor('#F9FAFB')
            .fill()
            .restore();
        
        doc.font('Regular').fontSize(9).fillColor(COLORS.gray)
            .text('Tuyệt vời! Không có cảnh báo dinh dưỡng nào đáng lo ngại.', PAGE_MARGIN + 10, y + 10);
        y += 45;
    } else {
        healthInsights.forEach(insight => {
            let barColor = COLORS.gray;
            let bgColor = '#F9FAFB';
            
            if (insight.severity === 'danger') { barColor = '#EF4444'; bgColor = '#FEF2F2'; }
            else if (insight.severity === 'warning') { barColor = '#F59E0B'; bgColor = '#FFFBEB'; }
            else if (insight.severity === 'water') { barColor = '#3B82F6'; bgColor = '#EFF6FF'; }
            else if (insight.severity === 'suggestion') { barColor = '#6B7280'; bgColor = '#F3F4F6'; }

            // Tính chiều cao của insight box
            doc.font('Bold').fontSize(10);
            const titleH = doc.heightOfString(insight.title, { width: scoreBoxW - 24 });
            doc.font('Regular').fontSize(9.5);
            const messageH = doc.heightOfString(insight.message, { width: scoreBoxW - 24 });
            
            const insightH = titleH + messageH + 24;

            // Bảo vệ tràn trang cho từng insight
            if (y + insightH > doc.page.height - PAGE_MARGIN - 40) {
                doc.addPage();
                y = PAGE_MARGIN;
            }

            // Nền box
            doc.save()
                .roundedRect(PAGE_MARGIN, y, scoreBoxW, insightH, 4)
                .fillColor(bgColor)
                .fill()
                .restore();

            // Thanh màu bên trái
            doc.save()
                .rect(PAGE_MARGIN, y, 4, Math.max(insightH, 0)) // Avoid negative values, just in case
                .fillColor(barColor)
                .fill()
                .restore();

            // Nội dung (Task 4: font 9→10pt, message 8.5→9.5pt)
            doc.font('Bold').fontSize(10).fillColor(COLORS.black)
                .text(insight.title, PAGE_MARGIN + 12, y + 12, { width: scoreBoxW - 24 });
            
            doc.font('Regular').fontSize(9.5).fillColor(COLORS.gray)
                .text(insight.message, PAGE_MARGIN + 12, y + 12 + titleH + 4, { width: scoreBoxW - 24 });

            y += insightH + 8;
        });
    }

    // ── Kế hoạch hành động từ TDEE Thích ứng (Actionable Insights) ───────────
    const insightBoxW = doc.page.width - PAGE_MARGIN * 2;
    const insightText = adaptiveInsight.message || '';
    
    // Tính chiều cao của box dựa trên độ dài tin nhắn
    doc.font('Regular').fontSize(8.5);
    const insightTextH = doc.heightOfString(insightText, { width: insightBoxW - 24, lineGap: 2 });
    
    let boxTotalH = insightTextH + 16;
    if (adaptiveInsight.hasData && adaptiveInsight.isPlateauing && adaptiveInsight.currentTargetCalories !== adaptiveInsight.suggestedTargetCalories) {
        boxTotalH += 45; // Thêm chiều cao cho bảng so sánh
    }

    // Bảo vệ tràn trang: title(22) + margin(12) + boxTotalH
    if (y + 34 + boxTotalH > doc.page.height - PAGE_MARGIN - 40) {
        doc.addPage();
        y = PAGE_MARGIN;
    }

    y = drawSectionTitle(doc, 'KẾ HOẠCH HÀNH ĐỘNG CHO TUẦN TỚI (ACTIONABLE INSIGHTS)', y);
    y += 12;

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
    doc.save()
        .roundedRect(PAGE_MARGIN, y, insightBoxW, boxTotalH, 6)
        .fillColor(insightBgColor)
        .fill()
        .restore();

    // Vẽ text tin nhắn
    doc.font('Regular').fontSize(9.5).fillColor(insightTextColor)
        .text(insightText, PAGE_MARGIN + 12, y + 8, { width: insightBoxW - 24, lineGap: 2 });

    // Nếu đang chững cân, vẽ thêm bảng so sánh 2 cột nổi bật (chỉ vẽ khi có sự thay đổi mục tiêu)
    if (adaptiveInsight.hasData && adaptiveInsight.isPlateauing && adaptiveInsight.currentTargetCalories !== adaptiveInsight.suggestedTargetCalories) {
        const compareY = y + insightTextH + 16;
        const colW = (insightBoxW - 32) / 2;

        // Cột trái: Hiện tại
        doc.save()
            .roundedRect(PAGE_MARGIN + 12, compareY, colW, 28, 4)
            .fillColor(COLORS.white)
            .fill()
            .restore();
        doc.font('Regular').fontSize(8).fillColor(COLORS.gray)
            .text('Mục tiêu hiện tại:', PAGE_MARGIN + 18, compareY + 4, { lineBreak: false });
        doc.font('Bold').fontSize(9.5).fillColor(COLORS.black)
            .text(`${adaptiveInsight.currentTargetCalories} kcal/ngày`, PAGE_MARGIN + 18, compareY + 14, { lineBreak: false });

        // Cột phải: Đề xuất
        doc.save()
            .roundedRect(PAGE_MARGIN + 12 + colW + 8, compareY, colW, 28, 4)
            .fillColor('#F0FDF4') // Green-50
            .fill()
            .restore();
        doc.font('Regular').fontSize(8).fillColor('#047857') // Green-700
            .text('Mục tiêu đề xuất mới:', PAGE_MARGIN + 18 + colW + 8, compareY + 4, { lineBreak: false });
        
        const currentCal = adaptiveInsight.currentTargetCalories;
        const suggestedCal = adaptiveInsight.suggestedTargetCalories;
        let arrow = '';
        if (suggestedCal > currentCal) arrow = '↑';
        else if (suggestedCal < currentCal) arrow = '↓';

        doc.font('Bold').fontSize(9.5).fillColor('#065F46') // Green-800
            .text(`${suggestedCal} kcal/ngày  ${arrow}`, PAGE_MARGIN + 18 + colW + 8, compareY + 14, { lineBreak: false });
    }

    y += boxTotalH + 15;

    // ── Khuyến nghị từ hệ thống (Recommendations) ─────────────────────────
    // Bảo vệ tràn trang: cần ít nhất 180px để vẽ section title + ít nhất 1 dòng khuyến nghị
    if (y > doc.page.height - PAGE_MARGIN - 40 - 180) {
        doc.addPage();
        y = PAGE_MARGIN;
    }
    y = drawSectionTitle(doc, 'GỢI Ý THỰC ĐƠN & LỐI SỐNG (AI RECOMMENDATIONS)', y);
    y += 12;

    const recs = [];
    if (pctP < 70) {
        recs.push('Tăng cường chất đạm (Protein): Lượng đạm của bạn hơi thấp. Nên bổ sung thêm các thực phẩm giàu protein như: Ức gà, Trứng luộc, Cá hồi, Thịt bò nạc hoặc đậu nành để duy trì cơ bắp.');
    }
    if (fiberPct < 70) {
        recs.push('Tăng cường chất xơ (Fiber): Lượng xơ chưa đạt tiêu chuẩn IOM. Hãy bổ sung thêm các loại rau củ như: Bông cải xanh, Khoai lang, Rau muống hoặc Yến mạch trong các bữa ăn chính.');
    }
    if (pctF > 110) {
        recs.push('Kiểm soát chất béo (Fat): Lượng chất béo trung bình nạp vào cao hơn mục tiêu. Hạn chế các món chiên rán nhiều dầu mỡ, tăng cường các món luộc, hấp hoặc dùng chất béo tốt từ quả bơ, hạt điều.');
    }
    if (summary.avgWater < 1500) {
        recs.push('Bổ sung nước uống: Cơ thể bạn đang thiếu nước nghiêm trọng (trung bình dưới 1.5L/ngày). Hãy trang bị một bình nước lớn 2L ngay bàn học/bàn làm việc để tạo thói quen uống nước đều đặn.');
    } else if (waterPct < 90) {
        recs.push('Tăng lượng nước uống: Bạn chưa uống đủ lượng nước mục tiêu khuyến nghị. Cố gắng uống thêm 1-2 ly nước vào các thời điểm cố định trong ngày.');
    }
    if (summary.totalExerciseCalories === 0) {
        recs.push('Kích hoạt vận động: Bạn có lối sống khá tĩnh tại trong kỳ báo cáo (0 kcal tập luyện). Nên dành ít nhất 15-20 phút đi bộ nhanh hoặc tập thể dục nhẹ mỗi ngày để kích hoạt cơ chế trao đổi chất tốt hơn.');
    } else {
        recs.push('Duy trì thể lực: Bạn vận động rất tốt với tổng cộng ' + summary.totalExerciseCalories + ' kcal tiêu thụ từ tập luyện. Hãy tiếp tục duy trì thói quen tập luyện đều đặn này!');
    }

    // Gợi ý thực đơn theo mục tiêu
    if (user.goal.includes('Giảm cân')) {
        recs.push('Gợi ý thực đơn giảm cân: Ưu tiên các thực phẩm giàu thể tích nhưng ít calo như dưa chuột, bí ngòi, và các loại rau lá xanh đậm. Sử dụng Meal Planner trên ứng dụng để tối ưu khối lượng bữa ăn.');
    } else if (user.goal.includes('Tăng cân')) {
        recs.push('Gợi ý thực đơn tăng cân: Bổ sung thêm các bữa phụ dinh dưỡng bằng hạt sấy khô, sữa tươi nguyên kem, bơ đậu phộng để tăng calo tự nhiên mà không gây đầy bụng.');
    } else {
        recs.push('Gợi ý duy trì sức khỏe: Duy trì tỷ lệ dinh dưỡng cân bằng. Ăn uống đa dạng nguồn thực phẩm, kết hợp nhiều màu sắc rau củ và không bỏ bữa.');
    }

    // Tính toán chiều cao khối Recommendations
    doc.font('Regular').fontSize(9.5);
    let recsBoxH = 14; // padding top 10 + bottom 4
    recs.forEach(rec => {
        recsBoxH += doc.heightOfString(rec, { width: doc.page.width - PAGE_MARGIN * 2 - 24, lineGap: 2.5 }) + 8;
    });

    // Bảo vệ tràn trang
    if (y + 34 + recsBoxH > doc.page.height - PAGE_MARGIN - 40) {
        doc.addPage();
        y = PAGE_MARGIN;
    }

    const recsBoxY = y;
    doc.save()
        .roundedRect(PAGE_MARGIN, recsBoxY, doc.page.width - PAGE_MARGIN * 2, recsBoxH, 6)
        .fillColor(COLORS.light)
        .fill()
        .restore();

    let ry = recsBoxY + 10;
    recs.forEach(rec => {
        doc.font('Regular').fontSize(9.5).fillColor(COLORS.dark)
            .text(rec, PAGE_MARGIN + 12, ry, { width: doc.page.width - PAGE_MARGIN * 2 - 24, lineGap: 2.5 });
        ry += doc.heightOfString(rec, { width: doc.page.width - PAGE_MARGIN * 2 - 24, lineGap: 2.5 }) + 8;
    });

    // ═══════════════════════════════════════════════════════════════════════
    // TRANG 3: Bảng Nhật Ký Chi Tiết
    // ═══════════════════════════════════════════════════════════════════════
    doc.addPage();
    y = PAGE_MARGIN;

    doc.font('Bold').fontSize(14).fillColor(COLORS.dark)
        .text('CHI TIẾT THEO NGÀY', PAGE_MARGIN, y, {
            width: doc.page.width - PAGE_MARGIN * 2,
        });
    y += 20;

    doc.font('Regular').fontSize(8.5).fillColor(COLORS.gray)
        .text(`Kỳ báo cáo: ${period.label}`, PAGE_MARGIN, y);
    y += 16;
    drawHRule(doc, y, '#E2E8F0');
    y += 15;

    // ── Bảng nhật ký 7 cột (Task 3: thêm Protein, Carbs, Fat — bỏ Nước & Tập) ──
    const cols = [
        { label: 'Ngày',       width: 55 },
        { label: 'Cân (kg)',   width: 65 },
        { label: 'Calories',   width: 80 },
        { label: 'Protein',    width: 65 },
        { label: 'Carbs',      width: 65 },
        { label: 'Fat',        width: 65 },
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
            doc.font('Bold').fontSize(9).fillColor(COLORS.white)
                .text(col.label, currentX + 6, startY + 5, { width: col.width - 12 });
            currentX += col.width;
        });
        return startY + 20;
    };

    y = drawTableHeader(y);

    const getStatus = (calories, target) => {
        if (!target) return { label: 'B.thường', color: '#6B7280', dot: '#9CA3AF' };
        const pct = calories / target;
        if (pct < 0.9) return { label: 'Thiếu', color: '#92400E', dot: '#F59E0B' };
        if (pct > 1.1) return { label: 'Vượt', color: '#991B1B', dot: '#EF4444' };
        return { label: 'Đạt', color: '#065F46', dot: '#10B981' };
    };

    const allRows = [...dailyLog];

    if (allRows.length === 0) {
        doc.save()
            .rect(PAGE_MARGIN, y, tableWidth, 20)
            .fillColor(COLORS.zebraRow)
            .fill()
            .restore();
        doc.font('Regular').fontSize(8.5).fillColor(COLORS.gray)
            .text('Chưa có dữ liệu nhật ký cho kỳ này.', PAGE_MARGIN + 6, y + 6, { width: tableWidth - 12 });
        y += 20;
    } else {
        allRows.forEach((row, i) => {
            if (y + 18 > doc.page.height - PAGE_MARGIN - 40) {
                doc.addPage();
                doc.font('Bold').fontSize(10).fillColor(COLORS.dark)
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
                row.weight ? `${row.weight}` : '–',
                `${row.calories}`,
                `${row.protein !== undefined ? row.protein : '–'}g`,
                `${row.carbs !== undefined ? row.carbs : '–'}g`,
                `${row.fat !== undefined ? row.fat : '–'}g`,
                status.label
            ];

            let cx = PAGE_MARGIN;
            rowData.forEach((val, j) => {
                const isStatusCol = j === 6;
                if (isStatusCol) {
                    // Vẽ dot tròn màu
                    doc.save()
                        .circle(cx + 12, y + 9, 3)
                        .fillColor(status.dot)
                        .fill()
                        .restore();
                    // Text trạng thái bên cạnh dot, màu tối, Bold
                    doc.font('Bold').fontSize(9).fillColor(status.color)
                        .text(String(val), cx + 20, y + 5, { width: cols[j].width - 26 });
                } else {
                    doc.font(j === 0 ? FONT_BOLD : FONT_REGULAR).fontSize(9).fillColor(COLORS.black)
                        .text(String(val), cx + 6, y + 5, { width: cols[j].width - 12 });
                }
                cx += cols[j].width;
            });
            y += 18;
        });

        // Hàng trung bình / Tổng kết dưới cùng
        if (y + 20 > doc.page.height - PAGE_MARGIN - 40) {
            doc.addPage();
            doc.font('Bold').fontSize(10).fillColor(COLORS.dark)
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
            summary.weightEnd ? `${summary.weightEnd}` : '–',
            `${summary.avgCalories || 0}`,
            `${summary.avgProtein !== undefined ? summary.avgProtein : '–'}g`,
            `${summary.avgCarbs !== undefined ? summary.avgCarbs : '–'}g`,
            `${summary.avgFat !== undefined ? summary.avgFat : '–'}g`,
            getStatus(summary.avgCalories, metrics.targetCalories).label
        ];

        let cx = PAGE_MARGIN;
        avgData.forEach((val, j) => {
            const isStatusCol = j === 6;
            if (isStatusCol) {
                // Dot màu trắng trên nền xanh
                doc.save()
                    .circle(cx + 12, y + 10, 3)
                    .fillColor(COLORS.white)
                    .fill()
                    .restore();
                doc.font('Bold').fontSize(9).fillColor(COLORS.white)
                    .text(String(val), cx + 20, y + 6, { width: cols[j].width - 26 });
            } else {
                doc.font('Bold').fontSize(9).fillColor(COLORS.white)
                    .text(String(val), cx + 6, y + 6, { width: cols[j].width - 12 });
            }
            cx += cols[j].width;
        });
        y += 20;
    }

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

module.exports = { generateReportPDF, renderAllFooters };
