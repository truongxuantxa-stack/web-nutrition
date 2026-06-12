import { ImageIcon, FolderOpen } from 'lucide-react';

/**
 * Fallback UI khi user từ chối quyền camera hoặc trình duyệt không hỗ trợ.
 * Hiển thị hướng dẫn bật quyền + nút chọn ảnh từ thư viện.
 *
 * @param {{ onImageSelected: (base64: string, mimeType: string) => void }} props
 */
export default function CameraPermissionFallback({ onImageSelected }) {
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            // Tách phần base64 khỏi data URL
            const dataUrl = ev.target.result;
            const base64 = dataUrl.split(',')[1];
            onImageSelected(base64, file.type || 'image/jpeg');
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="flex flex-col items-center gap-4 py-8 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-error" />
            </div>

            <div>
                <p className="font-semibold text-base-content">Không thể truy cập camera</p>
                <p className="text-sm text-base-content/60 mt-1">
                    Vui lòng bật quyền camera trong Cài đặt trình duyệt,
                    hoặc chọn ảnh từ thư viện để tiếp tục.
                </p>
            </div>

            <div className="bg-base-200 rounded-lg p-3 text-left text-xs text-base-content/70 w-full max-w-xs">
                <p className="font-medium mb-1">Cách bật quyền camera:</p>
                <ol className="list-decimal list-inside space-y-1">
                    <li>Nhấn vào biểu tượng 🔒 hoặc ℹ️ trên thanh địa chỉ</li>
                    <li>Tìm mục "Camera" → chọn "Cho phép"</li>
                    <li>Tải lại trang</li>
                </ol>
            </div>

            <label
                htmlFor="fallback-image-input"
                className="btn btn-primary gap-2 cursor-pointer"
            >
                <FolderOpen className="w-4 h-4" />
                Chọn ảnh từ thư viện
            </label>
            <input
                id="fallback-image-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
            />
        </div>
    );
}
