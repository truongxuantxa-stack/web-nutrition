import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden bg-gradient-to-br from-[#5FE089] to-[#2EA850]">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl z-0 translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl z-0 -translate-x-1/3 translate-y-1/3"></div>
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-2xl z-0"></div>
      <div className="absolute bottom-1/4 right-1/3 w-48 h-48 bg-yellow-300/10 rounded-full blur-3xl z-0"></div>

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
          <Link to="/register" className="btn btn-lg rounded-xl bg-white text-[#2EA850] hover:bg-green-50 hover:scale-105 transition-all border-none group px-8">
            Bắt đầu trải nghiệm ngay
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
