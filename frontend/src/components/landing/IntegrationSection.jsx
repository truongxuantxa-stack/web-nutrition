import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, BookOpen, LineChart, FileText, ArrowRight } from 'lucide-react';
import dashboardScreenshot from '../../assets/images/screenshot_dashboard.png';

export default function IntegrationSection() {
  const steps = [
    { icon: <LayoutDashboard className="w-7 h-7" />, label: "Dashboard" },
    { icon: <BookOpen className="w-7 h-7" />, label: "Nhật ký" },
    { icon: <LineChart className="w-7 h-7" />, label: "Cân nặng" },
    { icon: <FileText className="w-7 h-7" />, label: "Báo cáo" }
  ];

  return (
    <section className="py-24 bg-[#F0F2F3] overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12 text-center">
        <motion.h2 
          className="text-3xl md:text-4xl font-bold font-heading mb-16 text-[#003139]"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Tích hợp liền mạch — Một hệ sinh thái hoàn chỉnh
        </motion.h2>

        {/* Flow Diagram */}
        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 mb-16 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <React.Fragment key={index}>
              <motion.div 
                className="bg-white px-8 py-6 rounded-2xl shadow-sm border border-[#DFE3E4] flex flex-col items-center gap-2 min-w-[150px]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="text-[#003139] mb-1">{step.icon}</div>
                <span className="font-medium text-[#244348] text-sm">{step.label}</span>
              </motion.div>
              {index < steps.length - 1 && (
                <motion.div 
                  className="text-[#003139]/40 hidden md:block"
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 + 0.1 }}
                >
                  <ArrowRight className="w-7 h-7" />
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Image Showcase */}
        <motion.div 
          className="relative max-w-5xl mx-auto bg-white rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,49,57,0.05)] border border-[#DFE3E4]"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="rounded-xl overflow-hidden bg-gray-50 aspect-[16/9]">
            <img 
              src={dashboardScreenshot} 
              alt="Hệ sinh thái NutriTrack" 
              className="w-full h-full object-cover object-top"
              onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1498837167922-41c53bbfedab?q=80&w=1200&auto=format&fit=crop'; }}
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
