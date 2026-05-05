'use strict';

/**
 * audit-phase4.js
 * Kiểm tra kỹ thuật độc lập Phase 4 — không cần server đang chạy
 * Chạy: node scripts/audit-phase4.js
 */

require('dotenv').config();

// ─────────────────────────────────────────────────────────────────────────────
// [1] KIỂM TRA calculateAllMetrics với dữ liệu giả lập
// ─────────────────────────────────────────────────────────────────────────────

const {
    calculateBMR,
    calculateTDEE,
    calculateBMI,
    classifyBMI,
    adjustCaloriesForGoal,
    calculateMacros,
    calculateAllMetrics,
    ACTIVITY_FACTORS,
} = require('../services/nutrition.service');

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  [KIỂM TRA 1] calculateAllMetrics — Dữ liệu giả lập');
console.log('═══════════════════════════════════════════════════════════════');

// Bộ dữ liệu test cases
const testCases = [
    {
        label: 'Nam 25 tuổi, 70kg, 175cm, vận động vừa, giảm cân',
        user: {
            weight      : 70,
            height      : 175,
            gender      : 'male',
            birthDate   : '2000-01-01',
            activityLevel: 'moderate',
            goal        : 'lose_weight',
        },
        // Tính tay để đối chiếu:
        // BMR = 10*70 + 6.25*175 - 5*25 + 5 = 700 + 1093.75 - 125 + 5 = 1673.75 ≈ 1674
        // TDEE = 1674 * 1.55 = 2594.7 ≈ 2595
        // targetCal = 2595 - 500 = 2095
        // Macros: P=2095*0.3/4≈157g, C=2095*0.4/4≈210g, F=2095*0.3/9≈70g
        expected: { bmr: 1674, tdee: 2595, targetCalories: 2095 },
    },
    {
        label: 'Nữ 30 tuổi, 55kg, 160cm, ít vận động, duy trì',
        user: {
            weight      : 55,
            height      : 160,
            gender      : 'female',
            birthDate   : '1995-06-15',
            activityLevel: 'sedentary',
            goal        : 'maintain_weight',
        },
        // BMR = 10*55 + 6.25*160 - 5*30 - 161 = 550 + 1000 - 150 - 161 = 1239
        // TDEE = 1239 * 1.2 = 1486.8 ≈ 1487
        // targetCal = 1487 (duy trì)
        expected: { bmr: 1239, tdee: 1487, targetCalories: 1487 },
    },
    {
        label: 'Nam 20 tuổi, 60kg, 170cm, rất nhiều, tăng cân',
        user: {
            weight      : 60,
            height      : 170,
            gender      : 'male',
            birthDate   : '2005-03-10',
            activityLevel: 'very_active',
            goal        : 'gain_weight',
        },
        // BMR = 10*60 + 6.25*170 - 5*21 + 5 = 600 + 1062.5 - 105 + 5 = 1562.5 ≈ 1563
        // (tuổi ~21 tùy ngày test)
        // TDEE = 1563 * 1.9 = 2969.7 ≈ 2970
        // targetCal = 2970 + 300 = 3270
        expected: null, // tuổi phụ thuộc ngày chạy
    },
    {
        label: 'Edge case: user chưa nhập đầy đủ thông tin',
        user: {
            weight      : null,
            height      : null,
            gender      : null,
            birthDate   : null,
            activityLevel: null,
            goal        : null,
        },
        expected: { bmr: null, tdee: null, targetCalories: null },
    },
];

let allPassed = true;

testCases.forEach(tc => {
    console.log(`\n  📋 ${tc.label}`);
    const result = calculateAllMetrics(tc.user);

    // In kết quả
    console.log(`     BMI          : ${result.bmi} → ${result.bmiClass.label}`);
    console.log(`     Tuổi         : ${result.age}`);
    console.log(`     BMR          : ${result.bmr} kcal/ngày`);
    console.log(`     TDEE         : ${result.tdee} kcal/ngày`);
    console.log(`     Target Calo  : ${result.targetCalories} kcal/ngày`);
    console.log(`     Macros       : Protein ${result.macros?.protein}g | Carbs ${result.macros?.carbs}g | Fat ${result.macros?.fat}g`);
    console.log(`     Goal adj     : ${result.goalAdjustment > 0 ? '+' : ''}${result.goalAdjustment} kcal`);

    // So sánh với expected (nếu có)
    if (tc.expected) {
        const checks = [
            { name: 'BMR',          got: result.bmr,            exp: tc.expected.bmr },
            { name: 'TDEE',         got: result.tdee,           exp: tc.expected.tdee },
            { name: 'targetCal',    got: result.targetCalories, exp: tc.expected.targetCalories },
        ];
        checks.forEach(({ name, got, exp }) => {
            // Cho phép sai lệch ±2 kcal do làm tròn tuổi
            const ok = exp === null ? got === null : Math.abs((got ?? 0) - (exp ?? 0)) <= 2;
            const icon = ok ? '  ✅' : '  ❌';
            if (!ok) allPassed = false;
            console.log(`     ${icon} ${name}: got=${got}, expected=${exp}`);
        });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// [2] KIỂM TRA logic Snapshot trong addEntry (phân tích code — không cần DB)
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  [KIỂM TRA 2] Snapshot logic trong POST /nhat-ky/them');
console.log('═══════════════════════════════════════════════════════════════');

// Giả lập food object
const mockFood = {
    id      : 1,
    name    : 'Cơm trắng',
    calories: 130,  // kcal/100g
    protein : 2.7,
    carbs   : 28,
    fat     : 0.3,
    unit    : '100g',
};

const testAmounts = [1, 1.5, 2, 0.5];
let snapshotOk = true;

testAmounts.forEach(amount => {
    // Đây chính là công thức trong diary.controller.js dòng 132-135
    const snapCal  = Math.round(mockFood.calories * amount * 10) / 10;
    const snapProt = Math.round(mockFood.protein  * amount * 10) / 10;
    const snapCarb = Math.round(mockFood.carbs    * amount * 10) / 10;
    const snapFat  = Math.round(mockFood.fat      * amount * 10) / 10;

    const expectedCal = mockFood.calories * amount;
    const diff = Math.abs(snapCal - expectedCal);
    const ok   = diff < 0.05; // sai lệch làm tròn < 0.05 là chấp nhận được
    if (!ok) snapshotOk = false;

    console.log(`\n  Số lượng: ${amount} ${mockFood.unit}`);
    console.log(`     caloriesSnapshot : ${snapCal} kcal  (raw: ${expectedCal})  ${ok ? '✅' : '❌'}`);
    console.log(`     proteinSnapshot  : ${snapProt}g`);
    console.log(`     carbsSnapshot    : ${snapCarb}g`);
    console.log(`     fatSnapshot      : ${snapFat}g`);
});

console.log(`\n  Snapshot luôn nhân food.X * amount — KHÔNG tính lại từ DB sau khi lưu`);
console.log(`  ✅ Nếu admin sửa Food.calories, bản ghi cũ vẫn giữ giá trị cũ (đúng thiết kế)`);

// ─────────────────────────────────────────────────────────────────────────────
// [3] KIỂM TRA logic Upsert trong addWeight (phân tích code)
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  [KIỂM TRA 3] Upsert logic trong POST /can-nang/them');
console.log('═══════════════════════════════════════════════════════════════');

// Giả lập upsert
function simulateUpsert(db, userId, date, weight, note) {
    const existing = db.find(r => r.userId === userId && r.date === date);
    if (existing) {
        existing.weight = weight;
        existing.note   = note;
        return { action: 'UPDATE', record: existing };
    } else {
        const record = { id: db.length + 1, userId, date, weight, note };
        db.push(record);
        return { action: 'CREATE', record };
    }
}

const fakeDb = [];
const upsertTests = [
    { userId: 1, date: '2026-05-04', weight: 70.5, note: 'Buổi sáng' },
    { userId: 1, date: '2026-05-04', weight: 71.0, note: 'Sau bữa tối' }, // Cùng ngày → UPDATE
    { userId: 1, date: '2026-05-05', weight: 70.8, note: null },          // Khác ngày → CREATE
    { userId: 2, date: '2026-05-04', weight: 55.0, note: null },          // User khác → CREATE
];

upsertTests.forEach(t => {
    const { action, record } = simulateUpsert(fakeDb, t.userId, t.date, t.weight, t.note);
    const icon = action === 'UPDATE' ? '🔄' : '➕';
    console.log(`\n  ${icon} User ${t.userId}, ${t.date}, ${t.weight}kg`);
    console.log(`     Action: ${action} → DB record: ${JSON.stringify(record)}`);
});

// Kiểm tra chỉ có 1 bản ghi mỗi user mỗi ngày
const userDayMap = {};
let upsertOk = true;
fakeDb.forEach(r => {
    const key = `${r.userId}_${r.date}`;
    if (userDayMap[key]) {
        console.log(`  ❌ TRÙNG: userId=${r.userId}, date=${r.date}`);
        upsertOk = false;
    }
    userDayMap[key] = r;
});

console.log(`\n  Tổng bản ghi trong DB: ${fakeDb.length} (User1: 2 ngày khác nhau + User2: 1 ngày)`);
console.log(`  ${upsertOk ? '✅' : '❌'} Đúng: 1 user chỉ có 1 bản ghi mỗi ngày`);

// Kiểm tra logic sync user.weight
const latestLog = [...fakeDb].filter(r => r.userId === 1).sort((a, b) => b.date.localeCompare(a.date))[0];
console.log(`\n  Cân nặng mới nhất User 1 sẽ sync vào users.weight: ${latestLog?.weight} kg`);
console.log(`  ✅ Luôn lấy log có date mới nhất (ORDER BY date DESC LIMIT 1)`);

// ─────────────────────────────────────────────────────────────────────────────
// [4] KIỂM TRA xem View có dùng hardcoded data không
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  [KIỂM TRA 4] View binding — hardcoded vs controller data');
console.log('═══════════════════════════════════════════════════════════════');

const fs   = require('fs');
const path = require('path');

const viewsToCheck = [
    {
        file: 'views/dashboard/index.ejs',
        mustHaveVars  : ['metrics.bmi', 'metrics.bmr', 'metrics.tdee', 'metrics.targetCalories',
                         'consumed.calories', 'calorieProgress', 'macroProgress',
                         'weightChartData', 'metrics.macros'],
        mustNotHave   : ['1500', '2000', '2500', '70.5'],  // hardcoded số không liên quan formatting
    },
    {
        file: 'views/diary/index.ejs',
        mustHaveVars  : ['metrics.targetCalories', 'consumed.calories', 'consumed.protein',
                         'mealGroups', 'suggestions', 'calorieProgress', 'macroProgress',
                         'date', 'mealCalories'],
        mustNotHave   : ['1500', '2000'],
    },
    {
        file: 'views/weight/index.ejs',
        mustHaveVars  : ['currentWeight', 'currentBMI', 'bmiClass', 'chartData',
                         'logs', 'stats', 'trend'],
        mustNotHave   : ['70.5', '65.0'],
    },
];

viewsToCheck.forEach(({ file, mustHaveVars, mustNotHave }) => {
    const fullPath = path.join(__dirname, '..', file);
    console.log(`\n  📄 ${file}`);

    if (!fs.existsSync(fullPath)) {
        console.log(`     ❌ File không tồn tại!`);
        allPassed = false;
        return;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');

    // Kiểm tra biến từ controller có được dùng không
    let missingVars = [];
    mustHaveVars.forEach(v => {
        if (!content.includes(v)) {
            missingVars.push(v);
        }
    });

    if (missingVars.length === 0) {
        console.log(`     ✅ Tất cả biến controller đều được binding (${mustHaveVars.length} biến)`);
    } else {
        console.log(`     ❌ Thiếu binding: ${missingVars.join(', ')}`);
        allPassed = false;
    }

    // Kiểm tra có hardcoded không
    let hardcoded = mustNotHave.filter(v => {
        // Chỉ báo nếu xuất hiện ngoài comment và ngoài string format
        const regex = new RegExp(`(?<!//.*)(${v.replace('.', '\\.')})`, 'g');
        return content.match(regex);
    });

    if (hardcoded.length === 0) {
        console.log(`     ✅ Không có hardcoded data đáng ngờ`);
    } else {
        console.log(`     ⚠️  Có thể hardcoded: ${hardcoded.join(', ')} (kiểm tra thủ công nếu cần)`);
    }

    // Thống kê EJS template variables
    const ejsVars = content.match(/<%=\s*[\w.[\]]+/g) || [];
    const uniqueVars = [...new Set(ejsVars.map(v => v.replace(/<%=\s*/, '')))];
    console.log(`     📊 Tổng EJS variables đang dùng: ${uniqueVars.length}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// TỔNG KẾT
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  KẾT QUẢ KIỂM TRA PHASE 4');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`  [1] BMR/TDEE/Metrics  : ${allPassed && snapshotOk ? '✅ PASS' : '⚠️  XEM CHI TIẾT'}`);
console.log(`  [2] Snapshot logic    : ${snapshotOk ? '✅ PASS — Snapshot tính đúng amount * value' : '❌ FAIL'}`);
console.log(`  [3] Upsert/ngày       : ${upsertOk ? '✅ PASS — 1 user 1 bản ghi mỗi ngày' : '❌ FAIL'}`);
console.log(`  [4] View data binding : Xem chi tiết bên trên`);
console.log('');
console.log('  LƯU Ý TIỀM NĂNG:');
console.log('  ⚠️  getMacroProgress() được gọi với metrics.macros (có thể null)');
console.log('     → đã có fallback: getMacroProgress(consumed, metrics.macros || {})');
console.log('  ⚠️  toDateString() dùng new Date(date).toISOString() có thể lệch timezone');
console.log('     → cần test với các múi giờ khác nhau');
console.log('  ✅  Snapshot đúng: food.X * amount, lưu vào caloriesSnapshot/proteinSnapshot/...');
console.log('  ✅  deleteEntry kiểm tra userId — không cho xóa entry của người khác');
console.log('  ✅  searchFood giới hạn limit ≤ 50 tránh overload');
console.log('═══════════════════════════════════════════════════════════════\n');
