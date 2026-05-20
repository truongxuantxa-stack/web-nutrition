import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Target, ClipboardList, Rocket } from 'lucide-react';

const steps = [
  {
    icon: <UserPlus className="w-8 h-8" />,
    title: 'Đăng ký',
    description: 'Nhập thông tin cơ bản: chiều cao, cân nặng, độ tuổi và mục tiêu mong muốn của bạn.'
  },
  {
    icon: <Target className="w-8 h-8" />,
    title: 'Nhận chỉ số',
    description: 'Hệ thống tự động tính toán BMR, TDEE và phân bổ Macro chuẩn xác.'
  },
  {
    icon: <ClipboardList className="w-8 h-8" />,
    title: 'Theo dõi',
    description: 'Ghi nhật ký ăn uống hàng ngày nhanh chóng qua ứng dụng hoặc website.'
  },
  {
    icon: <Rocket className="w-8 h-8" />,
    title: 'Tối ưu',
    description: 'Thuật toán Adaptive TDEE sẽ tự điều chỉnh lượng calo phù hợp khi cơ thể bạn thay đổi.'
  }
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.2 } }
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.5 } }
};

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-emerald-50 dark:bg-emerald-900/10 overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12">
        <div className="text-center mb-20">
          <motion.h2 
            className="text-3xl md:text-4xl font-bold font-heading mb-4 text-emerald-950 dark:text-emerald-100"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Bắt đầu chỉ với 4 bước đơn giản
          </motion.h2>
        </div>

        <motion.div 
          className="relative max-w-5xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-12 left-12 right-12 h-0.5 bg-emerald-200 dark:bg-emerald-800 -z-10"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            {steps.map((step, index) => (
              <motion.div key={index} variants={itemVariants} className="relative text-center">
                <div className="w-24 h-24 mx-auto bg-white dark:bg-base-200 rounded-full shadow-lg border-4 border-emerald-100 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-6 relative z-10">
                  {step.icon}
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold border-2 border-white dark:border-base-200 shadow-sm">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-xl font-bold font-heading mb-3 text-emerald-950 dark:text-emerald-100">{step.title}</h3>
                <p className="text-emerald-900/70 dark:text-emerald-100/60 leading-relaxed px-4">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
