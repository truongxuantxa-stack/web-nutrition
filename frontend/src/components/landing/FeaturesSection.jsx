import React from 'react';
import { motion } from 'framer-motion';
import { Calculator, BarChart3, UtensilsCrossed, TrendingUp, BookOpen, FileText } from 'lucide-react';

const features = [
  {
    icon: <Calculator className="w-6 h-6" />,
    title: 'Tính toán BMR & TDEE',
    description: 'Công thức Mifflin-St Jeor chính xác, tính toán nhu cầu năng lượng dựa trên cơ thể bạn.'
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Dashboard trực quan',
    description: 'Biểu đồ lượng calo, phân bổ macro và xu hướng cân nặng dễ hiểu, rõ ràng.'
  },
  {
    icon: <UtensilsCrossed className="w-6 h-6" />,
    title: 'Gợi ý thực đơn Gauss',
    description: 'Thuật toán giải tích số tạo ra tổ hợp bữa ăn hoàn hảo, đảm bảo chính xác lượng dinh dưỡng.'
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: 'Adaptive TDEE',
    description: 'Hệ thống tự động điều chỉnh TDEE dựa trên sự thay đổi thực tế khi cơ thể thích ứng.'
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: 'Nhật ký ăn & tập',
    description: 'Ghi chép chi tiết mọi bữa ăn, ly nước và buổi tập luyện hàng ngày của bạn.'
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: 'Báo cáo PDF',
    description: 'Xuất báo cáo dinh dưỡng chuyên nghiệp theo chu kỳ 7 ngày hoặc 30 ngày.'
  }
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export default function FeaturesSection() {
  return (
    <section id="features" className="py-24 bg-white dark:bg-base-100">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-16">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold font-heading mb-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Những công cụ giúp bạn đạt được mục tiêu
          </motion.h2>
          <p className="text-base-content/70 max-w-2xl mx-auto">
            Hệ thống cung cấp đầy đủ các công cụ tính toán, theo dõi và gợi ý mạnh mẽ nhất để hỗ trợ bạn trên hành trình dinh dưỡng.
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              className="p-8 rounded-3xl bg-base-100 border border-base-200 hover:border-emerald-200 dark:hover:border-emerald-800 shadow-sm hover:shadow-xl transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 group-hover:scale-110 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/40 transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold font-heading mb-3">{feature.title}</h3>
              <p className="text-base-content/70 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
