import { useNavigate } from 'react-router-dom';
import { SearchX, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="bg-red-50 text-red-500 p-6 rounded-full mb-6 animate-bounce">
        <SearchX className="w-16 h-16" />
      </div>

      <h1 className="text-4xl font-black text-[#003139] mb-2 tracking-tight">404</h1>

      <h2 className="text-xl font-bold text-[#244348] mb-4">Không tìm thấy trang yêu cầu</h2>

      <p className="text-[#96A5A8] text-sm max-w-md mb-8 leading-relaxed">
        Đường dẫn bạn truy cập có thể đã bị thay đổi, xóa bỏ hoặc không tồn tại.
        Hãy sử dụng thanh điều hướng hoặc quay lại trang Tổng quan.
      </p>

      <button
        onClick={() => navigate('/dashboard')}
        className="tcl-btn-primary gap-2 py-2.5 px-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Quay về Tổng quan
      </button>
    </div>
  );
}
