const { generateReportPDF } = require('./backend/services/pdf.service.js');
const fs = require('fs');

const mockData = {
    user: { fullName: 'Test', gender: 'male', goal: 'Giảm cân' },
    period: { label: 'Test', rangeLabel: 'Test' },
    metrics: { tdee: 2000, targetCalories: 2000, macros: { protein: 100, carbs: 100, fat: 100 } },
    dailyLog: [],
    summary: { avgCalories: 0, avgProtein: 0, avgCarbs: 0, avgFat: 0, avgWater: 0, calorieCompliance: 0 },
    adaptiveTDEE: [],
    adaptiveInsight: { message: 'Test message', hasData: false },
    isEmpty: false,
    healthInsights: [],
    healthScore: { score: 100, bonuses: [] },
    foodHealthRating: {
        warnings: [
            {
                food: { name: 'Trà sữa', category: 'do_uong' },
                frequency: 3,
                rating: {
                    criteria: {
                        sugar: { name: 'Đường', value: 35, unit: 'g', rating: 'red', threshold: '> 27g' }
                    },
                    alternatives: ['Trà đào không đường', 'Nước lọc']
                }
            }
        ],
        healthy: [
            {
                food: { name: 'Bông cải xanh' },
                frequency: 5,
                rating: { criteria: {} },
                highlights: ['Giàu Chất xơ', 'Ít calo']
            }
        ],
        summary: { totalUniqueFoods: 10, redFlaggedCount: 1, allGreenCount: 1 }
    }
};

try {
    const doc = generateReportPDF(mockData);
    doc.pipe(fs.createWriteStream('test_out.pdf'));
    console.log('PDF generation successful');
} catch (e) {
    console.error('PDF generation crashed:', e);
}
