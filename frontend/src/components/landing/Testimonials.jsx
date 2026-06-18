import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

const personas = [
  {
    name: 'Nguyễn Văn A',
    role: 'Sinh viên năm 4, ĐH Bách Khoa',
    content: 'Tiết kiệm 2 tiếng mỗi ngày nhờ thực đơn tự động. Không cần vắt óc suy nghĩ "hôm nay ăn gì" mà vẫn đảm bảo đủ protein để tập gym!',
    rating: 5,
    avatar: 'https://i.pravatar.cc/150?img=11'
  },
  {
    name: 'Trần Thị B',
    role: 'Gymer 3 năm kinh nghiệm',
    content: 'Thuật toán Adaptive TDEE thực sự là cứu cánh. Nó giúp tôi phá vỡ plateau (chững cân) sau 3 tháng dậm chân tại chỗ bằng cách tự động điều chỉnh calo.',
    rating: 5,
    avatar: 'https://i.pravatar.cc/150?img=5'
  },
  {
    name: 'Lê Hoàng C',
    role: 'Bác sĩ Dinh dưỡng',
    content: 'Báo cáo PDF chuẩn y khoa của NutriTrack rất tiện cho việc theo dõi bệnh nhân tiểu đường. Các cảnh báo về lượng muối và đường cực kỳ chính xác.',
    rating: 5,
    avatar: 'https://i.pravatar.cc/150?img=8'
  },
  {
    name: 'Phạm Thu Trang',
    role: 'Nhân viên văn phòng',
    content: 'Tính năng quét mã vạch và AI Vision đã thay đổi thói quen ăn vặt của tôi. Cầm gói bánh lên quét là biết ngay lượng calo rỗng, lập tức bỏ xuống luôn!',
    rating: 5,
    avatar: 'https://i.pravatar.cc/150?img=9'
  },
  {
    name: 'Hoàng Minh Tuấn',
    role: 'Người theo chế độ Eat Clean',
    content: 'Bác sĩ dinh dưỡng ảo cảnh báo lượng muối siêu chuẩn. Nhờ hệ thống chấm điểm 0-100, tôi mới biết món mình hay ăn ngoài hàng thực chất toàn dầu mỡ ẩn.',
    rating: 5,
    avatar: 'https://i.pravatar.cc/150?img=12'
  },
  {
    name: 'Ngô Hải Đăng',
    role: 'Huấn luyện viên (PT)',
    content: 'Tôi bắt buộc mọi học viên dùng biểu đồ xu hướng của NutriTrack. Nó lọc đi dao động nước hàng ngày, giúp họ không bị hoảng loạn khi cân nặng lên xuống thất thường.',
    rating: 5,
    avatar: 'https://i.pravatar.cc/150?img=14'
  }
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-28 bg-[#F0F2F3] overflow-hidden">
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
          {personas.map((t, idx) => (
            <div 
              key={idx}
              className="bg-white rounded-2xl p-8 border border-[#DFE3E4] shadow-[0_2px_5px_rgba(21,23,29,0.08)] flex flex-col h-full hover:shadow-[0_4px_12px_rgba(21,23,29,0.12)] transition-shadow duration-300"
            >
              <div className="flex gap-1 text-amber-400 mb-6">
                {[...Array(t.rating)].map((_, idx) => (
                  <Star key={idx} className="w-5 h-5 fill-current" />
                ))}
              </div>
              <p className="text-[#244348] mb-8 italic leading-relaxed text-xl flex-1">
                "{t.content}"
              </p>
              <div className="flex items-center gap-4 mt-auto">
                <img loading="lazy" decoding="async" src={t.avatar} alt={t.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-[#DFE3E4]" />
                <div>
                  <h4 className="font-bold text-[#003139]">{t.name}</h4>
                  <span className="text-sm text-[#96A5A8] font-medium">{t.role}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
