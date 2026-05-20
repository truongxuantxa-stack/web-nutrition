import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 to-emerald-900 -z-10"></div>
      
      {/* Decorative shapes */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl -z-10 -translate-x-1/3 translate-y-1/3"></div>

      <div className="container mx-auto px-6 lg:px-12 text-center text-white">
        <motion.h2 
          className="text-4xl md:text-5xl font-bold font-heading mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Sẵn sàng kiểm soát dinh dưỡng của bạn?
        </motion.h2>
        <motion.p 
          className="text-xl text-emerald-50 max-w-2xl mx-auto mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          Tham gia ngay — hoàn toàn miễn phí. Đạt được vóc dáng mơ ước với sự hỗ trợ của thuật toán thông minh.
        </motion.p>
        
        <motion.div 
          className="flex flex-col sm:flex-row justify-center items-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <button className="btn btn-lg rounded-full bg-white text-emerald-800 hover:bg-emerald-50 hover:scale-105 transition-all border-none group px-8">
            Bắt đầu trải nghiệm ngay
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </button>
          <button className="btn btn-lg rounded-full btn-outline text-white hover:bg-white/10 hover:border-white px-8">
            Xem thêm tính năng
          </button>
        </motion.div>
      </div>
    </section>
  );
}
