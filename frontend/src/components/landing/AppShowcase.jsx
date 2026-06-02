import React from 'react';
import { motion } from 'framer-motion';

import dashboardScreenshot from '../../assets/images/screenshot_dashboard.png';
import mealPlannerScreenshot from '../../assets/images/screenshot_meal_planner.png';
import pdfReportScreenshot from '../../assets/images/screenshot_pdf_report.png';

export default function AppShowcase() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-20">
          <motion.h2 
            className="text-4xl md:text-5xl font-bold font-heading text-[#003139]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Trải nghiệm hoàn toàn khác biệt
          </motion.h2>
        </div>

        <div className="relative max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center h-auto md:h-[520px]" style={{ perspective: '1000px' }}>
          
          {/* Screenshot 1: Meal Planner (Left) */}
          <motion.div 
            className="w-full md:absolute md:left-0 md:w-[55%] z-10 hidden md:block"
            initial={{ opacity: 0, x: -50, rotateY: 10 }}
            whileInView={{ opacity: 1, x: 0, rotateY: 5 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="bg-white rounded-xl overflow-hidden border border-[#DFE3E4]" style={{ boxShadow: '0 4px 6px rgba(0,49,57,0.07), 0 12px 28px rgba(0,49,57,0.12), 0 20px 60px rgba(0,49,57,0.06)' }}>
              <div className="bg-[#F0F2F3] px-3 py-2 flex items-center gap-1.5 border-b border-[#DFE3E4]">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
              </div>
              <img 
                src={mealPlannerScreenshot} 
                alt="Meal Planner" 
                className="w-full aspect-[16/10] object-cover object-top"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1498837167922-41c53bbfedab?q=80&w=800&auto=format&fit=crop'; }}
              />
            </div>
          </motion.div>

          {/* Screenshot 3: PDF Report (Right) */}
          <motion.div 
            className="w-full md:absolute md:right-0 md:w-[55%] z-10 hidden md:block"
            initial={{ opacity: 0, x: 50, rotateY: -10 }}
            whileInView={{ opacity: 1, x: 0, rotateY: -5 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <div className="bg-white rounded-xl overflow-hidden border border-[#DFE3E4]" style={{ boxShadow: '0 4px 6px rgba(0,49,57,0.07), 0 12px 28px rgba(0,49,57,0.12), 0 20px 60px rgba(0,49,57,0.06)' }}>
              <div className="bg-[#F0F2F3] px-3 py-2 flex items-center gap-1.5 border-b border-[#DFE3E4]">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
              </div>
              <img 
                src={pdfReportScreenshot} 
                alt="PDF Report Preview" 
                className="w-full aspect-[16/10] object-cover object-top"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop'; }}
              />
            </div>
          </motion.div>

          {/* Screenshot 2: Dashboard (Center) */}
          <motion.div 
            className="w-full md:absolute md:left-1/2 md:-translate-x-1/2 md:w-3/4 z-20 mt-12 md:mt-0"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="bg-white rounded-xl overflow-hidden border border-[#DFE3E4]" style={{ boxShadow: 'rgba(21,23,29,0.25) 0px 10px 30px' }}>
              <div className="bg-[#F0F2F3] px-4 py-3 flex items-center gap-2 border-b border-[#DFE3E4]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
              </div>
              <img 
                src={dashboardScreenshot} 
                alt="Dashboard" 
                className="w-full aspect-[16/10] object-cover object-top"
                onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop'; }}
              />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
