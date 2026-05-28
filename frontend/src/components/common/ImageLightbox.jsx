import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function ImageLightbox({ src, alt, isOpen, onClose }) {
  // Lắng nghe nút ESC trên bàn phím để đóng ảnh nhanh
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !src) return null;

  const lightboxContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-all duration-300">
      {/* Click overlay to close */}
      <div 
        className="absolute inset-0 cursor-zoom-out" 
        onClick={onClose}
      />
      
      <div className="relative max-w-2xl w-full max-h-[80vh] flex flex-col items-center justify-center z-[100000] transition-all scale-100 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 btn btn-circle btn-ghost btn-sm text-white hover:bg-white/10"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>
        
        {/* Image - Click trực tiếp vào ảnh cũng sẽ thu nhỏ lại */}
        <div 
          onClick={onClose}
          className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-base-300 cursor-zoom-out select-none hover:scale-[1.01] active:scale-95 transition-all duration-200"
        >
          <img
            src={src}
            alt={alt || 'Phóng to ảnh'}
            className="max-w-full max-h-[70vh] object-contain"
          />
        </div>

        {/* Title / Description */}
        {alt && (
          <p className="mt-3 text-white text-sm font-semibold bg-black/50 px-4 py-1.5 rounded-full border border-white/5 shadow-lg select-none">
            {alt}
          </p>
        )}
      </div>
    </div>
  );

  return createPortal(lightboxContent, document.body);
}
