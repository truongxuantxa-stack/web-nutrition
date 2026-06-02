import React from 'react';
import { motion } from 'framer-motion';

import profileScreenshot from '../../assets/images/screenshot_profile.png';
import mealPlannerScreenshot from '../../assets/images/screenshot_meal_planner.png';
import pdfReportScreenshot from '../../assets/images/screenshot_pdf_report.png';

export default function FeaturesSection() {
  return (
    <section id="features" className="py-32 bg-white overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12">
        
        {/* Block 1: Cá nhân hóa (Text Left, Image Right) */}
        <div className="flex flex-col lg:flex-row items-center gap-16 mb-40">
          <motion.div 
            className="flex-1 lg:pr-10"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#5FE089]/10 text-[#2EA850] font-semibold mb-6 text-sm">
              🧬 Cá nhân hóa
            </div>
            <h3 className="text-3xl lg:text-4xl font-bold font-heading mb-6 leading-tight text-[#003139]">
              Cá nhân hóa lộ trình dinh dưỡng đến từng chi tiết nhỏ nhất.
            </h3>
            <p className="text-lg text-[#244348] leading-relaxed mb-8">
              BMR và TDEE được tính toán chuẩn xác dựa trên cơ thể bạn. Phân bổ Macro theo đúng mục tiêu tăng cơ, giảm mỡ hay duy trì cân nặng một cách khoa học nhất.
            </p>
          </motion.div>

          <motion.div 
            className="flex-1 relative flex justify-center lg:justify-end"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            {/* Phone Mockup CSS */}
            <div className="relative mx-auto border-gray-800 bg-gray-800 border-[10px] rounded-[2.5rem] h-[550px] w-[270px] shadow-2xl">
              <div className="w-[120px] h-[16px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute z-20"></div>
              <div className="rounded-[1.8rem] overflow-hidden w-full h-full bg-white relative z-10">
                <img 
                  src={profileScreenshot} 
                  alt="Profile Setup" 
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=600&auto=format&fit=crop'; }}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Block 2: Hiệu quả (Image Left, Text Right) */}
        <div className="flex flex-col-reverse lg:flex-row items-center gap-16 mb-40">
          <motion.div 
            className="flex-1 relative w-full"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            {/* Browser Mockup */}
            <div className="relative bg-white rounded-xl shadow-2xl border border-[#DFE3E4] overflow-hidden">
              <div className="bg-[#F0F2F3] px-4 py-3 flex items-center gap-2 border-b border-[#DFE3E4]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
              </div>
              <div className="aspect-[16/10] bg-gray-50 relative overflow-hidden">
                <img 
                  src={mealPlannerScreenshot} 
                  alt="Meal Planner" 
                  className="w-full h-full object-cover object-top"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1498837167922-41c53bbfedab?q=80&w=1200&auto=format&fit=crop'; }}
                />
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="flex-1 lg:pl-10"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 font-semibold mb-6 text-sm">
              ⚡ Hiệu quả
            </div>
            <h3 className="text-3xl lg:text-4xl font-bold font-heading mb-6 leading-tight text-[#003139]">
              Lập kế hoạch bữa ăn nhanh chóng với thuật toán thông minh.
            </h3>
            <p className="text-lg text-[#244348] leading-relaxed mb-8">
              Thuật toán Gauss độc quyền tự động tính toán khối lượng thực phẩm. Bạn có thể dễ dàng ghim nguyên liệu yêu thích hoặc đổi món một cách linh hoạt.
            </p>
          </motion.div>
        </div>

        {/* Block 3: Phân tích (Text Left, Image Right) */}
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <motion.div 
            className="flex-1 lg:pr-10"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 font-semibold mb-6 text-sm">
              📊 Phân tích
            </div>
            <h3 className="text-3xl lg:text-4xl font-bold font-heading mb-6 leading-tight text-[#003139]">
              Phân tích chuyên sâu, báo cáo chuẩn y khoa.
            </h3>
            <p className="text-lg text-[#244348] leading-relaxed mb-8">
              Công nghệ Adaptive TDEE theo dõi sự thay đổi của cơ thể để tự động điều chỉnh. Xuất báo cáo PDF chi tiết giúp bạn và chuyên gia y tế dễ dàng theo dõi hành trình sức khỏe.
            </p>
          </motion.div>

          <motion.div 
            className="flex-1 relative w-full"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            {/* Browser Mockup for PDF/Chart */}
            <div className="relative bg-white rounded-xl shadow-2xl border border-[#DFE3E4] overflow-hidden">
              <div className="bg-[#F0F2F3] px-4 py-3 flex items-center gap-2 border-b border-[#DFE3E4]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
              </div>
              <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden">
                <img 
                  src={pdfReportScreenshot} 
                  alt="PDF Report" 
                  className="w-full h-full object-cover object-top"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1200&auto=format&fit=crop'; }}
                />
              </div>
            </div>
          </motion.div>
        </div>

      </div>
    </section>
  );
}
