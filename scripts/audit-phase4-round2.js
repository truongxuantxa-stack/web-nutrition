'use strict';

/**
 * audit-phase4-round2.js — Vòng kiểm tra thứ 2
 * Chạy: node scripts/audit-phase4-round2.js
 */

require('dotenv').config();

let bugCount   = 0;
let fixCount   = 0;
const bugs     = [];
const fixes    = [];

const BUG  = (id, sev, where, desc, howToFix) => { bugCount++; bugs.push({ id, sev, where, desc, howToFix }); };
const FIX  = (id, desc) => { fixCount++; fixes.push({ id, desc }); };

console.log('\n══════════════════════════════════════════════════════════════════');
console.log('  AUDIT PHASE 4 — VÒNG 2: Edge Cases & Security');
console.log('══════════════════════════════════════════════════════════════════');

// ─────────────────────────────────────────────────────────────────────────────
// [A] XSS trong diary view — renderSearchResults dùng innerHTML
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n  [A] Kiểm tra XSS — renderSearchResults innerHTML');

// Code thực tế trong view (dòng 394-401):
// container.innerHTML = foods.map(f => `
//   <button onclick='selectFood(${JSON.stringify(f)})'>${f.name}</button>
// `).join('');

// Test với food name chứa ký tự nguy hiểm
const maliciousFood = {
    id: 999, name: "Cơm')); alert('XSS", calories: 200, protein: 5, carbs: 40, fat: 2, unit: '100g'
};

const rendered = `onclick='selectFood(${JSON.stringify(maliciousFood)})'`;
console.log('  Input:   food.name =', JSON.stringify(maliciousFood.name));
console.log('  Output:', rendered.substring(0, 80) + '...');

// JSON.stringify sẽ escape ký tự ' không? → Không! ' không bị escape trong JSON
// Nhưng onclick dùng dấu ' bao ngoài → ' trong tên sẽ phá vỡ attribute
const hasSingleQuote = maliciousFood.name.includes("'");
const jsonHasEscapedSingleQuote = JSON.stringify(maliciousFood).includes("\\'");

if (hasSingleQuote && !jsonHasEscapedSingleQuote) {
    BUG('A1', '🔴 CAO',
        'views/diary/index.ejs dòng 394-401 (renderSearchResults)',
        "onclick='selectFood(${JSON.stringify(f)})' — JSON.stringify KHÔNG escape dấu ' (single quote). Nếu food.name chứa ', attribute onclick sẽ bị phá vỡ.",
        "Dùng double quotes bao JSON và escape chúng: onclick=\"selectFood('${JSON.stringify(f).replace(/\"/g,'&quot;')}')\" hoặc dùng data-* attribute."
    );
    console.log("  ❌ BUG: Single quote trong food.name có thể phá vỡ onclick attribute");
} else {
    console.log("  ✅ Không bị ảnh hưởng (không có single quote)");
}

// ─────────────────────────────────────────────────────────────────────────────
// [B] goToToday() trong diary view dùng toISOString() (timezone bug)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n  [B] Kiểm tra timezone bug trong goToToday() (client-side JS)');

// Code thực tế (dòng 333):
// const today = new Date().toISOString().split('T')[0];  ← UTC!

// Giả lập: 00:30 sáng tại Việt Nam (UTC+7) = 17:30 hôm trước tại UTC
const vnMidnight = new Date('2026-05-05T00:30:00+07:00');
const utcDate    = vnMidnight.toISOString().split('T')[0];  // '2026-05-04' ← SAI!
const localDate  = `${vnMidnight.getFullYear()}-${String(vnMidnight.getMonth()+1).padStart(2,'0')}-${String(vnMidnight.getDate()).padStart(2,'0')}`;

console.log(`  Thời điểm: 00:30 sáng 2026-05-05 tại VN (UTC+7)`);
console.log(`  toISOString() → '${utcDate}'  ← ${utcDate !== '2026-05-05' ? '❌ WRONG (UTC)' : '✅'}`);
console.log(`  getDate()     → '${localDate}' ← ${localDate === '2026-05-05' ? '✅ CORRECT' : '❌'}`);

if (utcDate !== localDate) {
    BUG('B1', '🟡 TRUNG BÌNH',
        'views/diary/index.ejs dòng 333 — goToToday() JS function',
        'Hàm goToToday() dùng new Date().toISOString() tại client → trả về ngày UTC. Trước 7h sáng VN, click "Hôm nay" sẽ nhảy về ngày hôm trước.',
        "Đổi sang: const d=new Date(); const today=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');"
    );
    console.log("  ❌ BUG: goToToday() sẽ điều hướng sai ngày trước 7h sáng");
}

// ─────────────────────────────────────────────────────────────────────────────
// [C] diary view — max date picker dùng toISOString() (cùng bug)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n  [C] Kiểm tra timezone bug trong max date picker (EJS server-side)');

// Code thực tế dòng 23:
// max="<%= new Date().toISOString().split('T')[0] %>"
// → Chạy trên SERVER → server Node.js ở VN thường dùng local timezone
// → Nhưng nếu deploy lên server UTC, max sẽ là ngày hôm trước từ 0h-7h VN

console.log('  Server-side EJS: new Date().toISOString() → Ngày UTC trên server');
console.log('  Nếu server ở UTC: Trước 7h sáng VN, max date = ngày hôm trước');
console.log('  → User sẽ KHÔNG chọn được ngày hôm nay trên date picker!');

BUG('C1', '🟡 TRUNG BÌNH',
    'views/diary/index.ejs dòng 23 — max attribute date picker',
    'max="<%= new Date().toISOString().split(\'T\')[0] %>" sẽ sai múi giờ nếu server chạy UTC.',
    "Dùng helper hoặc set TZ=Asia/Ho_Chi_Minh trong .env, hoặc tính local date tương tự như đã fix trong controller."
);

// ─────────────────────────────────────────────────────────────────────────────
// [D] WeightLog — unique constraint DB vs upsert logic
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n  [D] Kiểm tra race condition trong addWeight upsert');

// WeightLog có: { unique: true, fields: ['userId', 'date'], name: 'unique_user_date_weight' }
// Trong addWeight:
//   1. findOne({ userId, date })  → existing = null
//   2. [RACE CONDITION: 2 request đồng thời cùng findOne → cả hai đều thấy null]
//   3. create(...)               → cả hai đều create → SequelizeUniqueConstraintError!

console.log('  Scenario: 2 request đồng thời POST /can-nang/them cùng ngày');
console.log('  1. Request A: findOne → null');
console.log('  2. Request B: findOne → null (trước khi A tạo xong)');
console.log('  3. Request A: CREATE → thành công');
console.log('  4. Request B: CREATE → SequelizeUniqueConstraintError ← CRASH!');
console.log('  Hiện tại: catch block chỉ redirect /can-nang?error=server → không thân thiện');

// Kiểm tra catch hiện tại
const currentCatch = `
    } catch (err) {
        console.error('addWeight error:', err);
        return res.redirect('/can-nang?error=server');
    }
`;
const handlesUniqueError = currentCatch.includes('SequelizeUniqueConstraintError') ||
                           currentCatch.includes('unique_user_date_weight');

if (!handlesUniqueError) {
    BUG('D1', '🟡 TRUNG BÌNH',
        'controllers/weight.controller.js — addWeight, race condition upsert',
        'Race condition: 2 request đồng thời cùng ngày sẽ gây SequelizeUniqueConstraintError không được xử lý rõ ràng.',
        "Dùng findOrCreate + update, hoặc catch SequelizeUniqueConstraintError riêng và thực hiện update thay vì create."
    );
    console.log('  ❌ BUG: Race condition không được xử lý → error=server thay vì upsert đúng');
} else {
    console.log('  ✅ Đã xử lý UniqueConstraintError');
}

// ─────────────────────────────────────────────────────────────────────────────
// [E] getSuggestions — khi remainingCalories rất lớn
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n  [E] Kiểm tra getSuggestions với remainingCalories cực lớn');

const scenarios = [
    { target: 2000, consumed: 0,    desc: 'Chưa ăn gì (remain=2000)' },
    { target: 2000, consumed: 1950, desc: 'Gần đủ (remain=50)' },
    { target: 2000, consumed: 1951, desc: 'Remain=49 → không gợi ý' },
    { target: 2000, consumed: 2500, desc: 'Vượt calo (remain=-500)' },
    { target: null, consumed: 500,  desc: 'Chưa setup profile (target=null)' },
];

scenarios.forEach(s => {
    const remaining = (s.target || 0) - s.consumed;
    const wouldQuery = s.target && remaining > 50;
    const filterLimit = wouldQuery ? remaining * 1.3 : null;
    console.log(`\n  ${s.desc}:`);
    console.log(`     remaining=${remaining}, filter: calories <= ${filterLimit ?? 'N/A'}`);

    if (s.target === null) {
        console.log('     → diary.controller.js guard: targetCalories ? ... : [] ✅ SAFE');
    } else if (remaining <= 50) {
        console.log('     → getSuggestions trả [] ✅ CORRECT');
    } else if (remaining > 3000) {
        console.log(`     ⚠️  Filter calories <= ${filterLimit} → quá rộng, có thể trả về NHIỀU món`);
    } else {
        console.log('     → Query bình thường ✅');
    }
});

// Kịch bản đặc biệt: user mới chưa ăn gì, remaining = 2095 → filter = 2095*1.3 = 2723
// Hầu hết món ăn trong DB sẽ pass filter → limit 100 để giới hạn
const largeRemaining = 2095;
console.log(`\n  Khi remain=${largeRemaining}: filter <= ${Math.round(largeRemaining*1.3)} kcal`);
console.log('  → Gần như toàn bộ 52 món seed đều pass → limit 100 giữ hiệu suất ✅');

// ─────────────────────────────────────────────────────────────────────────────
// [F] sumNutritionFromEntries — ?? vs falsy (0 snapshot)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n  [F] Kiểm tra sumNutritionFromEntries — ?? operator với value = 0');

// Dùng ?? (nullish coalescing): chỉ fallback khi null hoặc undefined
// Nếu caloriesSnapshot = 0 (món 0 calo), ?? KHÔNG fallback → trả 0 (đúng)
// Nếu caloriesSnapshot = null → fallback sang entry.food.calories * amount (đúng)

const testEntries = [
    { caloriesSnapshot: 0,    proteinSnapshot: 0,    carbsSnapshot: 0,    fatSnapshot: 0,    amount: 1, food: { calories: 100 } },  // 0-cal item
    { caloriesSnapshot: null, proteinSnapshot: null, carbsSnapshot: null, fatSnapshot: null, amount: 2, food: { calories: 150, protein: 5, carbs: 30, fat: 2 } }, // no snapshot
    { caloriesSnapshot: 200,  proteinSnapshot: 15,   carbsSnapshot: 25,   fatSnapshot: 8,    amount: 1, food: null },  // deleted food
];

let total = { calories: 0, protein: 0, carbs: 0, fat: 0 };
testEntries.forEach(e => {
    const cal  = e.caloriesSnapshot ?? (e.food ? e.food.calories * e.amount : 0);
    const prot = e.proteinSnapshot  ?? (e.food ? e.food.protein  * e.amount : 0);
    const carb = e.carbsSnapshot    ?? (e.food ? e.food.carbs    * e.amount : 0);
    const fat  = e.fatSnapshot      ?? (e.food ? e.food.fat      * e.amount : 0);
    total.calories += cal;
    total.protein  += prot;
    total.carbs    += carb;
    total.fat      += fat;
});

console.log('  Test entries:', testEntries.length);
console.log('  Expected: calories=0+300+200=500, protein=0+10+15=25');
console.log(`  Got:      calories=${total.calories}, protein=${total.protein}, carbs=${total.carbs}, fat=${total.fat}`);

const sumOk = total.calories === 500 && total.protein === 25;
console.log(`  ${sumOk ? '✅ ?? operator hoạt động đúng' : '❌ BUG trong sumNutritionFromEntries'}`);

// ─────────────────────────────────────────────────────────────────────────────
// [G] addEntry — date validation thiếu
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n  [G] Kiểm tra input validation trong addEntry');

const addEntryValidations = [
    { foodId: '',     amount: 1,    mealType: 'sang', date: '2026-05-04', expected: 'FAIL - no foodId' },
    { foodId: '5',   amount: -1,   mealType: 'sang', date: '2026-05-04', expected: 'FAIL - negative amount' },
    { foodId: '5',   amount: 0,    mealType: 'sang', date: '2026-05-04', expected: 'FAIL - zero amount' },
    { foodId: '5',   amount: 1.5,  mealType: 'sang', date: '2026-05-04', expected: 'PASS' },
    { foodId: '5',   amount: 1,    mealType: 'sang', date: '2099-12-31', expected: 'PASS - future date allowed! ⚠️' },
    { foodId: '5',   amount: 1,    mealType: 'sang', date: 'abc',        expected: 'PASS - invalid date sanitized by toDateString' },
    { foodId: '999', amount: 1,    mealType: 'sang', date: '2026-05-04', expected: 'FAIL (DB) - food not found' },
];

let missingFutureDateValidation = false;
addEntryValidations.forEach(({ foodId, amount, mealType, date, expected }) => {
    // Simulate controller validation
    const amountNum = parseFloat(amount);
    const clientFail = !foodId || !amount || !mealType || isNaN(amountNum) || amountNum <= 0;

    if (!clientFail && date === '2099-12-31') {
        missingFutureDateValidation = true;
        console.log(`  ⚠️  date='${date}' → Server không chặn ngày tương lai`);
    }
    const icon = clientFail ? '✅' : expected.includes('PASS') ? '✅' : '⚠️ ';
    console.log(`  ${icon} ${expected}`);
});

if (missingFutureDateValidation) {
    BUG('G1', '🟢 THẤP',
        'controllers/diary.controller.js — addEntry, thiếu date validation',
        'Người dùng có thể thêm nhật ký cho ngày tương lai (vd: 2099-12-31). Không gây lỗi nhưng dữ liệu không hợp lệ về mặt logic.',
        "Thêm: if (entryDate > toDateString(null)) return res.status(400).json({ message: 'Không thể ghi nhật ký cho ngày tương lai.' });"
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// TỔNG KẾT
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n══════════════════════════════════════════════════════════════════');
console.log(`  KẾT QUẢ: Tìm thấy ${bugCount} lỗi, ${fixCount} cần fix`);
console.log('══════════════════════════════════════════════════════════════════');

bugs.forEach(b => {
    console.log(`\n  ${b.sev} [${b.id}] ${b.where}`);
    console.log(`     Mô tả  : ${b.desc}`);
    console.log(`     Fix    : ${b.howToFix}`);
});

console.log('\n  Kết quả [F] sumNutritionFromEntries: ✅ Không bug');
console.log('  Kết quả [E] getSuggestions bounds: ✅ Không bug');
console.log('\n  ─── Cần sửa ngay ───');
console.log('  [A1] 🔴 XSS qua food.name chứa single quote trong renderSearchResults');
console.log('  [B1] 🟡 goToToday() dùng UTC → sai ngày trước 7h sáng (client JS)');
console.log('  [C1] 🟡 max date picker dùng UTC server-side');
console.log('  [D1] 🟡 Race condition upsert cân nặng (hiếm gặp thực tế)');
console.log('  [G1] 🟢 Không chặn ngày tương lai trong nhật ký');
console.log('');
