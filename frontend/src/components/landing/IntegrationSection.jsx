import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, BookOpen, LineChart, Calendar, Dumbbell, User } from 'lucide-react';

import dashboardScreenshot from '../../assets/images/screenshot_dashboard.png';
import mealPlannerScreenshot from '../../assets/images/screenshot_meal_planner.png';
import weightChartScreenshot from '../../assets/images/screenshot_weight_chart.png';
import exerciseScreenshot from '../../assets/images/screenshot_exercise.png';
import profileScreenshot from '../../assets/images/screenshot_profile.png';
import diaryScreenshot from '../../assets/images/screenshot_diary.png';

const steps = [
  { icon: <LayoutDashboard className="w-6 h-6" />, label: 'Tổng quan', img: dashboardScreenshot, desc: 'Dashboard theo dõi tiến độ tổng thể' },
  { icon: <BookOpen className="w-6 h-6" />, label: 'Nhật ký', img: diaryScreenshot, desc: 'Ghi chép bữa ăn và quét mã vạch AI' },
  { icon: <Calendar className="w-6 h-6" />, label: 'Lập kế hoạch', img: mealPlannerScreenshot, desc: 'Thuật toán Gauss tạo thực đơn tự động' },
  { icon: <LineChart className="w-6 h-6" />, label: 'Cân nặng', img: weightChartScreenshot, desc: 'Theo dõi và dự báo cân nặng với EMA' },
  { icon: <Dumbbell className="w-6 h-6" />, label: 'Luyện tập', img: exerciseScreenshot, desc: 'Ghi nhận hoạt động thể chất & calo' },
  { icon: <User className="w-6 h-6" />, label: 'Hồ sơ', img: profileScreenshot, desc: 'Thiết lập mục tiêu và chỉ số cơ thể' },
];

export default function IntegrationSection() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="py-28 bg-white overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-14">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#003139]/6 text-[#003139] font-semibold mb-4 text-sm"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            🔗 Hệ sinh thái hoàn chỉnh
          </motion.div>
          <motion.h2
            className="text-3xl md:text-4xl font-bold font-heading text-[#003139]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Tích hợp liền mạch — Một hệ sinh thái hoàn chỉnh
          </motion.h2>
          <motion.p
            className="mt-3 text-[#244348] max-w-xl mx-auto"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Mỗi module kết nối chặt chẽ với nhau để tạo ra một vòng lặp hoàn hảo từ dữ liệu đến hành động.
          </motion.p>
        </div>

        {/* Tab Selector */}
        <motion.div
          className="flex flex-wrap items-center justify-center mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 p-1.5 bg-[#F0F2F3] rounded-2xl">
            {steps.map((step, index) => (
              <button
                key={index}
                onClick={() => setActiveTab(index)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  activeTab === index
                    ? 'bg-white text-[#003139] shadow-[0_2px_8px_rgba(0,0,0,0.08)]'
                    : 'text-[#96A5A8] hover:text-[#003139] hover:bg-white/50'
                }`}
              >
                <span className={activeTab === index ? 'text-[#5FE089]' : 'text-inherit'}>
                  {step.icon}
                </span>
                {step.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Screenshot Preview */}
        <motion.div
          className="relative max-w-5xl mx-auto"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >


          {/* Dots Pattern */}
          <div className="absolute -bottom-12 -right-12 w-48 h-48 opacity-[0.08] pointer-events-none -z-10 hidden sm:block" style={{ backgroundImage: 'radial-gradient(#003139 2px, transparent 2px)', backgroundSize: '16px 16px' }} />
          <div className="absolute -top-12 -left-12 w-48 h-48 opacity-[0.08] pointer-events-none -z-10 hidden sm:block" style={{ backgroundImage: 'radial-gradient(#003139 2px, transparent 2px)', backgroundSize: '16px 16px' }} />

          <div className="bg-white rounded-2xl p-2 shadow-[0_25px_50px_-12px_rgba(0,49,57,0.25)] border border-[#DFE3E4]">
            {/* Browser chrome */}
            <div className="bg-[#F0F2F3] rounded-xl px-4 py-3 flex items-center gap-2 border-b border-[#DFE3E4] mb-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="mx-auto bg-white text-[10px] text-gray-400 px-24 py-1 rounded-md shadow-sm hidden sm:block">
                nutritrack.app — {steps[activeTab].label}
              </div>
            </div>

            {/* Animated image swap */}
            <div className="rounded-xl overflow-hidden bg-gray-50 aspect-[16/9] relative">
              <AnimatePresence mode="wait">
                <motion.img
                  loading="lazy"
                  decoding="async"
                  key={activeTab}
                  src={steps[activeTab].img}
                  alt={steps[activeTab].label}
                  className="w-full h-full object-cover object-top"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                />
              </AnimatePresence>
            </div>
          </div>

          {/* Caption */}
          <p className="text-center text-sm text-[#96A5A8] mt-4 font-medium">
            {steps[activeTab].desc}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
