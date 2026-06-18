import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <section className="py-28 relative overflow-hidden bg-gradient-to-br from-[#5FE089] to-[#2EA850]">



      <div className="container mx-auto px-6 lg:px-12 text-center text-white relative z-10">
        <motion.h2 
          className="text-4xl md:text-5xl font-bold font-heading mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          Hãy bắt đầu kế hoạch ngay hôm nay!
        </motion.h2>
        <motion.p 
          className="text-xl max-w-2xl mx-auto mb-10 text-white/90"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          Tham gia ngay — hoàn toàn miễn phí.
        </motion.p>
        
        <motion.div 
          className="flex justify-center items-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <Link
            to="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#2EA850] font-bold text-base rounded-xl hover:bg-green-50 hover:scale-105 transition-all duration-200 shadow-lg group"
          >
            Bắt đầu trải nghiệm ngay
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
