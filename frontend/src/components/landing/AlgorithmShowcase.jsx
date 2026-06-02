import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Calculator, Database, CheckCircle2 } from 'lucide-react';

export default function AlgorithmShowcase() {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  return (
    <section className="py-24 bg-[#003139] text-white relative overflow-hidden">
      {/* Background blobs for glassmorphism effect */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-[#5FE089]/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-[#5FE089]/10 rounded-full blur-3xl"></div>
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="text-center mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold font-heading mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Thuật toán Gauss Solver — Trái tim của hệ thống
          </motion.h2>
          <p className="text-white/70 max-w-2xl mx-auto">
            Hệ thống sử dụng toán học giải tích để tính toán chính xác khẩu phần ăn, đảm bảo dinh dưỡng cân bằng và tối ưu nhất cho cơ thể bạn.
          </p>
        </div>

        {/* React-based Algorithm Visualization */}
        <motion.div 
          className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8 mb-20"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {/* Input Card */}
          <motion.div variants={itemVariants} className="landing-glass p-6 w-full lg:w-64">
            <h3 className="font-bold text-xl mb-4 text-[#5FE089] text-center border-b border-white/10 pb-2">INPUT</h3>
            <ul className="space-y-3 text-base text-white/90">
              <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white/50"></div> Cân nặng, Chiều cao</li>
              <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white/50"></div> Mục tiêu cá nhân</li>
              <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white/50"></div> TDEE & Macro target</li>
            </ul>
          </motion.div>

          {/* Arrow */}
          <motion.div variants={itemVariants} className="hidden lg:block text-[#5FE089]/50 animate-pulse">
            <ArrowRight className="w-10 h-10" />
          </motion.div>

          {/* Process Card */}
          <motion.div variants={itemVariants} className="landing-glass p-6 w-full lg:w-72 border-[#5FE089]/30 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#5FE089]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <h3 className="font-bold text-xl mb-4 text-[#5FE089] text-center border-b border-[#5FE089]/20 pb-2">XỬ LÝ</h3>
            <div className="space-y-4 text-center">
              <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                <p className="font-semibold text-base">Gauss Solver</p>
                <p className="text-sm text-white/60">(Hệ phương trình 3x3)</p>
              </div>
              <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                <p className="font-semibold text-base">Adaptive TDEE</p>
                <p className="text-sm text-white/60">(Lọc nhiễu EMA)</p>
              </div>
            </div>
          </motion.div>

          {/* Arrow */}
          <motion.div variants={itemVariants} className="hidden lg:block text-[#5FE089]/50 animate-pulse">
            <ArrowRight className="w-10 h-10" />
          </motion.div>

          {/* Output Card */}
          <motion.div variants={itemVariants} className="landing-glass p-6 w-full lg:w-64">
            <h3 className="font-bold text-xl mb-4 text-[#5FE089] text-center border-b border-white/10 pb-2">OUTPUT</h3>
            <ul className="space-y-3 text-base text-white/90">
              <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#5FE089]"></div> Thực đơn 4 món</li>
              <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#5FE089]"></div> Chính xác tới Gram</li>
              <li className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[#5FE089]"></div> Macro cân bằng 100%</li>
            </ul>
          </motion.div>
        </motion.div>

        {/* 3 Stat Mini-cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <motion.div 
            className="landing-glass p-6 flex items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-[#5FE089]">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-bold">500+</p>
              <p className="text-sm text-white/70">Nguyên liệu thực tế</p>
            </div>
          </motion.div>

          <motion.div 
            className="landing-glass p-6 flex items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-[#5FE089]">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-bold">4</p>
              <p className="text-sm text-white/70">Thuật toán phân tích</p>
            </div>
          </motion.div>

          <motion.div 
            className="landing-glass p-6 flex items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
          >
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-[#5FE089]">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-3xl font-bold">99.9%</p>
              <p className="text-sm text-white/70">Độ chính xác Macro</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
