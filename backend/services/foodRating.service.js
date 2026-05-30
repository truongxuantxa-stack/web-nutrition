'use strict';

/**
 * foodRating.service.js
 * Logic đánh giá thực phẩm theo chuẩn FSA
 */

// 1. Hằng số ngưỡng FSA
const FSA_PER_100G = {
  sugar:  { green: 5, red: 22.5 },
  sodium: { green: 120, red: 600 },
  caloricDensity: { green: 1, red: 4 }, // kcal per gram
};

const FSA_PER_PORTION = {
  sugar:    { green: 6.75, red: 27 },
  sodium:   { green: 180, red: 720 },
  calories: { green: 400, red: 600 },
};

// 2. Bảng gợi ý thay thế
const ALTERNATIVES_MAP = {
  do_uong: {
    sugar: ['Trà đào không đường', 'Nước chanh leo', 'Trà xanh không đường'],
    sodium: ['Nước lọc', 'Nước dừa tươi'],
    calories: ['Trà xanh không đường', 'Nước ép rau củ'],
  },
  banh: {
    sugar: ['Bánh gạo lứt', 'Yến mạch trộn trái cây'],
    sodium: ['Bánh cuốn', 'Bánh ướt'],
    caloricDensity: ['Bánh cuốn', 'Bánh tráng cuốn'],
    calories: ['Bánh cuốn', 'Bánh ướt'],
  },
  thit_ca: {
    sodium: ['Ức gà luộc', 'Cá hồi nướng', 'Trứng luộc'],
    calories: ['Ức gà luộc', 'Cá hấp', 'Trứng luộc'],
  },
  com: {
    caloricDensity: ['Cơm gạo lứt', 'Khoai lang luộc'],
    calories: ['Cơm gạo lứt', 'Khoai lang luộc'],
  },
  pho_bun: {
    sodium: ['Bún rau xanh', 'Phở ít nước dùng'],
    calories: ['Bún trộn rau', 'Miến gà'],
  },
  _default: {
    sugar: ['Trái cây tươi', 'Sữa chua không đường'],
    sodium: ['Rau luộc', 'Canh rau ngọt'],
    caloricDensity: ['Salad rau', 'Súp rau củ'],
    calories: ['Salad rau', 'Súp rau củ nhẹ'],
  },
};

const getAlternatives = (category, redCriteriaKeys) => {
  const cat = category || '';
  let mapKey = '_default';
  
  if (cat.includes('uống') || cat.toLowerCase().includes('drink')) mapKey = 'do_uong';
  else if (cat.toLowerCase().includes('bánh')) mapKey = 'banh';
  else if (cat.toLowerCase().includes('thịt') || cat.toLowerCase().includes('cá')) mapKey = 'thit_ca';
  else if (cat.toLowerCase().includes('cơm')) mapKey = 'com';
  else if (cat.toLowerCase().includes('phở') || cat.toLowerCase().includes('bún') || cat.toLowerCase().includes('mì')) mapKey = 'pho_bun';

  const map = ALTERNATIVES_MAP[mapKey] || ALTERNATIVES_MAP._default;
  const suggestions = [];

  redCriteriaKeys.forEach(key => {
    if (map[key]) {
      suggestions.push(...map[key]);
    } else if (ALTERNATIVES_MAP._default[key]) {
      suggestions.push(...ALTERNATIVES_MAP._default[key]);
    }
  });

  return [...new Set(suggestions)].slice(0, 3); // Deduplicate & max 3
};

const getHealthyHighlights = (food, foodType) => {
  const highlights = [];
  const p = food.protein || 0;
  const f = food.fiber || 0;
  const c = food.calories || 0;
  const vitC = food.vitaminC || 0;
  const ca = food.calcium || 0;
  const ir = food.iron || 0;

  if (foodType === 'raw') {
    if (p > 15) highlights.push('Giàu Protein');
    if (f > 3) highlights.push('Giàu Chất xơ');
    if (c < 100) highlights.push('Ít calo');
  } else {
    if (p > 20) highlights.push('Giàu Protein');
    if (f > 5) highlights.push('Giàu Chất xơ');
    if (c <= 400) highlights.push('Ít calo');
  }

  if (vitC > 30) highlights.push('Giàu Vitamin C');
  if (ca > 150) highlights.push('Giàu Canxi');
  if (ir > 3) highlights.push('Giàu Sắt');

  return highlights;
};

const getFSATrafficLight = (food) => {
  if (!food) return null;

  const mode = food.foodType === 'raw' ? 'per100g' : 'perPortion';
  const thresholds = mode === 'per100g' ? FSA_PER_100G : FSA_PER_PORTION;
  const criteria = {};
  let hasRed = false;
  let redCount = 0;
  const redKeys = [];

  const evaluate = (key, value, name, unit) => {
    if (value === null || value === undefined) return;
    let t = thresholds[key];
    if (!t) return;

    let rating = 'amber';
    let label = '🟡';
    let thresholdLabel = '';

    if (value <= t.green) {
      rating = 'green';
      label = '🟢';
      thresholdLabel = `≤ ${t.green}${unit}`;
    } else if (value > t.red) {
      rating = 'red';
      label = '🔴';
      hasRed = true;
      redCount++;
      redKeys.push(key);
      thresholdLabel = `> ${t.red}${unit}`;
    } else {
      thresholdLabel = `${t.green} - ${t.red}${unit}`;
    }

    criteria[key] = { value, rating, label, threshold: thresholdLabel, name, unit };
  };

  evaluate('sugar', food.sugar, 'Đường', 'g');
  evaluate('sodium', food.sodium, 'Natri', 'mg');

  if (mode === 'per100g') {
    const caloricDensity = (food.calories || 0) / 100;
    evaluate('caloricDensity', caloricDensity, 'Mật độ calo', ' kcal/g');
  } else {
    evaluate('calories', food.calories, 'Calo tổng', ' kcal');
  }

  return {
    mode,
    criteria,
    hasRed,
    redCount,
    redKeys,
    alternatives: hasRed ? getAlternatives(food.category, redKeys) : [],
    highlights: !hasRed ? getHealthyHighlights(food, food.foodType) : [],
  };
};

const buildFoodHealthRating = (diaryEntries) => {
  const foodMap = {}; // foodId -> { food, frequency }

  diaryEntries.forEach(entry => {
    if (!entry.food) return; // Ignore entries without food info
    const id = entry.foodId;
    if (!foodMap[id]) {
      foodMap[id] = { food: entry.food, frequency: 0 };
    }
    foodMap[id].frequency++;
  });

  const foods = Object.values(foodMap);
  let warnings = [];
  let healthy = [];
  
  foods.forEach(f => {
    const rating = getFSATrafficLight(f.food);
    if (!rating) return;
    
    if (rating.hasRed && f.frequency >= 2) {
      warnings.push({
        food: f.food,
        frequency: f.frequency,
        rating
      });
    } else if (!rating.hasRed) {
      healthy.push({
        food: f.food,
        frequency: f.frequency,
        rating,
        highlights: rating.highlights
      });
    }
  });

  warnings.sort((a, b) => b.rating.redCount - a.rating.redCount || b.frequency - a.frequency);
  warnings = warnings.slice(0, 5);

  healthy.sort((a, b) => b.frequency - a.frequency);
  healthy = healthy.slice(0, 5);

  return {
    warnings,
    healthy,
    summary: {
      totalUniqueFoods: foods.length,
      redFlaggedCount: warnings.length,
      allGreenCount: healthy.length,
    }
  };
};

module.exports = { buildFoodHealthRating, getFSATrafficLight, getAlternatives, getHealthyHighlights };
