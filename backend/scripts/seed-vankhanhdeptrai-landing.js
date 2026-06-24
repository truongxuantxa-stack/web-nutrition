'use strict';

require('dotenv').config();
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const User = require('../models/User');
const WeightLog = require('../models/WeightLog');
const WaterLog = require('../models/WaterLog');
const DiaryEntry = require('../models/DiaryEntry');
const ExerciseLog = require('../models/ExerciseLog');
const Food = require('../models/Food');

const TARGET_EMAIL = 'Vankhanhdeptrai@gmail.com';
const TARGET_DATE = '2026-06-16';

function addDays(dateStr, days) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

async function run() {
    try {
        await sequelize.authenticate();
        console.log('Connected to database.');

        const user = await User.findOne({ where: { email: TARGET_EMAIL } });
        if (!user) {
            throw new Error(`User with email ${TARGET_EMAIL} not found!`);
        }

        console.log(`Found user: ${user.fullName} (${user.id})`);

        // Update user profile
        await user.update({
            fullName: 'Nguyễn Văn Khánh',
            gender: 'male',
            birthDate: '2002-06-15',
            height: 175,
            weight: 68.5,
            activityLevel: 'moderate',
            goal: 'lose_weight',
            goalWeight: 65,
            isOnboarded: true,
            waterGoal: 2500,
            macroProtein: 30,
            macroCarbs: 40,
            macroFat: 30,
            useAdaptiveTDEE: true
        });
        console.log('Updated user profile.');

        // Find last seeded dates independently (ignore any existing target date data so we can cleanly overwrite it and fill gaps before it)
        const lastWeight = await WeightLog.findOne({ where: { userId: user.id, date: { [Op.lt]: TARGET_DATE } }, order: [['date', 'DESC']] });
        const lastDiary = await DiaryEntry.findOne({ where: { userId: user.id, date: { [Op.lt]: TARGET_DATE } }, order: [['date', 'DESC']] });
        const lastWater = await WaterLog.findOne({ where: { userId: user.id, date: { [Op.lt]: TARGET_DATE } }, order: [['date', 'DESC']] });
        const lastExercise = await ExerciseLog.findOne({ where: { userId: user.id, date: { [Op.lt]: TARGET_DATE } }, order: [['date', 'DESC']] });

        // Helper to get or create Food
        const getFood = async (name, defaults) => {
            let food = await Food.findOne({ where: { name: { [Op.like]: `%${name}%` } } });
            if (!food) {
                food = await Food.create({
                    name,
                    ...defaults,
                    unit: '1 phần',
                    category: 'khac',
                    foodType: 'dish',
                    isSuggestable: true,
                    dataSource: 'local'
                });
            }
            return food;
        };

        const fPhoGa = await getFood('Phở Gà', { calories: 480, protein: 30, carbs: 70, fat: 10 });
        const fComBo = await getFood('Cơm gạo lứt thịt bò', { calories: 555, protein: 35, carbs: 70, fat: 15 });
        const fRauMuong = await getFood('Rau Muống Xào Tỏi', { calories: 120, protein: 3, carbs: 5, fat: 10 });
        const fUcGa = await getFood('Ức Gà Áp Chảo Sốt Chanh Dây', { calories: 250, protein: 40, carbs: 5, fat: 8 });
        const fCanhTom = await getFood('Canh Cải Thảo Nấu Tôm', { calories: 70, protein: 8, carbs: 5, fat: 2 });
        const fChuoi = await getFood('Chuối', { calories: 90, protein: 1, carbs: 23, fat: 0 });
        const fSuaChua = await getFood('Sữa chua Hy Lạp', { calories: 88, protein: 10, carbs: 5, fat: 3 });

        const foods = [fPhoGa, fComBo, fRauMuong, fUcGa, fCanhTom, fChuoi, fSuaChua];

        const isRaw = (f) => f.foodType === 'raw';
        const calcAmount = (f, baseAmount, customRawGrams = 100) => {
            return isRaw(f) ? customRawGrams * baseAmount : baseAmount;
        };
        const calcSnap = (f, amountNum) => {
            const factor = isRaw(f) ? amountNum / 100 : amountNum;
            return {
                caloriesSnapshot: Math.round(f.calories * factor * 10) / 10,
                proteinSnapshot: Math.round(f.protein * factor * 10) / 10,
                carbsSnapshot: Math.round(f.carbs * factor * 10) / 10,
                fatSnapshot: Math.round(f.fat * factor * 10) / 10
            };
        };

        // 1. Fill WeightLog — XÓA TOÀN BỘ dữ liệu cũ (sai từ lần seed trước) và tạo lại từ đầu
        const WEIGHT_SEED_DAYS = 45;
        const weightStartDate = addDays(TARGET_DATE, -(WEIGHT_SEED_DAYS - 1)); // 45 ngày trước đến hôm nay
        const startWeight = 71.5;
        const targetWeight = 68.5;

        console.log(`WeightLog: deleting ALL old data, recreating ${WEIGHT_SEED_DAYS} days (${weightStartDate} -> ${TARGET_DATE}), ${startWeight}kg -> ${targetWeight}kg`);

        await WeightLog.destroy({ where: { userId: user.id } });

        const dailyDrop = (startWeight - targetWeight) / (WEIGHT_SEED_DAYS - 1);
        let weightDate = weightStartDate;
        for (let i = 0; i < WEIGHT_SEED_DAYS; i++) {
            const w = i === WEIGHT_SEED_DAYS - 1
                ? targetWeight
                : startWeight - (dailyDrop * i) + (Math.random() * 0.3 - 0.15);
            
            await WeightLog.create({
                userId: user.id,
                date: weightDate,
                weight: Math.round(w * 10) / 10,
                note: weightDate === TARGET_DATE ? 'Cân nặng đạt mục tiêu' : ''
            });
            weightDate = addDays(weightDate, 1);
        }
        console.log(`WeightLog: created ${WEIGHT_SEED_DAYS} entries.`);

        // 2. Fill WaterLog Gap
        let waterDate = lastWater ? addDays(lastWater.date, 1) : addDays(TARGET_DATE, -45);
        while (waterDate <= TARGET_DATE) {
            const isTargetDate = waterDate === TARGET_DATE;
            const existing = await WaterLog.count({ where: { userId: user.id, date: waterDate } });
            if (existing > 0 && isTargetDate) await WaterLog.destroy({ where: { userId: user.id, date: waterDate } });
            
            if (existing === 0 || isTargetDate) {
                if (isTargetDate) {
                    await WaterLog.bulkCreate([
                        { userId: user.id, date: waterDate, amount: 500, note: 'Sáng' },
                        { userId: user.id, date: waterDate, amount: 600, note: 'Trưa' },
                        { userId: user.id, date: waterDate, amount: 600, note: 'Chiều' },
                        { userId: user.id, date: waterDate, amount: 400, note: 'Tối' },
                    ]);
                } else {
                    await WaterLog.bulkCreate([
                        { userId: user.id, date: waterDate, amount: 400 + Math.floor(Math.random()*200) },
                        { userId: user.id, date: waterDate, amount: 400 + Math.floor(Math.random()*200) },
                        { userId: user.id, date: waterDate, amount: 400 + Math.floor(Math.random()*200) },
                        { userId: user.id, date: waterDate, amount: 200 + Math.floor(Math.random()*200) }
                    ]);
                }
            }
            waterDate = addDays(waterDate, 1);
        }

        // 3. Fill DiaryEntry Gap
        let diaryDate = lastDiary ? addDays(lastDiary.date, 1) : addDays(TARGET_DATE, -45);
        while (diaryDate <= TARGET_DATE) {
            const isTargetDate = diaryDate === TARGET_DATE;
            const existing = await DiaryEntry.count({ where: { userId: user.id, date: diaryDate } });
            if (existing > 0 && isTargetDate) await DiaryEntry.destroy({ where: { userId: user.id, date: diaryDate } });
            
            if (existing === 0 || isTargetDate) {
                if (isTargetDate) {
                    const mealsTarget = [
                        { food: fPhoGa, mealType: 'sang', gramsIfRaw: 100 },
                        { food: fComBo, mealType: 'trua', gramsIfRaw: 100 },
                        { food: fRauMuong, mealType: 'trua', gramsIfRaw: 100 },
                        { food: fUcGa, mealType: 'toi', gramsIfRaw: 100 },
                        { food: fCanhTom, mealType: 'toi', gramsIfRaw: 100 },
                        { food: fChuoi, mealType: 'phu', gramsIfRaw: 100 },
                        { food: fSuaChua, mealType: 'phu', gramsIfRaw: 150 }
                    ];

                    for (const m of mealsTarget) {
                        const amountNum = calcAmount(m.food, 1, m.gramsIfRaw);
                        const snap = calcSnap(m.food, amountNum);
                        await DiaryEntry.create({
                            userId: user.id, foodId: m.food.id, amount: amountNum, mealType: m.mealType, date: diaryDate, ...snap
                        });
                    }
                } else {
                    const mealsRandom = [
                        { food: foods[Math.floor(Math.random() * foods.length)], mealType: 'sang', gramsIfRaw: 100 },
                        { food: foods[Math.floor(Math.random() * foods.length)], mealType: 'trua', gramsIfRaw: 100 },
                        { food: foods[Math.floor(Math.random() * foods.length)], mealType: 'toi', gramsIfRaw: 100 },
                        { food: foods[Math.floor(Math.random() * foods.length)], mealType: 'phu', gramsIfRaw: 100 }
                    ];
                    for (const m of mealsRandom) {
                        const amountNum = calcAmount(m.food, 1, m.gramsIfRaw);
                        const snap = calcSnap(m.food, amountNum);
                        await DiaryEntry.create({
                            userId: user.id, foodId: m.food.id, amount: amountNum, mealType: m.mealType, date: diaryDate, ...snap
                        });
                    }
                }
            }
            diaryDate = addDays(diaryDate, 1);
        }

        // 4. Fill ExerciseLog Gap
        let exerciseDate = lastExercise ? addDays(lastExercise.date, 1) : addDays(TARGET_DATE, -45);
        while (exerciseDate <= TARGET_DATE) {
            const isTargetDate = exerciseDate === TARGET_DATE;
            const existing = await ExerciseLog.count({ where: { userId: user.id, date: exerciseDate } });
            if (existing > 0 && isTargetDate) await ExerciseLog.destroy({ where: { userId: user.id, date: exerciseDate } });
            
            if (existing === 0 || isTargetDate) {
                if (isTargetDate) {
                    await ExerciseLog.create({
                        userId: user.id, sport: 'running', duration: 40, caloriesBurned: 340, date: exerciseDate
                    });
                } else {
                    if (Math.random() > 0.3) {
                        await ExerciseLog.create({
                            userId: user.id,
                            sport: ['running', 'cycling', 'swimming', 'badminton'][Math.floor(Math.random()*4)],
                            duration: 30 + Math.floor(Math.random()*30),
                            caloriesBurned: 200 + Math.floor(Math.random()*150),
                            date: exerciseDate
                        });
                    }
                }
            }
            exerciseDate = addDays(exerciseDate, 1);
        }

        console.log('Seeding completed successfully.');
        process.exit(0);

    } catch (error) {
        console.error('Error during seeding:', error);
        process.exit(1);
    }
}

// Chi chay khi file duoc goi TRUC TIEP (node backend\scripts\seed-vankhanhdeptrai-landing.js)
// Tranh tu dong thuc thi khi bi require() boi file khac -> Ngan xoa DB nham!
if (require.main === module) {
    run();
}