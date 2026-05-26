const oldFallback = (foods, target) => {
    const fiberFood = foods.find(f => f.category === 'fiber' || f.role === 'fiber');
    const fatFood = foods.find(f => f.category === 'fat' || f.role === 'fat');
    const carbFood = foods.find(f => f.category === 'carb' || f.role === 'carb');
    const proteinFood = foods.find(f => f.category === 'protein' || f.role === 'protein');

    const results = [];
    const adjustedTarget = { ...target };

    if (fiberFood) {
        results.push({ food: fiberFood, grams: 200 });
        adjustedTarget.protein -= fiberFood.protein * 2;
        adjustedTarget.carbs -= fiberFood.carbs * 2;
        adjustedTarget.fat -= fiberFood.fat * 2;
    }

    if (fatFood) {
        results.push({ food: fatFood, grams: 5 });
        adjustedTarget.protein -= fatFood.protein * 0.05;
        adjustedTarget.carbs -= fatFood.carbs * 0.05;
        adjustedTarget.fat -= fatFood.fat * 0.05;
    }

    if (proteinFood) {
        let pGrams = (adjustedTarget.protein / (proteinFood.protein || 1)) * 100;
        pGrams = Math.max(50, Math.min(250, Math.round(pGrams)));
        results.push({ food: proteinFood, grams: pGrams });
        adjustedTarget.carbs -= proteinFood.carbs * (pGrams / 100);
        adjustedTarget.fat -= proteinFood.fat * (pGrams / 100);
    }

    if (carbFood) {
        let cGrams = (adjustedTarget.carbs / (carbFood.carbs || 1)) * 100;
        cGrams = Math.max(50, Math.min(300, Math.round(cGrams)));
        results.push({ food: carbFood, grams: cGrams });
    }

    return results;
};

const smartFallback = (foods, target) => {
    const isSnack = foods.length === 3;
    const fiberFood = foods.find(f => f.category === 'fiber');
    const fatFood = foods.find(f => f.category === 'fat');
    const carbFood = foods.find(f => f.category === 'carb');
    const proteinFood = foods.find(f => f.category === 'protein');

    const results = [];
    let adjustedTarget = { ...target };

    // 1. Fiber Food (Rau) - chỉ có ở bữa chính (4 món)
    if (fiberFood && !isSnack) {
        results.push({ food: fiberFood, grams: 200 });
        adjustedTarget.protein -= fiberFood.protein * 2;
        adjustedTarget.carbs -= fiberFood.carbs * 2;
        adjustedTarget.fat -= fiberFood.fat * 2;
    }

    // 2. Fat Food
    if (fatFood) {
        let fGrams = 5; // Default for oils in main meals
        if (isSnack) {
            // Tính theo target.fat
            fGrams = (target.fat / (fatFood.fat || 1)) * 100;
            if (fatFood.fat > 80) {
                // Dầu ăn nguyên chất
                fGrams = Math.max(5, Math.min(15, Math.round(fGrams)));
            } else if (fatFood.fat > 30) {
                // Các loại hạt, bơ đậu phộng
                fGrams = Math.max(10, Math.min(30, Math.round(fGrams)));
            } else {
                // Quả bơ
                fGrams = Math.max(30, Math.min(80, Math.round(fGrams)));
            }
        }
        results.push({ food: fatFood, grams: fGrams });
        adjustedTarget.protein -= fatFood.protein * (fGrams / 100);
        adjustedTarget.carbs -= fatFood.carbs * (fGrams / 100);
        adjustedTarget.fat -= fatFood.fat * (fGrams / 100);
    }

    // 3. Protein Food
    if (proteinFood) {
        let pGrams = (adjustedTarget.protein / (proteinFood.protein || 1)) * 100;
        if (isSnack) {
            if (proteinFood.protein > 25) {
                // Whey hoặc Protein Bar
                pGrams = Math.max(15, Math.min(40, Math.round(pGrams)));
            } else {
                // Sữa chua, sữa tươi, trứng
                pGrams = Math.max(50, Math.min(200, Math.round(pGrams)));
            }
        } else {
            pGrams = Math.max(50, Math.min(250, Math.round(pGrams)));
        }
        results.push({ food: proteinFood, grams: pGrams });
        adjustedTarget.carbs -= proteinFood.carbs * (pGrams / 100);
        adjustedTarget.fat -= proteinFood.fat * (pGrams / 100);
    }

    // 4. Carb Food
    if (carbFood) {
        let cGrams = (adjustedTarget.carbs / (carbFood.carbs || 1)) * 100;
        if (isSnack) {
            if (carbFood.carbs > 40) {
                // Yến mạch, bánh mì
                cGrams = Math.max(20, Math.min(60, Math.round(cGrams)));
            } else {
                // Trái cây tươi (chuối, táo, việt quất)
                cGrams = Math.max(50, Math.min(150, Math.round(cGrams)));
            }
        } else {
            cGrams = Math.max(50, Math.min(300, Math.round(cGrams)));
        }
        results.push({ food: carbFood, grams: cGrams });
    }

    return results;
};

// Test
const target = { calories: 155, protein: 12, carbs: 16, fat: 5 };
const banana = { name: 'Chuối (Thô)', protein: 1.1, carbs: 22.8, fat: 0.3, calories: 89, category: 'carb' };
const whey = { name: 'Sữa Tăng Cơ (Whey Protein)', protein: 78, carbs: 6, fat: 4, calories: 380, category: 'protein' };
const avo = { name: 'Quả Bơ (Thô)', protein: 2, carbs: 8.5, fat: 14.7, calories: 160, category: 'fat' };

const foods = [banana, whey, avo];

console.log('--- OLD FALLBACK ---');
const oldRes = oldFallback(foods, target);
let oldCal = 0;
oldRes.forEach(item => {
    const cal = item.food.calories * item.grams / 100;
    oldCal += cal;
    console.log(`${item.food.name}: ${item.grams}g (${cal.toFixed(1)} kcal)`);
});
console.log('Total Calories:', oldCal.toFixed(1));

console.log('\n--- SMART FALLBACK ---');
const smartRes = smartFallback(foods, target);
let smartCal = 0;
smartRes.forEach(item => {
    const cal = item.food.calories * item.grams / 100;
    smartCal += cal;
    console.log(`${item.food.name}: ${item.grams}g (${cal.toFixed(1)} kcal)`);
});
console.log('Total Calories:', smartCal.toFixed(1));
