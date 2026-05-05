require('dotenv').config();
const mysql2 = require('mysql2/promise');

async function createDatabase() {
    const connection = await mysql2.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

    try {
        await connection.execute(
            `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`
             CHARACTER SET utf8mb4
             COLLATE utf8mb4_unicode_ci`
        );
        console.log(`✅ Database "${process.env.DB_NAME}" đã được tạo thành công!`);

        await connection.execute(`USE \`${process.env.DB_NAME}\``);
        console.log(`✅ Đang sử dụng database: ${process.env.DB_NAME}`);
    } catch (err) {
        console.error('❌ Lỗi tạo database:', err.message);
    } finally {
        await connection.end();
    }
}

createDatabase();
