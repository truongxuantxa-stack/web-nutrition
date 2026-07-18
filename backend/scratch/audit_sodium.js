require('dotenv').config();
const { Sequelize } = require('sequelize');

const seq = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST, dialect: 'mysql', logging: false
});

async function main() {
    await seq.authenticate();

    // Lấy toàn bộ dish foods có sodium > 0
    const [rows] = await seq.query(`
        SELECT id, name, calories, sodium, protein, fiber, category, foodType
        FROM foods
        WHERE foodType = 'dish'
          AND sodium IS NOT NULL
          AND sodium > 0
          AND deletedAt IS NULL
        ORDER BY (sodium / calories) DESC
    `);

    console.log(`Tổng dish foods có sodium: ${rows.length}\n`);

    // Tính density và phân nhóm
    const groups = { extreme: [], danger: [], warning: [], safe: [] };

    rows.forEach(r => {
        const density = (r.sodium / r.calories) * 100;
        r._density = density;
        if (r.sodium > 1000 || density > 300) groups.extreme.push(r);
        else if (density > 150)               groups.danger.push(r);
        else if (density > 100)               groups.warning.push(r);
        else                                  groups.safe.push(r);
    });

    console.log('=== PHÂN BỐ SODIUM (dish foods) ===');
    console.log(`  🔴 Extreme (sodium_extreme_40): ${groups.extreme.length} món`);
    console.log(`  🔴 Danger  (sodium cap 60):     ${groups.danger.length} món`);
    console.log(`  🟡 Warning:                     ${groups.warning.length} món`);
    console.log(`  🟢 Safe:                        ${groups.safe.length} món`);

    console.log('\n=== TOP 20 món bị HIT hard cap (sodium_extreme_40) ===');
    console.log('Tên | Kcal | Sodium(mg) | Density(mg/100kcal) | Category');
    groups.extreme.slice(0, 20).forEach(r => {
        console.log(`  ${r.name.padEnd(30)} | ${String(r.calories).padEnd(4)} | ${String(r.sodium).padEnd(10)} | ${r._density.toFixed(0).padEnd(20)} | ${r.category}`);
    });

    // Phân tích theo category trong nhóm extreme
    console.log('\n=== Extreme theo category ===');
    const byCat = {};
    groups.extreme.forEach(r => {
        byCat[r.category] = (byCat[r.category] || 0) + 1;
    });
    Object.entries(byCat).sort((a,b) => b[1]-a[1]).forEach(([cat, cnt]) => {
        console.log(`  ${cat.padEnd(15)}: ${cnt} món`);
    });

    // Gợi ý: tìm các món "lành mạnh" đang bị cap oan
    // = thit_ca / rau_cu / com có sodium_extreme nhưng protein hoặc fiber cao
    console.log('\n=== Món "bị cap oan" tiềm năng (healthy food + extreme sodium) ===');
    const suspicious = groups.extreme.filter(r =>
        ['thit_ca','rau_cu','com','pho_bun'].includes(r.category)
    );
    suspicious.forEach(r => {
        console.log(`  ${r.name} | cat=${r.category} | sodium=${r.sodium}mg | cal=${r.calories} | density=${r._density.toFixed(0)}mg/100kcal`);
    });

    await seq.close();
    process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
