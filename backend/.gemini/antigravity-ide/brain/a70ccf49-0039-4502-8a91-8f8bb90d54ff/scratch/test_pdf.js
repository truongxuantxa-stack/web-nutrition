'use strict';

const fs = require('fs');
const path = require('path');

const pdfServicePath = 'C:\\Users\\Hi Windows 10\\Desktop\\webdinhduong\\backend\\services\\pdf.service.js';
const { generateReportPDF } = require(pdfServicePath);

const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// ──────────────────────────────────────────────────────────────────────────────
// TEST CASE 1: 7 ngày, chững cân (lose_weight), dùng Adaptive TDEE
// ──────────────────────────────────────────────────────────────────────────────
const mockDataWeek = {
    user: {
        fullName: 'Nguyễn Văn Chững Cân',
        email: 'adaptivedemo@gmail.com',
        gender: 'Nam',
        age: 22,
        height: 175,
        weight: 80,
        goal: 'Giảm cân'
    },
    period: {
        startDate: new Date('2026-05-17'),
        endDate: new Date('2026-05-24'),
        label: '17/05/2026 — 24/05/2026',
        totalDays: 7,
        rangeLabel: '7 ngày gần đây'
    },
    metrics: {
        bmi: 26.1,
        bmiClass: 'Thừa cân',
        bmr: 1750,
        tdee: 2500,
        adaptiveTDEE: 2200,
        useAdaptiveTDEE: true,
        targetCalories: 2000,
        macros: { protein: 140, carbs: 220, fat: 60 },
        macroRatios: { protein: 28, carbs: 44, fat: 28 },
        waterGoal: 2500
    },
    dailyLog: [
        { date: '2026-05-18', dateFormatted: '18/05', weight: 80.2, calories: 1950, water: 2600, exerciseBurned: 350 },
        { date: '2026-05-19', dateFormatted: '19/05', weight: 80.0, calories: 2050, water: 2400, exerciseBurned: 400 },
        { date: '2026-05-20', dateFormatted: '20/05', weight: 79.9, calories: 1900, water: 2500, exerciseBurned: 0 },
        { date: '2026-05-21', dateFormatted: '21/05', weight: 79.8, calories: 2400, water: 1500, exerciseBurned: 200 },
        { date: '2026-05-22', dateFormatted: '22/05', weight: 79.7, calories: 1500, water: 2800, exerciseBurned: 500 },
        { date: '2026-05-23', dateFormatted: '23/05', weight: 79.6, calories: 1980, water: 2500, exerciseBurned: 300 },
        { date: '2026-05-24', dateFormatted: '24/05', weight: 79.5, calories: 2010, water: 2700, exerciseBurned: 450 }
    ],
    summary: {
        avgCalories: 1970,
        avgProtein: 135,
        avgCarbs: 210,
        avgFat: 58,
        avgFiber: 24,
        avgWater: 2428,
        totalExerciseCalories: 2200,
        calorieCompliance: 71,
        daysWithData: 7,
        weightStart: 80.2,
        weightEnd: 79.5,
        weightDelta: -0.7
    },
    adaptiveTDEE: [
        { weekStart: '2026-05-03', weekEnd: '2026-05-10', tdee: 2450, rollingTDEE: 2450, status: 'applied' },
        { weekStart: '2026-05-10', weekEnd: '2026-05-17', tdee: 2300, rollingTDEE: 2375, status: 'applied' },
        { weekStart: '2026-05-17', weekEnd: '2026-05-24', tdee: 2200, rollingTDEE: 2200, status: 'applied' }
    ],
    adaptiveInsight: {
        hasData: true,
        staticTDEE: 2500,
        adaptiveTDEE: 2200,
        diff: -300,
        diffPct: -12.0,
        isPlateauing: true,
        suggestedTargetCalories: 1700,
        currentTargetCalories: 2000,
        message: '⚡ Cơ thể bạn đang có dấu hiệu thích ứng chuyển hóa (chững cân). TDEE thực tế đã giảm xuống 2200 kcal/ngày (thấp hơn 12.0% so với công thức tĩnh). Hệ thống đề xuất bạn điều chỉnh Mục tiêu Calo cho tuần tới về mức 1700 kcal/ngày để tiếp tục giảm mỡ an toàn.'
    },
    isEmpty: false
};

// ──────────────────────────────────────────────────────────────────────────────
// TEST CASE 2: 30 ngày, bình thường (maintain_weight), không chững cân, bảng dài
// ──────────────────────────────────────────────────────────────────────────────
const generate30DaysLog = () => {
    const log = [];
    let weight = 65.0;
    for (let i = 1; i <= 30; i++) {
        weight -= (Math.random() * 0.1 - 0.05);
        log.push({
            date: `2026-05-${String(i).padStart(2, '0')}`,
            dateFormatted: `${String(i).padStart(2, '0')}/05`,
            weight: Math.round(weight * 10) / 10,
            calories: 2050 + Math.round(Math.random() * 200 - 100),
            water: 2100 + Math.round(Math.random() * 400 - 200),
            exerciseBurned: Math.random() > 0.3 ? 250 + Math.round(Math.random() * 150) : 0
        });
    }
    return log;
};

const mockDataMonth = {
    user: {
        fullName: 'Trần Thị Bình Thường',
        email: 'normaldemo@gmail.com',
        gender: 'Nữ',
        age: 20,
        height: 160,
        weight: 65,
        goal: 'Duy trì cân nặng'
    },
    period: {
        startDate: new Date('2026-04-25'),
        endDate: new Date('2026-05-24'),
        label: '25/04/2026 — 24/05/2026',
        totalDays: 30,
        rangeLabel: '30 ngày gần đây'
    },
    metrics: {
        bmi: 25.4,
        bmiClass: 'Tiền béo phì',
        bmr: 1400,
        tdee: 2000,
        adaptiveTDEE: 2020,
        useAdaptiveTDEE: true,
        targetCalories: 2000,
        macros: { protein: 100, carbs: 250, fat: 60 },
        macroRatios: { protein: 20, carbs: 50, fat: 30 },
        waterGoal: 2000
    },
    dailyLog: generate30DaysLog(),
    summary: {
        avgCalories: 2050,
        avgProtein: 98,
        avgCarbs: 245,
        avgFat: 59,
        avgFiber: 26,
        avgWater: 2120,
        totalExerciseCalories: 5600,
        calorieCompliance: 90,
        daysWithData: 30,
        weightStart: 65.0,
        weightEnd: 64.6,
        weightDelta: -0.4
    },
    adaptiveTDEE: [
        { weekStart: '2026-04-27', weekEnd: '2026-05-04', tdee: 2010, rollingTDEE: 2010, status: 'applied' },
        { weekStart: '2026-05-04', weekEnd: '2026-05-11', tdee: 1980, rollingTDEE: 1995, status: 'applied' },
        { weekStart: '2026-05-11', weekEnd: '2026-05-18', tdee: 2030, rollingTDEE: 2015, status: 'applied' },
        { weekStart: '2026-05-18', weekEnd: '2026-05-24', tdee: 2020, rollingTDEE: 2020, status: 'applied' }
    ],
    adaptiveInsight: {
        hasData: true,
        staticTDEE: 2000,
        adaptiveTDEE: 2020,
        diff: 20,
        diffPct: 1.0,
        isPlateauing: false,
        suggestedTargetCalories: 2020,
        currentTargetCalories: 2000,
        message: '✅ TDEE thích ứng xác nhận công thức tĩnh đang phản ánh chính xác cơ địa thực tế của bạn. Hãy tiếp tục duy trì chế độ ăn hiện tại.'
    },
    isEmpty: false
};

// Chạy xuất file
const runTest = (data, filename) => {
    const outputPath = path.join(outputDir, filename);
    try {
        const doc = generateReportPDF(data);
        const writeStream = fs.createWriteStream(outputPath);
        doc.pipe(writeStream);
        
        writeStream.on('finish', () => {
            console.log(`✅ Xuất thành công: ${filename}`);
        });
    } catch (err) {
        console.error(`❌ Lỗi generateReportPDF cho ${filename}:`, err);
    }
};

runTest(mockDataWeek, 'baocao-test-7ngay-chungkhoa.pdf');
runTest(mockDataMonth, 'baocao-test-30ngay-binhthuong.pdf');
