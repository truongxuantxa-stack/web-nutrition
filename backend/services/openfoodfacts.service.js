'use strict';

const { Food } = require('../models');

/**
 * Gọi API Open Food Facts v2
 * @param {string} query 
 * @param {number} limit 
 * @returns {Array} Mảng các sản phẩm đã chuẩn hóa
 */
const searchOpenFoodFacts = async (query, limit = 10) => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const url = new URL('https://world.openfoodfacts.org/cgi/search.pl');
        url.searchParams.append('search_terms', query);
        url.searchParams.append('json', '1');
        url.searchParams.append('page_size', limit.toString());
        url.searchParams.append('lc', 'vi');
        url.searchParams.append('cc', 'vn');
        url.searchParams.append('fields', 'code,product_name,nutriments,image_front_small_url');

        const response = await fetch(url.toString(), {
            signal: controller.signal,
            headers: {
                'User-Agent': 'WebDinhDuong - Node.js Backend - Graduation Project'
            }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Open Food Facts API error: ${response.status}`);
        }

        const data = await response.json();

        if (!data || !data.products) {
            return [];
        }

        const normalizedProducts = data.products
            .filter(p => p.product_name && p.nutriments && p.nutriments['energy-kcal_100g'] !== undefined)
            .map(p => {
                const nutriments = p.nutriments || {};
                return {
                    barcode: p.code,
                    name: p.product_name.trim(),
                    calories: nutriments['energy-kcal_100g'] || 0,
                    protein: nutriments['proteins_100g'] || 0,
                    carbs: nutriments['carbohydrates_100g'] || 0,
                    fat: nutriments['fat_100g'] || 0,
                    fiber: nutriments['fiber_100g'] || null,
                    sugar: nutriments['sugars_100g'] || null,
                    sodium: nutriments['sodium_100g'] ? (nutriments['sodium_100g'] * 1000) : null,
                    vitaminA: nutriments['vitamin-a_100g'] ? (nutriments['vitamin-a_100g'] * 1000000) : null,
                    vitaminC: nutriments['vitamin-c_100g'] ? (nutriments['vitamin-c_100g'] * 1000) : null,
                    calcium: nutriments['calcium_100g'] ? (nutriments['calcium_100g'] * 1000) : null,
                    iron: nutriments['iron_100g'] ? (nutriments['iron_100g'] * 1000) : null,
                    imageUrl: p.image_front_small_url || null,
                    foodType: 'raw',
                    category: 'khac',
                    unit: '100g',
                    isSuggestable: false,
                    dataSource: 'openfoodfacts'
                };
            });

        return normalizedProducts;
    } catch (error) {
        console.warn('[HybridSearch] OFF API failed/timeout:', error.message);
        throw error;
    }
};

/**
 * Lưu vào Local DB (dedup bằng barcode hoặc name)
 * @param {Array} products 
 * @returns {Array}
 */
const saveToLocalDB = async (products) => {
    const savedFoods = [];
    
    for (const p of products) {
        let existingFood = null;
        
        if (p.barcode) {
            existingFood = await Food.findOne({ where: { barcode: p.barcode } });
        }
        
        if (!existingFood && !p.barcode) {
            existingFood = await Food.findOne({ where: { name: p.name, dataSource: 'openfoodfacts' } });
        }

        if (!existingFood) {
            try {
                const newFood = await Food.create(p);
                savedFoods.push(newFood);
            } catch (err) {
                console.warn(`[HybridSearch] Failed to save OFF product ${p.name}:`, err.message);
            }
        } else {
            savedFoods.push(existingFood);
        }
    }
    
    return savedFoods;
};

module.exports = {
    searchOpenFoodFacts,
    saveToLocalDB
};
