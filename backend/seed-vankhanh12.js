require('dotenv').config();
const { sequelize, User, Food, DiaryEntry, WeightLog, WaterLog, ExerciseLog } = require('./models');

async function seedData() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database');

        const email = 'vankhanh12@gmail.com';
        const user = await User.findOne({ where: { email } });
        
        if (!user) {
            console.error(`❌ User with email ${email} not found!`);
            process.exit(1);
        }

        console.log(`✅ Found user: ${user.fullName} (ID: ${user.id})`);

        // Update user properties for testing
        await user.update({
            height: 170,
            weight: 70,
            activityLevel: 'moderate',
            goal: 'lose_weight',
            isOnboarded: true,
            macroProtein: 30,
            macroCarbs: 40,
            macroFat: 30,
            useAdaptiveTDEE: true
        });

        // Find or create dummy food
        const [food] = await Food.findOrCreate({
            where: { name: 'Thực phẩm Test Seed' },
            defaults: {
                calories: 500,
                protein: 40,
                carbs: 50,
                fat: 15,
                unit: 'phần',
                category: 'khac',
                foodType: 'dish',
                isSuggestable: false,
                isCustom: false
            }
        });
        
        console.log(`✅ Dummy food ready (ID: ${food.id})`);

        // Generate data for 30 days ago up to yesterday (or today)
        const entries = [];
        const weights = [];
        const waters = [];
        const exercises = [];

        for (let i = 30; i >= 1; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Weight fluctuates slightly around 70-72
            // Let's make a steady decrease from 72 to 70
            const weight = 70 + (i / 15); // i=30 -> 72, i=1 -> 70.06

            weights.push({
                userId: user.id,
                weight: weight,
                date: dateStr,
                note: 'Seed'
            });

            waters.push({
                userId: user.id,
                amount: 2000 + Math.floor(Math.random() * 500),
                date: dateStr,
                note: 'Seed'
            });

            exercises.push({
                userId: user.id,
                sport: 'running',
                duration: 30,
                caloriesBurned: 300,
                date: dateStr
            });

            const meals = ['sang', 'trua', 'toi', 'phu'];
            meals.forEach(meal => {
                entries.push({
                    userId: user.id,
                    foodId: food.id,
                    amount: 1,
                    mealType: meal,
                    date: dateStr,
                    caloriesSnapshot: food.calories,
                    proteinSnapshot: food.protein,
                    carbsSnapshot: food.carbs,
                    fatSnapshot: food.fat,
                    note: 'Seed'
                });
            });
        }

        console.log('⏳ Inserting WeightLogs...');
        await WeightLog.bulkCreate(weights, { ignoreDuplicates: true });
        
        console.log('⏳ Inserting WaterLogs...');
        await WaterLog.bulkCreate(waters, { ignoreDuplicates: true });
        
        console.log('⏳ Inserting ExerciseLogs...');
        await ExerciseLog.bulkCreate(exercises, { ignoreDuplicates: true });
        
        console.log('⏳ Inserting DiaryEntries...');
        await DiaryEntry.bulkCreate(entries, { ignoreDuplicates: true });

        console.log('🎉 Seed data successfully added!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
}

seedData();
