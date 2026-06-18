import React from 'react';
import { motion } from 'framer-motion';

import dashboardScreenshot from '../../assets/images/screenshot_dashboard.png';
import mealPlannerScreenshot from '../../assets/images/screenshot_meal_planner.png';

export default function AppShowcase() {
  return (
    <section className="py-24 bg-[#F0F2F3] relative overflow-hidden">


      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#DFE3E4] text-[#244348] font-medium text-sm mb-5 shadow-sm"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            🖥️ Giao diện thực tế
          </motion.div>
          <motion.h2
            className="text-4xl md:text-5xl font-bold font-heading text-[#003139]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Trải nghiệm hoàn toàn khác biệt
          </motion.h2>
          <motion.p
            className="mt-4 text-lg text-[#244348] max-w-xl mx-auto"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            Giao diện tối giản, dữ liệu trực quan — thiết kế cho người thực sự quan tâm đến sức khỏe.
          </motion.p>
        </div>

        {/* 3D Stacked Screenshots */}
        <div
          className="relative max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center h-auto md:h-[540px]"
          style={{ perspective: '1200px' }}
        >
          {/* Left: Meal Planner */}
          <motion.div
            className="w-full md:absolute md:left-0 md:w-[52%] z-10 hidden md:block"
            initial={{ opacity: 0, x: -60, rotateY: 15 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 6 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="bg-white rounded-xl overflow-hidden border border-[#DFE3E4]"
              style={{ boxShadow: '0 4px 6px rgba(0,49,57,0.07), 0 12px 28px rgba(0,49,57,0.12), 0 20px 60px rgba(0,49,57,0.06)' }}>
              {/* Browser bar */}
              <div className="bg-[#F8F9FA] px-3 py-2 flex items-center gap-1.5 border-b border-[#DFE3E4]">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                <div className="ml-2 flex-1 bg-white text-[9px] text-gray-400 px-3 py-0.5 rounded text-center truncate">
                  Lập kế hoạch bữa ăn
                </div>
              </div>
              <img
                loading="lazy"
                decoding="async"
                src={mealPlannerScreenshot}
                alt="Meal Planner — Gauss Solver"
                className="w-full aspect-[16/10] object-cover object-top"
              />
            </div>
            <p className="text-center text-sm text-[#96A5A8] mt-3 font-medium">Lập kế hoạch bữa ăn</p>
          </motion.div>

          {/* Right: Weight Trend Chart */}
          <motion.div
            className="w-full md:absolute md:right-0 md:w-[52%] z-10 hidden md:block"
            initial={{ opacity: 0, x: 60, rotateY: -15 }}
            whileInView={{ opacity: 1, x: 0, rotateY: -6 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="bg-white rounded-xl overflow-hidden border border-[#DFE3E4]"
            style={{ boxShadow: '0 4px 6px rgba(0,49,57,0.07), 0 12px 28px rgba(0,49,57,0.12), 0 20px 60px rgba(0,49,57,0.06)' }}>
              <div className="bg-[#F8F9FA] px-3 py-2 flex items-center gap-1.5 border-b border-[#DFE3E4]">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                <div className="ml-2 flex-1 bg-white text-[9px] text-gray-400 px-3 py-0.5 rounded text-center truncate">
                  Lập kế hoạch bữa ăn
                </div>
              </div>
              <img
                loading="lazy"
                decoding="async"
                src={mealPlannerScreenshot}
                alt="Lập kế hoạch bữa ăn — Gauss Solver"
                className="w-full aspect-[16/10] object-cover object-top"
              />
            </div>
            <p className="text-center text-sm text-[#96A5A8] mt-3 font-medium">Lập kế hoạch bữa ăn</p>
          </motion.div>

          {/* Center: Dashboard (main, elevated) */}
          <motion.div
            className="w-full md:absolute md:left-1/2 md:-translate-x-1/2 md:w-[68%] z-20 mt-12 md:mt-0"
            initial={{ opacity: 0, y: 60 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.2 }}
          >
            <div className="bg-white rounded-xl overflow-hidden border border-[#DFE3E4]"
              style={{ boxShadow: 'rgba(21,23,29,0.2) 0px 10px 40px, rgba(21,23,29,0.08) 0px 2px 10px' }}>
              {/* Browser header with URL */}
              <div className="bg-[#F8F9FA] px-4 py-3 flex items-center gap-2 border-b border-[#DFE3E4]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="mx-auto bg-white text-[10px] text-gray-400 px-20 py-1 rounded-md shadow-sm hidden sm:block">
                  nutritrack.app/dashboard
                </div>
              </div>
              <img
                loading="lazy"
                decoding="async"
                src={dashboardScreenshot}
                alt="NutriTrack Dashboard — Tổng quan dinh dưỡng"
                className="w-full aspect-[16/10] object-cover object-top"
              />
            </div>
            <p className="text-center text-sm text-[#96A5A8] mt-3 font-medium">Dashboard tổng quan</p>
          </motion.div>
        </div>

        {/* Mobile: show only dashboard */}
        <div className="block md:hidden mt-8">
          <div className="bg-white rounded-xl overflow-hidden border border-[#DFE3E4] shadow-xl">
            <div className="bg-[#F8F9FA] px-3 py-2 flex items-center gap-1.5 border-b border-[#DFE3E4]">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
            </div>
            <img loading="lazy" decoding="async" src={dashboardScreenshot} alt="Dashboard" className="w-full aspect-[4/3] object-cover object-top" />
          </div>
        </div>
      </div>
    </section>
  );
}
