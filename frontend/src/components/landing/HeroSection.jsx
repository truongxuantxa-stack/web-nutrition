import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import dashboardScreenshot from '../../assets/images/screenshot_dashboard.png'; // To be added later

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white">
      {/* Background Gradient Blob */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[800px] h-[800px] bg-[#5FE089]/10 blur-3xl rounded-full -z-10 pointer-events-none"></div>

      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          
          {/* Left Content */}
          <motion.div 
            className="flex-1 text-center lg:text-left z-10"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, staggerChildren: 0.1 }}
          >
            <motion.div 
              className="inline-block bg-[#F0F2F3] border border-[#DFE3E4] text-[#244348] px-4 py-2 rounded-full mb-6 font-medium text-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              ✨ Giải pháp dinh dưỡng cá nhân hóa
            </motion.div>
            
            <motion.h1 
              className="text-5xl lg:text-[56px] lg:leading-[1.1] font-bold font-heading mb-6 text-[#003139]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Lập kế hoạch dinh dưỡng <span className="text-[#5FE089]">thông minh</span> cho mọi người
            </motion.h1>
            
            <motion.p 
              className="text-xl text-[#244348] mb-8 max-w-2xl mx-auto lg:mx-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Hệ thống theo dõi và gợi ý thực đơn bằng thuật toán Gauss, giúp bạn đạt mục tiêu cân nặng một cách khoa học.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Link to="/register" className="btn rounded-xl px-8 text-white bg-[#003139] hover:bg-[#244348] border-none w-full sm:w-auto text-base">
                Bắt đầu ngay
              </Link>
              <button className="btn btn-outline rounded-xl px-8 border-[#003139] text-[#003139] hover:bg-[#003139] hover:text-white w-full sm:w-auto text-base">
                Tìm hiểu thêm
              </button>
            </motion.div>
          </motion.div>

          {/* Right Mockup */}
          <motion.div 
            className="flex-1 relative w-full w-full max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* CSS Browser Mockup */}
            <motion.div 
              className="relative bg-white rounded-xl shadow-[0_20px_50px_rgba(0,49,57,0.1)] border border-[#DFE3E4] overflow-hidden"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              {/* Browser Header */}
              <div className="bg-[#F0F2F3] px-4 py-3 flex items-center gap-2 border-b border-[#DFE3E4]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="mx-auto bg-white text-[10px] text-gray-400 px-24 py-1 rounded-md shadow-sm hidden sm:block">nutritrack.app</div>
              </div>
              
              {/* Browser Content */}
              <div className="aspect-[16/10] bg-gray-50 relative overflow-hidden">
                <img 
                  src={dashboardScreenshot} 
                  alt="NutriTrack Dashboard" 
                  className="w-full h-full object-cover object-top"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1498837167922-41c53bbfedab?q=80&w=1200&auto=format&fit=crop';
                  }}
                />
              </div>
            </motion.div>

            {/* Floating Micro Cards */}
            <motion.div 
              className="absolute -bottom-6 -left-6 lg:-bottom-8 lg:-left-12 bg-white/80 backdrop-blur-md border border-white/40 p-4 rounded-xl shadow-lg flex items-center gap-4 z-20"
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <div className="w-12 h-12 rounded-full bg-[#5FE089]/20 flex items-center justify-center text-[#2EA850] text-xl">
                🔥
              </div>
              <div>
                <p className="text-xs text-[#96A5A8] font-medium">Mục tiêu kcal</p>
                <p className="text-xl font-bold text-[#003139]">2,100</p>
              </div>
            </motion.div>

            <motion.div 
              className="absolute -top-6 -right-6 lg:-top-8 lg:-right-8 bg-white/80 backdrop-blur-md border border-white/40 p-4 rounded-xl shadow-lg flex items-center gap-3 z-20 hidden sm:flex"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-lg">
                🥩
              </div>
              <div>
                <p className="text-xs text-[#96A5A8] font-medium">Protein</p>
                <p className="text-lg font-bold text-[#003139]">140g</p>
              </div>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}
