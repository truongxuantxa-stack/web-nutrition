import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Nguyễn Văn A',
    role: 'Sinh viên IT',
    content: 'Từ khi dùng NutriTrack, tôi đã giảm được 5kg trong 2 tháng một cách khoa học. Thuật toán gợi ý thực đơn thật sự rất thông minh!',
    rating: 5,
    avatar: 'https://i.pravatar.cc/150?u=1'
  },
  {
    name: 'Trần Thị B',
    role: 'Nhân viên văn phòng',
    content: 'Tính năng Adaptive TDEE giúp tôi không bị chững cân. Giao diện lại cực kỳ trực quan và dễ sử dụng hàng ngày.',
    rating: 5,
    avatar: 'https://i.pravatar.cc/150?u=2'
  },
  {
    name: 'Lê Hoàng C',
    role: 'Gymer',
    content: 'Tôi thích cách hệ thống cho phép tùy chỉnh macro chi tiết. Báo cáo PDF xuất ra hàng tuần giúp tôi review tiến độ rất dễ dàng.',
    rating: 5,
    avatar: 'https://i.pravatar.cc/150?u=3'
  }
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-amber-50 dark:bg-amber-900/10">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold font-heading mb-4 text-amber-950 dark:text-amber-100"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Những câu chuyện thành công
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div 
              key={i}
              className="bg-white dark:bg-base-100 p-8 rounded-3xl shadow-sm border-l-4 border-emerald-500"
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="flex gap-1 text-amber-400 mb-6">
                {[...Array(t.rating)].map((_, idx) => (
                  <Star key={idx} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <p className="text-base-content/80 mb-8 italic leading-relaxed">
                "{t.content}"
              </p>
              <div className="flex items-center gap-4">
                <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <h4 className="font-bold font-heading text-base-content">{t.name}</h4>
                  <span className="text-sm text-base-content/60">{t.role}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
