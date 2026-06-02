import React from 'react';
import { Leaf, Code } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <motion.footer 
      className="bg-[#01272E] text-[#96A5A8] pt-16 pb-8"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Cột 1: Logo & Desc */}
          <div className="col-span-1 md:col-span-2 lg:pr-12">
            <div className="flex items-center gap-2 text-2xl font-bold font-heading mb-4 text-white">
              <Leaf className="w-7 h-7 text-[#5FE089]" />
              <span>NutriTrack</span>
            </div>
            <p className="text-[#96A5A8] text-sm leading-relaxed">
              Hệ thống quản lý dinh dưỡng thông minh, cá nhân hóa dựa trên thuật toán tối ưu.
            </p>
          </div>

          {/* Cột 2: Tính năng */}
          <div>
            <h3 className="font-heading font-semibold text-lg text-white mb-4">Tính năng</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-[#5FE089] transition-colors">Dashboard Bento</a></li>
              <li><a href="#" className="hover:text-[#5FE089] transition-colors">Nhật ký ăn uống</a></li>
              <li><a href="#" className="hover:text-[#5FE089] transition-colors">Meal Planner</a></li>
              <li><a href="#" className="hover:text-[#5FE089] transition-colors">Theo dõi cân nặng</a></li>
            </ul>
          </div>

          {/* Cột 3: Tài nguyên */}
          <div>
            <h3 className="font-heading font-semibold text-lg text-white mb-4">Tài nguyên</h3>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-[#5FE089] transition-colors">Báo cáo khoa học</a></li>
              <li><a href="#" className="hover:text-[#5FE089] transition-colors">Thuật toán Gauss</a></li>
              <li><a href="#" className="hover:text-[#5FE089] transition-colors">API Docs</a></li>
            </ul>
          </div>


        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p>© 2026 NutriTrack. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#5FE089] transition-colors">Chính sách bảo mật</a>
            <a href="#" className="hover:text-[#5FE089] transition-colors">Điều khoản dịch vụ</a>
          </div>
        </div>
      </div>
    </motion.footer>
  );
}
