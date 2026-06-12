import React from 'react';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PricingSection() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold font-heading mb-4 text-[#003139]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Bắt đầu hành trình của bạn ngay hôm nay
          </motion.h2>
          <p className="text-lg text-[#244348] max-w-2xl mx-auto">
            Không yêu cầu thẻ tín dụng. Không phí ẩn. Nâng cấp bất kỳ lúc nào.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-12 max-w-6xl mx-auto">
          {/* Features Column */}
          <div className="flex-1 space-y-8">
            <motion.div 
              className="flex items-start gap-4"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl shrink-0">💳</div>
              <div>
                <h4 className="text-xl font-bold text-[#003139] mb-2">Không yêu cầu thẻ tín dụng</h4>
                <p className="text-[#244348]">Đăng ký nhanh chóng, không rào cản.</p>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-start gap-4"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shrink-0">🔒</div>
              <div>
                <h4 className="text-xl font-bold text-[#003139] mb-2">Lưu trữ dữ liệu an toàn</h4>
                <p className="text-[#244348]">Dữ liệu sức khỏe của bạn luôn được bảo mật tuyệt đối.</p>
              </div>
            </motion.div>

            <motion.div 
              className="flex items-start gap-4"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-xl shrink-0">⬆️</div>
              <div>
                <h4 className="text-xl font-bold text-[#003139] mb-2">Nâng cấp bất kỳ lúc nào</h4>
                <p className="text-[#244348]">Bắt đầu miễn phí, mở rộng khi cần.</p>
              </div>
            </motion.div>
          </div>

          {/* Pricing Card */}
          <motion.div 
            className="flex-1 w-full max-w-md"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-white rounded-3xl p-8 border border-[#DFE3E4] shadow-[0_20px_50px_rgba(0,49,57,0.08)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#5FE089]/20 blur-3xl rounded-full"></div>
              
              <div className="text-center mb-8 relative z-10">
                <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-medium text-sm mb-4">Gói Cơ Bản</span>
                <div className="flex items-end justify-center gap-1 mb-2">
                  <span className="text-5xl font-bold font-heading text-[#003139]">0đ</span>
                  <span className="text-[#96A5A8] mb-1">/ tháng</span>
                </div>
                <p className="text-[#244348]">Sử dụng vĩnh viễn, không cần thẻ tín dụng.</p>
              </div>

              <ul className="space-y-4 mb-8 relative z-10">
                {['Tính toán BMR, TDEE', 'Gauss Meal Solver (4 món)', 'Adaptive TDEE & Chart', 'Xuất báo cáo PDF không giới hạn'].map((feature, i) => (
                  <li key={i} className="flex items-center gap-3 text-[#244348]">
                    <div className="w-5 h-5 rounded-full bg-[#5FE089]/20 text-[#2EA850] flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link to="/register" className="tcl-btn-secondary w-full justify-center gap-2">
                Bắt đầu miễn phí <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
