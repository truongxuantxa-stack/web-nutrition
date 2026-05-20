import React from 'react';
import { Leaf, Code } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <motion.footer 
      className="bg-neutral text-neutral-content pt-16 pb-8"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Logo & Desc */}
          <div>
            <div className="flex items-center gap-2 text-2xl font-bold font-heading mb-4 text-white">
              <Leaf className="w-7 h-7 text-emerald-500" />
              <span>NutriTrack</span>
            </div>
            <p className="text-neutral-400 max-w-sm">
              Hệ thống quản lý dinh dưỡng thông minh, cá nhân hóa dựa trên thuật toán tối ưu. Đồ án tốt nghiệp 2026.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading font-semibold text-lg text-white mb-4">Liên kết nhanh</h3>
            <ul className="space-y-2 text-neutral-400">
              <li><a href="#features" className="hover:text-emerald-400 transition-colors">Tính năng</a></li>
              <li><a href="#how-it-works" className="hover:text-emerald-400 transition-colors">Cách hoạt động</a></li>
              <li><a href="#testimonials" className="hover:text-emerald-400 transition-colors">Đánh giá</a></li>
              <li><a href="#" className="hover:text-emerald-400 transition-colors">Báo cáo khoa học</a></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-heading font-semibold text-lg text-white mb-4">Dự án mã nguồn mở</h3>
            <p className="text-neutral-400 mb-4">
              Xem mã nguồn trên GitHub và đóng góp cho dự án.
            </p>
            <a href="https://github.com/truongxuantxa-stack/web-nutrition" target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm text-neutral-content hover:text-white hover:bg-neutral-focus">
              <Code className="w-4 h-4 mr-2" />
              GitHub
            </a>
          </div>
        </div>

        <div className="border-t border-neutral-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-neutral-400 text-sm">
          <p>© 2026 NutriTrack. Graduation Project.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a>
            <a href="#" className="hover:text-white transition-colors">Điều khoản dịch vụ</a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
