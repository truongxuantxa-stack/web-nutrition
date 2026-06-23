'use strict';

const cloudinary = require('cloudinary').v2;

// Cấu hình Cloudinary
// (Credentials sẽ tự động lấy từ process.env.CLOUDINARY_URL hoặc các biến lẻ)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload ảnh sản phẩm lên Cloudinary
 * @param {string} base64Image - Ảnh dạng base64 (có thể có hoặc không có tiền tố data:image/...)
 * @param {string} productName - Tên sản phẩm (để tạo folder/public_id gợi nhớ)
 * @returns {Promise<{ url: string, publicId: string }>}
 */
const uploadProductImage = async (base64Image, productName) => {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
            throw new Error('Chưa cấu hình Cloudinary Credentials trong .env');
        }

        // Nếu chuỗi base64 chưa có data:image prefix, Cloudinary có thể báo lỗi.
        // Ta cần đảm bảo chuỗi hợp lệ. Thường FE truyền lên dạng data:image/jpeg;base64,...
        const fileToUpload = base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`;

        // Chuẩn hóa tên để làm public_id (bỏ dấu, ký tự đặc biệt)
        const safeName = productName 
            ? productName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '_').substring(0, 50)
            : 'product';

        const result = await cloudinary.uploader.upload(fileToUpload, {
            folder: 'webdinhduong/products',
            public_id: `${safeName}_${Date.now()}`,
            format: 'webp', // Tự động convert sang webp để tối ưu dung lượng
            transformation: [
                { width: 800, height: 800, crop: 'limit' }, // Không vượt quá 800px
                { quality: 'auto' } // Tự động nén ảnh
            ]
        });

        return {
            url: result.secure_url,
            publicId: result.public_id,
        };
    } catch (error) {
        console.error('[CloudinaryService] Upload failed:', error);
        throw new Error('Lỗi khi tải ảnh lên Cloud: ' + error.message);
    }
};

module.exports = {
    uploadProductImage
};
