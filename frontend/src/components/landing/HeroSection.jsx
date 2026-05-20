import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import heroImage from '../../assets/images/hero_food_bowl.png'; // Will use this once generated/copied

export default function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-white dark:bg-base-100">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
          
          {/* Left Content */}
          <motion.div 
            className="flex-1 text-center lg:text-left z-10"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, staggerChildren: 0.1 }}
          >
            <motion.div 
              className="badge badge-emerald badge-outline bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800 px-4 py-3 rounded-full mb-6 font-medium text-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              🎓 Đồ án tốt nghiệp 2026
            </motion.div>
            
            <motion.h1 
              className="text-5xl lg:text-7xl font-bold font-heading leading-tight mb-6 text-base-content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Sức khỏe tốt bắt đầu từ <span className="text-emerald-600 dark:text-emerald-500">chế độ dinh dưỡng</span> đúng đắn.
            </motion.h1>
            
            <motion.p 
              className="text-lg text-base-content/70 mb-8 max-w-2xl mx-auto lg:mx-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              Hệ thống theo dõi và gợi ý thực đơn thông minh bằng thuật toán Gauss, giúp bạn đạt mục tiêu cân nặng một cách khoa học và dễ dàng nhất.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Link to="/welcome" className="btn btn-primary rounded-full px-8 text-white bg-emerald-600 hover:bg-emerald-700 border-none w-full sm:w-auto">
                Bắt đầu miễn phí
              </Link>
              <button className="btn btn-outline rounded-full px-8 border-base-300 hover:bg-base-200 hover:text-base-content w-full sm:w-auto dark:border-base-content/20 dark:hover:bg-base-300">
                Tìm hiểu thêm
              </button>
            </motion.div>
          </motion.div>

          {/* Right Image */}
          <motion.div 
            className="flex-1 relative w-full max-w-lg lg:max-w-none mx-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Main Image */}
            <div className="relative aspect-square rounded-full overflow-hidden border-8 border-white dark:border-base-200 shadow-2xl">
              <img 
                src={heroImage} 
                alt="Healthy food bowl" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000&auto=format&fit=crop';
                }}
              />
            </div>

            {/* Floating Card */}
            <motion.div 
              className="absolute -bottom-6 -left-6 lg:bottom-10 lg:-left-12 bg-base-100 p-4 rounded-2xl shadow-xl flex items-center gap-4 border border-base-200 dark:border-base-content/10"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                🔥
              </div>
              <div>
                <p className="text-sm text-base-content/60 font-medium">Mục tiêu hôm nay</p>
                <p className="text-xl font-bold font-heading">2,100 kcal</p>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
