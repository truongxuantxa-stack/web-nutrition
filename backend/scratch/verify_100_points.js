require('dotenv').config();
const { Sequelize } = require('sequelize');

const seq = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST, dialect: 'mysql', logging: false
});

async function main() {
    await seq.authenticate();

    const names = [
        'Nấm Đùi Gà Xào Bơ Tỏi', 'Đậu Hũ Sốt Nấm', 'Gỏi Bưởi Tôm Thịt',
        'Salad Ức gà áp chảo', 'Chuối Lán', 'Nấm Xào Rau Củ',
        'Salad Quinoa Rau Củ', 'Salad Bơ Tôm', 'Salad Trứng Luộc Rau Mầm',
        'Nộm Bò Khô', 'Súp Bí Đỏ Kem Tươi', 'Bắp Cải Cuốn Thịt Hấp'
    ];

    const placeholders = names.map(()=>'?').join(',');
    const [rows] = await seq.query(
        `SELECT id, name, calories, protein, fiber, sugar, sodium, vitaminA, vitaminC, calcium, iron, category, foodType
         FROM foods WHERE name IN (${placeholders}) AND deletedAt IS NULL`,
        { replacements: names }
    );
    
    // Scoring logic
    const T = {
        sodium:  { warning:100, danger:150 }, sugar: { warning:2.5, danger:5 },
        protein: { excellent:5, good:3 }, fiber: { excellent:1.25, good:0.7 },
        vitaminA:{ excellent:45, good:22.5 }, vitaminC:{ excellent:10, good:5 },
        calcium: { excellent:50, good:25 },  iron: { excellent:1.5, good:0.8 },
    };
    
    console.log('=== KIỂM TRA ĐIỂM NHÓM 100 ĐIỂM ===\n');
    
    rows.forEach(f => {
        const r = 100 / f.calories;
        let score = 50;
        let pText = [];
        let bText = [];
        
        const sodiumD = f.sodium * r;
        if (sodiumD > T.sodium.danger) { score -= 25; pText.push(`Natri Danger(-25)`); }
        else if (sodiumD > T.sodium.warning) { score -= 10; pText.push(`Natri Warn(-10)`); }
        
        const sugarD = f.sugar * r;
        const isNatSugar = ['trai_cay','rau_cu','fiber','carb','vitamin'].includes(f.category);
        if (!isNatSugar) {
            if (sugarD > T.sugar.danger) { score -= 25; pText.push(`Đường Danger(-25)`); }
            else if (sugarD > T.sugar.warning) { score -= 10; pText.push(`Đường Warn(-10)`); }
        }
        
        const proteinD = f.protein * r;
        if (proteinD >= T.protein.excellent) { score += 25; bText.push(`Đạm Excel(+25)`); }
        else if (proteinD >= T.protein.good) { score += 15; bText.push(`Đạm Good(+15)`); }
        
        const fiberD = f.fiber * r;
        if (fiberD >= T.fiber.excellent) { score += 25; bText.push(`Xơ Excel(+25)`); }
        else if (fiberD >= T.fiber.good) { score += 15; bText.push(`Xơ Good(+15)`); }
        
        let microBonus = 0;
        const micros = [
            {n:'VitA', v:f.vitaminA, t:T.vitaminA}, {n:'VitC', v:f.vitaminC, t:T.vitaminC},
            {n:'Ca', v:f.calcium, t:T.calcium}, {n:'Fe', v:f.iron, t:T.iron}
        ];
        micros.forEach(m => {
            const d = m.v * r;
            if (d >= m.t.excellent) { microBonus += 10; }
            else if (d >= m.t.good) { microBonus += 5; }
        });
        score += microBonus;
        bText.push(`Vi chất(+${microBonus})`);
        
        let finalScore = Math.min(100, Math.max(0, score));
        
        console.log(`${f.name.padEnd(25)} | Điểm: ${finalScore}`);
        console.log(`   Phạt: ${pText.length ? pText.join(', ') : 'Không'}`);
        console.log(`   Thưởng: ${bText.join(', ')}`);
        console.log(`   Kcal: ${f.calories}, Đạm(g/100k): ${proteinD.toFixed(1)}, Xơ(g/100k): ${fiberD.toFixed(1)}, Na(mg/100k): ${sodiumD.toFixed(1)}\n`);
    });

    await seq.close(); process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
