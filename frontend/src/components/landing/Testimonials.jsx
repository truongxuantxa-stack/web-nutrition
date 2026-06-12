import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const personas = [
  {
    name: 'Nguyễn Văn A',
    role: 'Sinh viên năm 4, ĐH Bách Khoa',
    content: 'Tiết kiệm 2 tiếng mỗi ngày nhờ thực đơn tự động. Không cần suy nghĩ hôm nay ăn gì nữa!',
    rating: 5,
    avatar: 'https://i.pravatar.cc/150?u=1'
  },
  {
    name: 'Trần Thị B',
    role: 'Gymer 3 năm kinh nghiệm',
    content: 'Thuật toán Adaptive TDEE giúp tôi phá vỡ plateau cân nặng sau 3 tháng chững.',
    rating: 5,
    avatar: 'https://i.pravatar.cc/150?u=2'
  },
  {
    name: 'Lê Hoàng C',
    role: 'Bác sĩ Dinh dưỡng',
    content: 'Báo cáo PDF chuẩn y khoa rất tiện cho việc theo dõi bệnh nhân tiểu đường.',
    rating: 5,
    avatar: 'https://i.pravatar.cc/150?u=3'
  }
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold font-heading mb-4 text-[#003139]"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Được tin dùng bởi mọi đối tượng
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {personas.map((t, i) => (
            <motion.div 
              key={i}
              className="bg-white p-8 rounded-2xl shadow-[0_10px_30px_rgba(0,49,57,0.05)] border-l-4 border-[#003139] hover:-translate-y-2 transition-transform duration-300"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
            >
              <div className="flex gap-1 text-amber-400 mb-6">
                {[...Array(t.rating)].map((_, idx) => (
                  <Star key={idx} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <p className="text-[#244348] mb-8 italic leading-relaxed text-lg">
                "{t.content}"
              </p>
              <div className="flex items-center gap-4">
                <img src={t.avatar} alt={t.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-[#DFE3E4]" />
                <div>
                  <h4 className="font-bold text-[#003139]">{t.name}</h4>
                  <span className="text-sm text-[#96A5A8] font-medium">{t.role}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
