import React from 'react';
import { motion } from 'framer-motion';
import dashboardImage from '../../assets/images/dashboard_mockup.png';

export default function AppShowcase() {
  return (
    <section className="py-20 bg-base-200 overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold font-heading mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Khám phá tác động của chế độ ăn uống đến sức khỏe
          </motion.h2>
          <motion.p 
            className="text-base-content/70 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            Giao diện trực quan, dễ sử dụng, giúp bạn kiểm soát hoàn toàn lượng calo và macro nạp vào cơ thể mỗi ngày.
          </motion.p>
        </div>

        <motion.div 
          className="relative max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {/* Phone Frame */}
          <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[600px] w-[300px] shadow-xl">
            <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[124px] rounded-l-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[17px] top-[178px] rounded-l-lg"></div>
            <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[17px] top-[142px] rounded-r-lg"></div>
            
            {/* Screen */}
            <div className="rounded-[2rem] overflow-hidden w-full h-full bg-white dark:bg-base-100">
              <img 
                src={dashboardImage} 
                alt="App Dashboard" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=600&auto=format&fit=crop';
                }}
              />
            </div>
          </div>
          
          {/* Decorative background circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl aspect-square bg-emerald-500/10 dark:bg-emerald-500/5 rounded-full blur-3xl -z-10"></div>
        </motion.div>
      </div>
    </section>
  );
}
