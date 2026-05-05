require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();

// ─── View Engine ───────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Middlewares ────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Routes ─────────────────────────────────────────────────
const routes = require('./routes');
app.use('/', routes);

// ─── 404 Handler ────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).render('404', { title: 'Không tìm thấy trang' });
});

// ─── Error Handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: err.message });
});

// ─── Start Server ───────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
    console.log(`✅ Server đang chạy tại http://localhost:${PORT}`);

    // Kết nối và sync database
    try {
        const { sequelize } = require('./models');
        await sequelize.authenticate();
        console.log('✅ Kết nối MySQL thành công!');
        // sync({ alter: true }) để cập nhật schema mà không mất dữ liệu
        await sequelize.sync({ alter: true });
        console.log('✅ Database đã được đồng bộ!');
    } catch (error) {
        console.error('❌ Lỗi kết nối Database:', error.message);
    }
});

module.exports = app;
