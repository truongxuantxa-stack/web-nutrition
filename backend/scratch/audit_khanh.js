require('dotenv').config();
const { Sequelize } = require('sequelize');

const seq = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST, dialect: 'mysql', logging: false
});

async function main() {
    await seq.authenticate();

    // Target: khanh@gmail.com — id=8
    const [users] = await seq.query(`SELECT id, email, fullName FROM users WHERE id = 8`);
    console.log(`=== User: ${users[0].email} — ${users[0].fullName} ===`);
    const userId = users[0].id;

    // 2. Lấy danh sách các food UNIQUE trong diary của user này
    const [foods] = await seq.query(`
        SELECT DISTINCT f.id, f.name, f.calories, f.sodium, f.category, f.foodType,
               ROUND((f.sodium / f.calories) * 100, 0) as sodiumDensity
        FROM diary_entries de
        JOIN foods f ON de.foodId = f.id
        WHERE de.userId = ?
          AND f.sodium IS NOT NULL
          AND f.sodium > 0
          AND f.deletedAt IS NULL
        ORDER BY sodiumDensity DESC
    `, { replacements: [userId] });

    console.log(`\n=== Foods trong diary của user ${userId} (${users[0].email} - ${users[0].fullName}) có sodium ===`);
    console.log(`Tổng: ${foods.length} món unique\n`);

    // Phân nhóm
    const extreme = foods.filter(f => f.sodiumDensity > 300 || f.sodium > 1000);
    const danger  = foods.filter(f => f.sodiumDensity > 150 && f.sodiumDensity <= 300 && f.sodium <= 1000);
    const ok      = foods.filter(f => f.sodiumDensity <= 150);

    console.log(`🔴 Bị hit cap_40 (extreme): ${extreme.length} món`);
    extreme.forEach(f => console.log(`   [${String(f.id).padEnd(5)}] ${f.name.padEnd(35)} | cal=${f.calories} | sodium=${f.sodium}mg | density=${f.sodiumDensity}mg/100kcal | cat=${f.category}`));

    console.log(`\n🟠 Bị hit cap_60 (danger): ${danger.length} món`);
    danger.forEach(f => console.log(`   [${String(f.id).padEnd(5)}] ${f.name.padEnd(35)} | cal=${f.calories} | sodium=${f.sodium}mg | density=${f.sodiumDensity}mg/100kcal | cat=${f.category}`));

    console.log(`\n🟢 An toàn: ${ok.length} món`);

    await seq.close();
    process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
