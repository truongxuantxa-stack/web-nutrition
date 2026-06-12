'use strict';

const { WeightLog, User } = require('../models');
const { Op } = require('sequelize');

const EMA_ALPHA = 0.15;
const GAP_THRESHOLD_DAYS = 14;
const MIN_RIBBON_DEV = 0.3;
const MAX_RIBBON_DEV = 1.5;

// Helper to calculate days between two YYYY-MM-DD strings
const getDaysDifference = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
};

// Calculate standard deviation of an array of numbers
const calculateStdDev = (values) => {
    if (values.length < 2) return 0.5; // Default if not enough data
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
    return Math.sqrt(variance);
};

const calculateEMASeries = (weightLogs) => {
    if (!weightLogs || weightLogs.length === 0) return [];

    const series = [];
    let currentEMA = weightLogs[0].weight;
    let lastDate = weightLogs[0].date;

    for (let i = 0; i < weightLogs.length; i++) {
        const log = weightLogs[i];
        const daysDiff = i === 0 ? 0 : getDaysDifference(lastDate, log.date);
        
        let isReset = false;
        
        if (i === 0) {
            currentEMA = log.weight;
        } else if (daysDiff >= GAP_THRESHOLD_DAYS) {
            currentEMA = log.weight;
            isReset = true;
        } else {
            currentEMA = (log.weight * EMA_ALPHA) + (currentEMA * (1 - EMA_ALPHA));
        }

        series.push({
            date: log.date,
            raw: log.weight,
            ema: currentEMA,
            isReset
        });

        lastDate = log.date;
    }

    return series;
};

const calculateRibbonBounds = (emaSeries) => {
    const bounds = [];
    
    for (let i = 0; i < emaSeries.length; i++) {
        // Get last 7 entries for rolling stddev
        const startIdx = Math.max(0, i - 6);
        const windowSlice = emaSeries.slice(startIdx, i + 1);
        const rawValues = windowSlice.map(item => item.raw);
        
        let stdDev = calculateStdDev(rawValues);
        
        // Clamp deviation
        let deviation = Math.max(MIN_RIBBON_DEV, Math.min(MAX_RIBBON_DEV, stdDev));
        
        bounds.push({
            date: emaSeries[i].date,
            upper: emaSeries[i].ema + deviation,
            lower: emaSeries[i].ema - deviation
        });
    }
    
    return bounds;
};

const calculateRateOfChange = (emaSeries) => {
    if (emaSeries.length < 2) {
        return { weeklyRate: 0, direction: 'stable' };
    }

    const latest = emaSeries[emaSeries.length - 1];
    
    // Find entry from approx 7 days ago, or the earliest available if less than 7 days
    let pastEntry = emaSeries[0];
    for (let i = emaSeries.length - 2; i >= 0; i--) {
        const daysDiff = getDaysDifference(emaSeries[i].date, latest.date);
        if (daysDiff >= 7) {
            pastEntry = emaSeries[i];
            break;
        }
    }

    const daysSpan = getDaysDifference(pastEntry.date, latest.date) || 1; // avoid division by zero
    const weightDiff = latest.ema - pastEntry.ema;
    
    // Normalize to 7 days (weekly rate)
    const weeklyRate = (weightDiff / daysSpan) * 7;
    
    let direction = 'stable';
    if (weeklyRate <= -0.1) direction = 'down';
    else if (weeklyRate >= 0.1) direction = 'up';

    return { 
        weeklyRate: Number(weeklyRate.toFixed(2)), 
        direction 
    };
};

const calculateProjection = (currentEma, weeklyRate, lastEmaDate, weeks = 4) => {
    if (!currentEma || weeklyRate === 0) return [];
    
    const projection = [];
    const startDate = new Date(lastEmaDate);
    
    // Add point for the last known EMA date to connect the line seamlessly
    projection.push({
        date: lastEmaDate,
        projected: currentEma,
        opacity: 0.8
    });

    for (let w = 1; w <= weeks; w++) {
        const projDate = new Date(startDate);
        projDate.setDate(projDate.getDate() + (w * 7));
        
        const opacity = Math.max(0.1, 0.8 - (w * 0.15)); // Decreasing opacity
        
        projection.push({
            date: projDate.toISOString().split('T')[0],
            projected: Number((currentEma + (weeklyRate * w)).toFixed(2)),
            opacity: Number(opacity.toFixed(2))
        });
    }
    
    return projection;
};

const buildTrendResponse = async (userId, range) => {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');

    let dateFilter = {};
    if (range && range !== 'all') {
        const days = parseInt(range, 10);
        if (!isNaN(days)) {
            const startDate = new Date();
            // Lấy thêm 14 ngày về trước để đảm bảo EMA được "warm-up" mượt mà
            startDate.setDate(startDate.getDate() - (days + 14));
            dateFilter = {
                date: {
                    [Op.gte]: startDate.toISOString().split('T')[0]
                }
            };
        }
    }

    const logs = await WeightLog.findAll({
        where: {
            userId,
            ...dateFilter
        },
        order: [['date', 'ASC']]
    });

    // Check if sufficient data (at least 5 points in total history for the trend to make sense)
    const totalLogsCount = await WeightLog.count({ where: { userId } });
    const hasSufficientData = totalLogsCount >= 5;

    if (!logs || logs.length === 0) {
        return {
            rawPoints: [],
            trendLine: [],
            ribbonBounds: [],
            projectionLine: [],
            breakpoints: [],
            summary: {
                trendWeight: null,
                latestRaw: null,
                weeklyRate: 0,
                direction: 'stable',
                goalWeight: user.goalWeight || null,
                goal: user.goal || 'lose_weight'
            },
            hasSufficientData: false
        };
    }

    const emaSeriesAll = calculateEMASeries(logs);
    
    // Filter out the warm-up period if a range is specified
    let displayEmaSeries = emaSeriesAll;
    if (range && range !== 'all') {
        const days = parseInt(range, 10);
        const displayStartDate = new Date();
        displayStartDate.setDate(displayStartDate.getDate() - days);
        const displayStartStr = displayStartDate.toISOString().split('T')[0];
        
        displayEmaSeries = emaSeriesAll.filter(item => item.date >= displayStartStr);
    }
    
    if (displayEmaSeries.length === 0) {
        displayEmaSeries = emaSeriesAll.slice(-1); // At least one point if exists
    }

    const bounds = calculateRibbonBounds(displayEmaSeries);
    const { weeklyRate, direction } = calculateRateOfChange(emaSeriesAll); // use all available for better rate

    const latestEmaItem = emaSeriesAll[emaSeriesAll.length - 1];
    const latestRaw = latestEmaItem.raw;
    const currentEma = Number(latestEmaItem.ema.toFixed(2));
    
    let projectionLine = [];
    if (hasSufficientData) {
        projectionLine = calculateProjection(currentEma, weeklyRate, latestEmaItem.date, 4);
    }

    const breakpoints = displayEmaSeries
        .filter(item => item.isReset)
        .map(item => item.date);

    return {
        rawPoints: displayEmaSeries.map(item => ({ date: item.date, weight: item.raw })),
        trendLine: displayEmaSeries.map(item => ({ date: item.date, ema: Number(item.ema.toFixed(2)) })),
        ribbonBounds: bounds.map(item => ({ 
            date: item.date, 
            upper: Number(item.upper.toFixed(2)), 
            lower: Number(item.lower.toFixed(2)) 
        })),
        projectionLine,
        breakpoints,
        summary: {
            trendWeight: currentEma,
            latestRaw,
            weeklyRate,
            direction,
            goalWeight: user.goalWeight || null,
            goal: user.goal || 'lose_weight'
        },
        hasSufficientData
    };
};

const getLatestEMA = async (userId) => {
    // Get last 15 logs to calculate EMA (14 days warm up is enough)
    const logs = await WeightLog.findAll({
        where: { userId },
        order: [['date', 'DESC']],
        limit: 15
    });
    
    if (!logs || logs.length < 5) return null; // Not enough data for reliable EMA
    
    // Reverse to chronological order
    logs.reverse();
    const series = calculateEMASeries(logs);
    return series[series.length - 1].ema;
};

module.exports = {
    calculateEMASeries,
    calculateRibbonBounds,
    calculateRateOfChange,
    calculateProjection,
    buildTrendResponse,
    getLatestEMA
};
