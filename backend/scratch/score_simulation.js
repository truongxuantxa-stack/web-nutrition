const NUTRIENT_THRESHOLDS = {
    sodium:  { warning: 100, danger: 150 },
    sugar:   { warning: 2.5, danger: 5 },
    protein: { excellent: 5, good: 3 },
    fiber:   { excellent: 1.25, good: 0.7 },
    vitaminA: { excellent: 45,  good: 22.5 },
    vitaminC: { excellent: 10,  good: 5 },
    calcium:  { excellent: 50,  good: 25 },
    iron:     { excellent: 1.5, good: 0.8 },
};
const FIBER_EXEMPT_CATEGORIES = ['thit_ca', 'protein', 'fat', 'vitamin', 'fiber'];

const foods = [
    { name: 'Cá Diêu Hồng Hấp Hành',  calories: 150, protein: 22,  fiber: 0.5, sugar: 3,  sodium: 600,  vitaminA: 65,  vitaminC: 4,  calcium: 115, iron: 3.5, category: 'thit_ca', foodType: 'dish' },
    { name: 'Canh Rau Củ Chay',         calories: 80,  protein: 3,   fiber: 7.8, sugar: 3,  sodium: 1000, vitaminA: 450, vitaminC: 72, calcium: 185, iron: 4.1, category: 'rau_cu',  foodType: 'dish' },
    { name: 'Cháo Gà Gạo Lứt',          calories: 300, protein: 18,  fiber: 1.5, sugar: 3,  sodium: 600,  vitaminA: 25,  vitaminC: 3,  calcium: 45,  iron: 1.5, category: 'com',     foodType: 'dish' },
];

function scoreFood(food) {
    const r = 100 / food.calories;
    let score = 50;
    const logs = [];

    // Sodium
    const sodiumD = food.sodium * r;
    const isNaturalSodium = food.foodType === 'raw' && ['rau_cu','trai_cay','thit_ca','protein','fiber','carb','fat','vitamin'].includes(food.category);
    let sodiumLevel = 'safe', sodiumPenalty = 0;
    if (!isNaturalSodium) {
        if (sodiumD > NUTRIENT_THRESHOLDS.sodium.danger)       { sodiumLevel = 'danger';  sodiumPenalty = -25; }
        else if (sodiumD > NUTRIENT_THRESHOLDS.sodium.warning) { sodiumLevel = 'warning'; sodiumPenalty = -10; }
    }
    score += sodiumPenalty;
    logs.push(`  Natri: ${food.sodium}mg abs | density=${sodiumD.toFixed(1)}mg/100kcal, isNaturalSodium=${isNaturalSodium} → [${sodiumLevel}] ${sodiumPenalty}`);

    // Sugar
    const sugarD = food.sugar * r;
    const isNaturalSugar = ['trai_cay','rau_cu','fiber','carb','vitamin'].includes(food.category);
    let sugarLevel = 'safe', sugarPenalty = 0;
    if (!isNaturalSugar) {
        if (sugarD > NUTRIENT_THRESHOLDS.sugar.danger)       { sugarLevel = 'danger';  sugarPenalty = -25; }
        else if (sugarD > NUTRIENT_THRESHOLDS.sugar.warning) { sugarLevel = 'warning'; sugarPenalty = -10; }
    } else { sugarLevel = 'natural'; }
    score += sugarPenalty;
    logs.push(`  Đường: ${food.sugar}g | density=${sugarD.toFixed(2)}g/100kcal, isNatural=${isNaturalSugar} → [${sugarLevel}] ${sugarPenalty}`);

    // Protein
    const proteinD = food.protein * r;
    let proteinLevel = 'low', proteinBonus = 0;
    if (proteinD >= NUTRIENT_THRESHOLDS.protein.excellent)   { proteinLevel = 'excellent'; proteinBonus = 25; }
    else if (proteinD >= NUTRIENT_THRESHOLDS.protein.good)   { proteinLevel = 'good';      proteinBonus = 15; }
    score += proteinBonus;
    logs.push(`  Đạm: ${food.protein}g | density=${proteinD.toFixed(2)}g/100kcal → [${proteinLevel}] +${proteinBonus}`);

    // Fiber
    const fiberD = food.fiber * r;
    const fiberRatio = fiberD / NUTRIENT_THRESHOLDS.fiber.excellent;
    let fiberLevel = 'low', fiberBonus = 0;
    if (fiberD >= NUTRIENT_THRESHOLDS.fiber.excellent)   { fiberLevel = 'excellent'; fiberBonus = 25; }
    else if (fiberD >= NUTRIENT_THRESHOLDS.fiber.good)   { fiberLevel = 'good';      fiberBonus = 15; }
    score += fiberBonus;
    logs.push(`  Xơ: ${food.fiber}g | density=${fiberD.toFixed(2)}g/100kcal, ratio=${fiberRatio.toFixed(2)} → [${fiberLevel}] +${fiberBonus}`);

    // Micros
    const microDefs = [
        { name: 'vitaminA', value: food.vitaminA },
        { name: 'vitaminC', value: food.vitaminC },
        { name: 'calcium',  value: food.calcium  },
        { name: 'iron',     value: food.iron      },
    ];
    const availableMicros = [];
    let microBonusTotal = 0;
    for (const m of microDefs) {
        const d = m.value * r;
        const thr = NUTRIENT_THRESHOLDS[m.name];
        const ratio = d / thr.excellent;
        let bonus = 0, level = 'low';
        if (d >= thr.excellent)      { level = 'excellent'; bonus = 10; }
        else if (d >= thr.good)      { level = 'good';      bonus = 5; }
        microBonusTotal += bonus;
        availableMicros.push({ name: m.name, ratio, level });
        logs.push(`  ${m.name}: ${m.value} | density=${d.toFixed(2)}, ratio=${ratio.toFixed(2)} → [${level}] +${bonus}`);
    }
    score += microBonusTotal;
    logs.push(`  ── Score trước caps: ${score} ──`);

    // Exempt
    const isExempt = ['thit_ca','protein'].includes(food.category) || proteinLevel === 'excellent';
    logs.push(`  isExemptFromMicroPenalty: ${isExempt} (category=${food.category}, proteinLevel=${proteinLevel})`);

    // Empty calories penalty
    const starvingCount = availableMicros.filter(m => m.ratio < 0.10).length;
    const avgMicroRatio = availableMicros.reduce((s, m) => s + m.ratio, 0) / availableMicros.length;
    logs.push(`  starvingCount=${starvingCount}, avgMicroRatio=${avgMicroRatio.toFixed(2)}`);

    if (starvingCount >= 3 && !isExempt) {
        score -= 15;
        logs.push(`  ⚠ Empty calories penalty -15`);
    }

    // Hard cap micro_50
    if (avgMicroRatio < 0.20 && !isExempt && score > 50) {
        score = 50;
        logs.push(`  🔒 Hard cap micro_50 (avgMicroRatio=${avgMicroRatio.toFixed(2)} < 0.20)`);
    }

    // Hard cap fiber_60
    const fiberExempt = FIBER_EXEMPT_CATEGORIES.includes(food.category);
    if (!fiberExempt && fiberRatio < 0.30 && score > 60) {
        score = 60;
        logs.push(`  🔒 Hard cap fiber_60 (fiberRatio=${fiberRatio.toFixed(2)} < 0.30, category=${food.category}, exempt=${fiberExempt})`);
    }

    // Hard cap sodium danger_60
    if (sodiumLevel === 'danger' && score > 60) {
        score = 60;
        logs.push(`  🔒 Hard cap sodium_danger_60`);
    }

    // Hard cap sodium extreme_40
    if (sodiumD > 300 || food.sodium > 1000) {
        if (score > 40) {
            score = 40;
            logs.push(`  🔒 Hard cap sodium_extreme_40 (density=${sodiumD.toFixed(1)}, abs=${food.sodium}mg)`);
        }
    }

    score = Math.max(0, Math.min(100, score));
    let label = '🔴 Cần hạn chế';
    if (score >= 80) label = '🌟 Lành mạnh';
    else if (score >= 60) label = '🟢 Khá tốt';
    else if (score >= 40) label = '🟡 Trung bình';

    return { score, label, logs };
}

foods.forEach(food => {
    const res = scoreFood(food);
    console.log(`\n${'═'.repeat(55)}`);
    console.log(`  ${food.name} (${food.category})`);
    console.log(`${'═'.repeat(55)}`);
    res.logs.forEach(l => console.log(l));
    console.log(`\n  ➡ ĐIỂM CUỐI: ${res.score} — ${res.label}`);
});
