const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false, // Tắt log SQL query (bật lại khi debug: console.log)
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
        define: {
            timestamps: true,       // Tự động thêm createdAt, updatedAt
            underscored: false,     // Dùng camelCase cho tên cột
            charset: 'utf8mb4',
            collate: 'utf8mb4_unicode_ci',
        },
        timezone: '+07:00',         // Múi giờ Việt Nam
    }
);

module.exports = sequelize;
