/**
 * SODIUM DATA CORRECTION SCRIPT
 * Mục tiêu: Cập nhật sodium về giá trị thực tế theo chuẩn Viện Dinh Dưỡng VN / USDA
 * Phạm vi: Chỉ sửa các món bị "cap oan" do dữ liệu seed sodium quá cao
 * Không sửa: Các món kho/mắm/chiên nước mắm đang có sodium đúng thực tế
 *
 * Nguyên tắc chọn giá trị mới:
 *  - Canh (soup): 200-480mg/phần (không tính mắm chấm kèm ngoài)
 *  - Rau luộc/hấp: 30-130mg/phần (chỉ rau, không tính nước chấm)
 *  - Cá/gà hấp/luộc: 150-300mg/phần (gia vị ướp nhẹ)
 *  - Cháo: 270-400mg/phần
 *  - Xôi/cơm lứt: 100-380mg/phần
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

const seq = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST, dialect: 'mysql', logging: false
});

// ═══════════════════════════════════════════════════
//  DANH SÁCH CẬP NHẬT — chỉnh sửa tại đây nếu cần
// ═══════════════════════════════════════════════════
const UPDATES = [
    // ── CANH / SOUP (giảm từ 1000mg về mức thực tế per bowl) ──
    { id: 4582, name: 'Canh Mồng Tơi Mướp',           cal: 45,  oldNa: 1000, newNa: 130,  reason: 'Canh rau nhẹ, lightly seasoned' },
    { id: 4636, name: 'Rau Cải Luộc Chấm Mắm',        cal: 50,  oldNa: 1200, newNa: 120,  reason: 'Rau luộc, không tính nước chấm riêng' },
    { id: 4606, name: 'Gỏi Cuốn Chay',                cal: 50,  oldNa: 150,  newNa: 70,   reason: 'Fresh roll, nhẹ gia vị' },
    { id: 4543, name: 'Canh Bí Đao Tôm Khô',          cal: 80,  oldNa: 1000, newNa: 230,  reason: 'Tôm khô ít, canh nhẹ' },
    { id: 4593, name: 'Rau Củ Hấp Chấm Mắm Nêm',     cal: 80,  oldNa: 1200, newNa: 230,  reason: 'Hấp + một ít sốt kèm' },
    { id: 4668, name: 'Canh Rau Củ Chay',             cal: 80,  oldNa: 1000, newNa: 220,  reason: 'Canh chay lightly seasoned' },
    { id: 4643, name: 'Ổi Xanh Chấm Muối Ớt',        cal: 80,  oldNa: 1200, newNa: 180,  reason: 'Trái cây + muối nhúm nhỏ' },
    { id: 4575, name: 'Canh Bầu Nấu Tôm',             cal: 90,  oldNa: 1000, newNa: 260,  reason: 'Canh bầu light' },
    { id: 4568, name: 'Canh Cải Thảo Nấu Tôm',        cal: 100, oldNa: 1000, newNa: 290,  reason: 'Canh cải thảo' },
    { id: 4542, name: 'Canh Rau Ngót Thịt Bằm',       cal: 120, oldNa: 1000, newNa: 300,  reason: 'Canh có thịt, thêm một ít gia vị' },
    { id: 4634, name: 'Canh Chua Tôm',                cal: 120, oldNa: 1000, newNa: 320,  reason: 'Canh chua có nhiều gia vị hơn' },
    { id: 4600, name: 'Canh Su Hào Nấu Sườn',         cal: 160, oldNa: 1000, newNa: 400,  reason: 'Có xương sườn, đậm hơn' },
    { id: 4667, name: 'Đậu Hũ Kho Sả Ớt',            cal: 200, oldNa: 1200, newNa: 580,  reason: 'Kho đậm nhưng 1200 quá cao; 580=density 290 đúng hơn' },
    { id: 4522, name: 'Canh Khổ Qua Nhồi Thịt',       cal: 200, oldNa: 1000, newNa: 440,  reason: 'Canh có nhân thịt' },

    // ── CÁ / GÀ HẤP / LUỘC (giảm 600mg seed mặc định về thực tế) ──
    { id: 4535, name: 'Cá Diêu Hồng Hấp Hành',        cal: 150, oldNa: 600,  newNa: 180,  reason: 'Cá hấp, ít gia vị' },
    { id: 4536, name: 'Gà Luộc Lá Chanh',              cal: 200, oldNa: 600,  newNa: 230,  reason: 'Gà luộc, gia vị thơm không mặn' },
    { id: 4511, name: 'Ức Gà Áp Chảo Sốt Chanh Dây',  cal: 220, oldNa: 600,  newNa: 300,  reason: 'Sốt chanh dây ít muối' },

    // ── RẢU LUỘC / XÀO ──
    { id: 4539, name: 'Cải Bó Xôi Xào Tỏi',           cal: 90,  oldNa: 150,  newNa: 110,  reason: 'Xào ít gia vị; density 167→122' },
    { id: 4540, name: 'Bông Cải Xanh Luộc',            cal: 55,  oldNa: 150,  newNa: 30,   reason: 'Luộc không muối, sodium tự nhiên' },
    { id: 4569, name: 'Đậu Hũ Chiên Sả Ớt',           cal: 220, oldNa: 600,  newNa: 380,  reason: 'Chiên + ít xì dầu' },

    // ── CHÁO ──
    { id: 4615, name: 'Cháo Đậu Xanh',                cal: 180, oldNa: 600,  newNa: 270,  reason: 'Cháo ngọt, ít muối; density 150 đúng warning' },
    { id: 4616, name: 'Cháo Thịt Bằm',                cal: 220, oldNa: 600,  newNa: 330,  reason: 'density 150, vừa ngưỡng warning' },
    { id: 4596, name: 'Cháo Cá Lóc Rau Đắng',         cal: 250, oldNa: 600,  newNa: 350,  reason: 'Cháo cá, thêm rau đắng nhẹ' },
    { id: 4544, name: 'Cháo Gà Gạo Lứt',              cal: 300, oldNa: 600,  newNa: 350,  reason: 'Cháo gà nhẹ' },

    // ── CƠM / XÔI ──
    { id: 4630, name: 'Cơm Trắng + Rau Xào',          cal: 320, oldNa: 600,  newNa: 380,  reason: 'Rau xào ít xì dầu' },
    { id: 4588, name: 'Cơm Lứt Đậu Hũ Rong Biển',     cal: 380, oldNa: 600,  newNa: 320,  reason: 'Rong biển có sodium tự nhiên nhưng không cao' },
    { id: 4612, name: 'Xôi Đậu Xanh',                 cal: 380, oldNa: 600,  newNa: 200,  reason: 'Xôi ngọt, muối rất ít' },
];

// ═══════════════════════════════════════════════════════
//  SCORING SIMULATION (từ foodScoring.service.js logic)
// ═══════════════════════════════════════════════════════
const DB_FOODS = {
    4582: { protein:2,  fiber:4.3, sugar:3,  vitaminA:250, vitaminC:42, calcium:115, iron:2.5, category:'rau_cu',  foodType:'dish' },
    4636: { protein:2,  fiber:4.5, sugar:3,  vitaminA:300, vitaminC:37, calcium:120, iron:2.6, category:'rau_cu',  foodType:'dish' },
    4606: { protein:2,  fiber:5,   sugar:3,  vitaminA:260, vitaminC:37, calcium:110, iron:2.6, category:'rau_cu',  foodType:'dish' },
    4543: { protein:6,  fiber:5.3, sugar:3,  vitaminA:470, vitaminC:50, calcium:195, iron:4.0, category:'rau_cu',  foodType:'dish' },
    4593: { protein:3,  fiber:4.5, sugar:3,  vitaminA:300, vitaminC:37, calcium:120, iron:2.6, category:'rau_cu',  foodType:'dish' },
    4668: { protein:3,  fiber:7.8, sugar:3,  vitaminA:450, vitaminC:72, calcium:185, iron:4.1, category:'rau_cu',  foodType:'dish' },
    4643: { protein:2,  fiber:2.5, sugar:5,  vitaminA:60,  vitaminC:35, calcium:20,  iron:0.5, category:'trai_cay',foodType:'dish' },
    4575: { protein:6,  fiber:4.3, sugar:3,  vitaminA:270, vitaminC:42, calcium:175, iron:3.5, category:'rau_cu',  foodType:'dish' },
    4568: { protein:8,  fiber:5.8, sugar:3,  vitaminA:390, vitaminC:57, calcium:215, iron:4.3, category:'rau_cu',  foodType:'dish' },
    4542: { protein:10, fiber:5.8, sugar:3,  vitaminA:370, vitaminC:57, calcium:155, iron:3.3, category:'rau_cu',  foodType:'dish' },
    4634: { protein:10, fiber:4.3, sugar:3,  vitaminA:270, vitaminC:42, calcium:175, iron:3.5, category:'rau_cu',  foodType:'dish' },
    4600: { protein:10, fiber:4.3, sugar:3,  vitaminA:250, vitaminC:42, calcium:115, iron:2.5, category:'rau_cu',  foodType:'dish' },
    4667: { protein:14, fiber:5.5, sugar:3,  vitaminA:180, vitaminC:24, calcium:110, iron:3.3, category:'rau_cu',  foodType:'dish' },
    4522: { protein:15, fiber:4.3, sugar:3,  vitaminA:250, vitaminC:42, calcium:115, iron:2.5, category:'rau_cu',  foodType:'dish' },
    4535: { protein:22, fiber:0.5, sugar:3,  vitaminA:65,  vitaminC:4,  calcium:115, iron:3.5, category:'thit_ca', foodType:'dish' },
    4536: { protein:28, fiber:2,   sugar:3,  vitaminA:55,  vitaminC:29, calcium:65,  iron:2.7, category:'thit_ca', foodType:'dish' },
    4511: { protein:32, fiber:2,   sugar:3,  vitaminA:55,  vitaminC:29, calcium:65,  iron:2.7, category:'thit_ca', foodType:'dish' },
    4539: { protein:4,  fiber:4.5, sugar:3,  vitaminA:300, vitaminC:34, calcium:120, iron:2.6, category:'rau_cu',  foodType:'dish' },
    4540: { protein:4,  fiber:4.5, sugar:3,  vitaminA:300, vitaminC:37, calcium:120, iron:2.6, category:'rau_cu',  foodType:'dish' },
    4569: { protein:12, fiber:5.5, sugar:3,  vitaminA:180, vitaminC:21, calcium:110, iron:3.3, category:'rau_cu',  foodType:'dish' },
    4615: { protein:7,  fiber:4,   sugar:3,  vitaminA:25,  vitaminC:5,  calcium:75,  iron:3.0, category:'com',     foodType:'dish' },
    4616: { protein:14, fiber:1.5, sugar:3,  vitaminA:25,  vitaminC:3,  calcium:45,  iron:1.5, category:'com',     foodType:'dish' },
    4596: { protein:18, fiber:3,   sugar:3,  vitaminA:165, vitaminC:18, calcium:145, iron:3.3, category:'com',     foodType:'dish' },
    4544: { protein:18, fiber:1.5, sugar:3,  vitaminA:25,  vitaminC:3,  calcium:45,  iron:1.5, category:'com',     foodType:'dish' },
    4630: { protein:6,  fiber:2.5, sugar:3,  vitaminA:135, vitaminC:13, calcium:80,  iron:2.0, category:'com',     foodType:'dish' },
    4588: { protein:14, fiber:4,   sugar:3,  vitaminA:25,  vitaminC:5,  calcium:75,  iron:3.0, category:'com',     foodType:'dish' },
    4612: { protein:10, fiber:4,   sugar:3,  vitaminA:25,  vitaminC:5,  calcium:75,  iron:3.0, category:'com',     foodType:'dish' },
};

const T = {
    sodium:  { warning:100, danger:150 }, sugar: { warning:2.5, danger:5 },
    protein: { excellent:5, good:3 }, fiber: { excellent:1.25, good:0.7 },
    vitaminA:{ excellent:45, good:22.5 }, vitaminC:{ excellent:10, good:5 },
    calcium: { excellent:50, good:25 },  iron: { excellent:1.5, good:0.8 },
};
const FIBER_EXEMPT = ['thit_ca','protein','fat','vitamin','fiber'];

function simulate(id, cal, sodium) {
    const f = DB_FOODS[id]; if (!f) return null;
    const r = 100 / cal;
    let score = 50;
    const sodiumD = sodium * r;
    const isNatSodium = f.foodType === 'raw' && ['rau_cu','trai_cay','thit_ca','protein','fiber','carb','fat','vitamin'].includes(f.category);
    let sodiumLevel = 'safe';
    if (!isNatSodium) {
        if (sodiumD > T.sodium.danger) { sodiumLevel = 'danger'; score -= 25; }
        else if (sodiumD > T.sodium.warning) { sodiumLevel = 'warning'; score -= 10; }
    }
    const sugarD = f.sugar * r;
    const isNatSugar = ['trai_cay','rau_cu','fiber','carb','vitamin'].includes(f.category);
    if (!isNatSugar) {
        if (sugarD > T.sugar.danger) score -= 25;
        else if (sugarD > T.sugar.warning) score -= 10;
    }
    const proteinD = f.protein * r;
    let proteinLevel = 'low';
    if (proteinD >= T.protein.excellent) { proteinLevel = 'excellent'; score += 25; }
    else if (proteinD >= T.protein.good) { proteinLevel = 'good'; score += 15; }
    const fiberD = f.fiber * r;
    const fiberRatio = fiberD / T.fiber.excellent;
    let fiberBonus = 0;
    if (fiberD >= T.fiber.excellent) { fiberBonus=25; score += 25; }
    else if (fiberD >= T.fiber.good) { fiberBonus=15; score += 15; }
    const micros = [
        { v: f.vitaminA, t: T.vitaminA }, { v: f.vitaminC, t: T.vitaminC },
        { v: f.calcium,  t: T.calcium  }, { v: f.iron,     t: T.iron     },
    ];
    const mRes = micros.map(m => {
        const d = m.v * r; const ratio = d / m.t.excellent;
        let bonus=0;
        if (d >= m.t.excellent) { bonus=10; score+=10; }
        else if (d >= m.t.good) { bonus=5;  score+=5;  }
        return ratio;
    });
    const isExempt = ['thit_ca','protein'].includes(f.category) || proteinLevel==='excellent';
    const avgMicroRatio = mRes.reduce((s,x)=>s+x,0)/mRes.length;
    const starvingCount = mRes.filter(x=>x<0.10).length;
    if (starvingCount>=3 && !isExempt) score -= 15;
    if (avgMicroRatio<0.20 && !isExempt && score>50) score=50;
    if (!FIBER_EXEMPT.includes(f.category) && fiberRatio<0.30 && score>60) score=60;
    if (sodiumLevel==='danger' && score>60) score=60;
    if (sodiumD>300 || sodium>1000) { if (score>40) score=40; }
    score = Math.max(0, Math.min(100, score));
    let label='🔴'; if(score>=80)label='🌟'; else if(score>=60)label='🟢'; else if(score>=40)label='🟡';
    return { score, label };
}

async function main() {
    await seq.authenticate();

    console.log('\n📋 PREVIEW — Score trước và sau khi cập nhật:\n');
    console.log(`${'Tên món'.padEnd(38)} | ${'Cũ'.padEnd(6)} | ${'Mới'.padEnd(6)} | ${'Sodium'.padEnd(12)} | Cải thiện`);
    console.log('─'.repeat(100));

    let hasIssue = false;
    for (const u of UPDATES) {
        const before = simulate(u.id, u.cal, u.oldNa);
        const after  = simulate(u.id, u.cal, u.newNa);
        if (!before || !after) { console.log(`  ⚠ Thiếu data cho id=${u.id}`); hasIssue=true; continue; }
        const arrow = after.score > before.score ? '⬆' : after.score === before.score ? '=' : '⬇';
        console.log(
            `${u.name.padEnd(38)} | ${String(before.score).padStart(3)}${before.label}  | ${String(after.score).padStart(3)}${after.label}  | ${String(u.oldNa).padStart(4)}→${String(u.newNa).padEnd(4)}mg   | ${arrow} ${after.score - before.score > 0 ? '+' : ''}${after.score - before.score}`
        );
    }

    if (hasIssue) { console.log('\n⛔ Có lỗi, dừng lại. Không update.'); process.exit(1); }

    console.log('\n⚠  Chuẩn bị thực hiện UPDATE trong DB...');
    console.log('   Rollback script: scratch/rollback_sodium.js\n');

    // Tạo rollback script
    const rollbackLines = UPDATES.map(u =>
        `    await seq.query('UPDATE foods SET sodium=? WHERE id=?', { replacements: [${u.oldNa}, ${u.id}] });`
    ).join('\n');
    const rollbackScript = `require('dotenv').config();
const {Sequelize}=require('sequelize');
const seq=new Sequelize(process.env.DB_NAME,process.env.DB_USER,process.env.DB_PASSWORD,{host:process.env.DB_HOST,dialect:'mysql',logging:false});
async function main(){
    await seq.authenticate();
${rollbackLines}
    console.log('✅ Rollback hoàn tất — đã khôi phục sodium về giá trị gốc.');
    await seq.close(); process.exit(0);
}
main().catch(e=>{console.error(e.message);process.exit(1);});`;
    require('fs').writeFileSync('./scratch/rollback_sodium.js', rollbackScript);
    console.log('✅ Đã tạo rollback_sodium.js\n');

    // Thực hiện update
    let updated = 0;
    for (const u of UPDATES) {
        await seq.query('UPDATE foods SET sodium=? WHERE id=?', { replacements: [u.newNa, u.id] });
        updated++;
    }

    console.log(`✅ Đã cập nhật sodium cho ${updated} món.\n`);
    await seq.close(); process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
