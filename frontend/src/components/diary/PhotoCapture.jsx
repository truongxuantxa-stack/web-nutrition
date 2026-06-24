import { useState, useRef } from 'react';
import { Camera, ImageIcon } from 'lucide-react';

/**
 * Nén ảnh về max 1280px, JPEG quality 0.85.
 */
const compressImage = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Giảm xuống 800px + quality 0.7 để tăng tốc đáng kể tốc độ upload và xử lý của AI
                const MAX = 800;
                let { width, height } = img;
                if (width > MAX || height > MAX) {
                    const ratio = Math.min(MAX / width, MAX / height);
                    width = Math.round(width * ratio);
                    height = Math.round(height * ratio);
                }
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve({
                    base64: dataUrl.split(',')[1],
                    mimeType: 'image/jpeg',
                    previewUrl: dataUrl,
                });
            };
            img.onerror = () => reject(new Error('Không thể đọc ảnh'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Không thể đọc file'));
        reader.readAsDataURL(file);
    });
};

/**
 * PhotoCapture — Sử dụng Camera GỐC của điện thoại thông qua <input capture>.
 * 
 * Tại sao không dùng getUserMedia?
 * - getUserMedia chỉ lấy video feed thô, không có HDR / autofocus / xử lý ảnh phần cứng
 * - <input capture="environment"> mở thẳng app Camera gốc → chất lượng tối đa
 * - Đây là cách chuẩn của tất cả web app cần ảnh chất lượng cao trên mobile
 */
export default function PhotoCapture({ onCapture }) {
    const [preview, setPreview] = useState(null);   // URL preview ảnh đã chụp
    const [isProcessing, setIsProcessing] = useState(false);
    const captureRef = useRef(null);
    const fileRef = useRef(null);

    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsProcessing(true);
            const { base64, mimeType, previewUrl } = await compressImage(file);
            setPreview(previewUrl);
            onCapture(base64, mimeType);
        } catch (err) {
            console.error('[PhotoCapture] Error:', err);
        } finally {
            setIsProcessing(false);
            // Reset input để có thể chọn lại cùng file
            e.target.value = '';
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 py-2">
            {/* Preview ảnh đã chụp */}
            {preview && (
                <div className="w-full rounded-xl overflow-hidden border border-base-300">
                    <img
                        src={preview}
                        alt="Ảnh đã chụp"
                        className="w-full max-h-64 object-contain bg-base-200"
                    />
                </div>
            )}

            {/* Hướng dẫn */}
            {!preview && (
                <div className="flex flex-col items-center gap-3 py-6">
                    <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Camera className="w-10 h-10 text-primary" />
                    </div>
                    <div className="text-center">
                        <p className="font-medium text-base-content">
                            Chụp bảng thành phần dinh dưỡng
                        </p>
                        <p className="text-xs text-base-content/50 mt-1 max-w-xs">
                            Mở camera chụp ảnh rõ nét bảng thành phần trên bao bì sản phẩm.
                            AI sẽ tự động đọc và trích xuất dữ liệu.
                        </p>
                    </div>
                </div>
            )}

            {/* Loading */}
            {isProcessing && (
                <div className="flex items-center gap-2 text-sm text-base-content/60">
                    <span className="loading loading-spinner loading-sm" />
                    Đang xử lý ảnh...
                </div>
            )}

            {/* Nút chính: Mở Camera gốc của điện thoại */}
            <div className="flex flex-col gap-2 w-full">
                <label
                    htmlFor="native-camera-input"
                    className="btn btn-primary gap-2 w-full cursor-pointer"
                >
                    <Camera className="w-5 h-5" />
                    {preview ? 'Chụp lại' : '📷 Mở Camera & Chụp ảnh'}
                </label>
                {/* 
                    capture="environment" → mở Camera SAU (camera chính, nét nhất)
                    accept="image/*" → chỉ nhận ảnh
                    Trình duyệt mobile sẽ mở thẳng app Camera gốc của điện thoại
                */}
                <input
                    ref={captureRef}
                    id="native-camera-input"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFile}
                />

                {/* Nút phụ: Chọn ảnh có sẵn từ thư viện */}
                <label
                    htmlFor="gallery-input"
                    className="btn btn-ghost btn-sm gap-1 w-full cursor-pointer"
                >
                    <ImageIcon className="w-4 h-4" />
                    Chọn ảnh từ thư viện
                </label>
                {/* Không có capture → mở file picker / thư viện ảnh */}
                <input
                    ref={fileRef}
                    id="gallery-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFile}
                />
            </div>

            <p className="text-xs text-base-content/40 text-center">
                💡 Tip: Chụp gần, đủ sáng, giữ tay vững để AI đọc chính xác nhất
            </p>
        </div>
    );
}
