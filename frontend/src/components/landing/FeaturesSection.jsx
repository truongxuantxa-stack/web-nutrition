import React from 'react';
import { motion } from 'framer-motion';

import profileScreenshot from '../../assets/images/screenshot_profile.png';
import mealPlannerScreenshot from '../../assets/images/screenshot_meal_planner.png';
import aiScannerScreenshot from '../../assets/images/screenshot_ai_scanner.png';
import adaptiveTdeeScreenshot from '../../assets/images/screenshot_adaptive_tdee.png';
import weightChartScreenshot from '../../assets/images/screenshot_weight_chart.png';
import nutrientScoringScreenshot from '../../assets/images/screenshot_food_scoring.png';
import smartInsightsScreenshot from '../../assets/images/screenshot_smart_insights.png';
import pdfReportScreenshot from '../../assets/images/screenshot_pdf_report.png';

// Reusable browser mockup wrapper
function BrowserMockup({ children, aspectClass = 'aspect-[16/10]', shadowColor }) {
  return (
    <div 
      className="relative bg-white rounded-xl border border-white/10 overflow-hidden transition-shadow duration-500"
      style={{ boxShadow: shadowColor ? `0 25px 50px -12px ${shadowColor}` : '0 25px 50px -12px rgba(255,255,255,0.1)' }}
    >
      <div className="bg-white/5 px-4 py-3 flex items-center gap-2 border-b border-white/10">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <div className="w-3 h-3 rounded-full bg-amber-400"></div>
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
        <div className="mx-auto bg-white/10 text-[10px] text-white/40 px-16 py-1 rounded-md shadow-sm hidden sm:block">
          nutritrack.app
        </div>
      </div>
      <div className={`${aspectClass} bg-gray-50 relative overflow-hidden`}>
        {children}
      </div>
    </div>
  );
}

// Reusable phone mockup wrapper
function PhoneMockup({ children }) {
  return (
    <div className="relative mx-auto border-gray-800 bg-gray-800 border-[10px] rounded-[2.5rem] h-[480px] w-[240px] shadow-2xl">
      <div className="w-[100px] h-[14px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute z-20"></div>
      <div className="rounded-[1.8rem] overflow-hidden w-full h-full bg-white relative z-10">
        {children}
      </div>
    </div>
  );
}

const featureBlocks = [
  {
    tag: { emoji: '🧬', label: 'Cá nhân hóa', color: 'bg-white/10 text-[#5FE089]' },
    title: 'Cá nhân hóa lộ trình dinh dưỡng đến từng chi tiết nhỏ nhất.',
    desc: 'Chỉ số BMR, TDEE và Macro được tính dựa trên cơ thể bạn — tăng cơ, giảm mỡ hay duy trì, đều có lộ trình riêng.',
    side: 'right',
    mockupType: 'browser',
    img: profileScreenshot,
    imgAlt: 'Hồ sơ cá nhân & thiết lập mục tiêu',
    aspectClass: 'aspect-[16/10]',
    glowColor: 'bg-[#5FE089]',
    shadowColor: 'rgba(95, 224, 137, 0.4)',
  },
  {
    tag: { emoji: '⚡', label: 'Hiệu quả', color: 'bg-white/10 text-blue-400' },
    title: 'Lập kế hoạch bữa ăn nhanh chóng với thuật toán Gauss thông minh.',
    desc: 'Thuật toán tự động tính chính xác gram cho từng nguyên liệu. Ghim món yêu thích hoặc đổi món linh hoạt theo sở thích.',
    side: 'left',
    mockupType: 'browser',
    img: mealPlannerScreenshot,
    imgAlt: 'Lập kế hoạch bữa ăn',
    aspectClass: 'aspect-[16/10]',
    glowColor: 'bg-[#3B82F6]',
    shadowColor: 'rgba(59, 130, 246, 0.4)',
  },
  {
    tag: { emoji: '🤖', label: 'AI Vision', color: 'bg-white/10 text-purple-400' },
    title: 'Hybrid Scanner — Barcode + AI Vision + Physics Validation.',
    desc: 'Chỉ cần chụp nhãn dinh dưỡng hoặc quét mã vạch — AI tự đọc và ghi nhận. Không cần nhập liệu thủ công.',
    side: 'right',
    mockupType: 'modal',
    img: aiScannerScreenshot,
    imgAlt: 'AI Nutrition Scanner',
    glowColor: 'bg-[#8B5CF6]',
    shadowColor: 'rgba(139, 92, 246, 0.4)',
  },
  {
    tag: { emoji: '📊', label: 'Phân tích', color: 'bg-white/10 text-teal-400' },
    title: 'Biểu đồ xu hướng "giải nhiễu" cân nặng khoa học.',
    desc: 'Lọc nhiễu dao động nước hàng ngày, hiển thị đường xu hướng chuẩn xác. Bạn thấy tiến trình thực sự — không bị đánh lừa bởi dao động ngắn hạn.',
    side: 'left',
    mockupType: 'browser',
    img: weightChartScreenshot,
    imgAlt: 'Weight Trend Chart',
    aspectClass: 'aspect-[16/7]',
    glowColor: 'bg-[#14B8A6]',
    shadowColor: 'rgba(20, 184, 166, 0.4)',
  },
  {
    tag: { emoji: '🏆', label: 'Chấm điểm AI', color: 'bg-white/10 text-rose-400' },
    title: 'Chấm điểm 0-100 & Phân tích từ Bác sĩ ảo.',
    desc: 'Tự động chấm điểm bữa ăn dựa trên mật độ vi chất, trừ điểm dư muối, vượt đường. Bác sĩ ảo sẽ đưa ra cảnh báo chuẩn y khoa mỗi ngày.',
    side: 'right',
    mockupType: 'browser',
    img: nutrientScoringScreenshot,
    imgAlt: 'Bảng điểm dinh dưỡng & Lời khuyên AI',
    aspectClass: 'aspect-auto',
    imageClass: 'w-full h-auto object-contain [image-rendering:-webkit-optimize-contrast] contrast-[1.05] saturate-[1.05] bg-white p-2 sm:p-6',
    glowColor: 'bg-[#F43F5E]',
    shadowColor: 'rgba(244, 63, 94, 0.4)',
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="pt-36 pb-24 bg-[#003139] overflow-hidden">
      <div className="container mx-auto px-6 lg:px-12">

        {/* Section Header */}
        <motion.div
          className="text-center mb-24"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-[#5FE089] font-semibold mb-4 text-sm">
            ✨ Tính năng nổi bật
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-heading text-white mb-4">
            Được xây dựng để thực sự <span className="text-[#5FE089]">hiệu quả</span>
          </h2>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Từng tính năng được thiết kế dựa trên khoa học dinh dưỡng và thuật toán toán học, không phải chỉ là con số calo đơn giản.
          </p>
        </motion.div>

        {/* Feature Blocks */}
        <div className="flex flex-col gap-48">
          {featureBlocks.map((block, index) => {
            const isRight = block.side === 'right';
            return (
              <div
                key={index}
                className={`flex flex-col ${isRight ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-16`}
              >
                {/* Text Side */}
                <div className={`flex-1 ${isRight ? 'lg:pr-10' : 'lg:pl-10'}`}>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${block.tag.color} font-semibold mb-6 text-sm`}>
                    {block.tag.emoji} {block.tag.label}
                  </div>
                  <h3 className="text-3xl lg:text-4xl font-bold font-heading mb-6 leading-tight text-white">
                    {block.title}
                  </h3>
                  <p className="text-lg text-white/70 leading-relaxed">
                    {block.desc}
                  </p>
                </div>

                {/* Image Side */}
                <motion.div
                  className="flex-1 relative w-full flex justify-center hidden sm:flex"
                  initial={{ opacity: 0, scale: 0.93 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '-100px' }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  style={{ perspective: '1200px' }}
                >


                  {/* 3D Tilt Wrapper */}
                  <motion.div
                    className="w-full relative group"
                    initial={{ rotateY: isRight ? -3 : 3, rotateX: 1 }}
                    whileHover={{ rotateY: 0, rotateX: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    style={{ transformStyle: "preserve-3d" }}
                  >
                    {/* Dots Pattern Decoration */}
                    <div className={`absolute ${isRight ? '-bottom-10 -left-10' : '-bottom-10 -right-10'} w-32 h-32 opacity-[0.08] pointer-events-none -z-10`} style={{ backgroundImage: 'radial-gradient(white 2px, transparent 2px)', backgroundSize: '16px 16px' }} />

                  {block.mockupType === 'phone' && (
                    <PhoneMockup>
                      <img
                        loading="lazy"
                        decoding="async"
                        src={block.img}
                        alt={block.imgAlt}
                        className="w-full h-full object-cover object-top"
                      />
                    </PhoneMockup>
                  )}

                  {block.mockupType === 'browser' && (
                    <div className="w-full">
                      <BrowserMockup aspectClass={block.aspectClass}>
                        <img
                          loading="lazy"
                          decoding="async"
                          src={block.img}
                          alt={block.imgAlt}
                          className={block.imageClass || "w-full h-full object-cover object-top"}
                        />
                      </BrowserMockup>
                    </div>
                  )}

                  {block.mockupType === 'modal' && (
                    /* Hiệu ứng modal nổi trên nền mờ - phù hợp với ảnh AI Scanner */
                    <div className="relative w-full max-w-md mx-auto">
                      {/* Nền giả lập app phía sau modal */}
                      <div className="absolute inset-0 -m-6 rounded-2xl overflow-hidden border border-white/5">
                        <div className="w-full h-full bg-[#002228] flex items-center justify-center">
                          <div className="text-white/20 text-sm font-medium">NutriTrack App</div>
                        </div>
                      </div>
                      {/* Overlay mờ */}
                      <div className="absolute inset-0 -m-6 bg-black/40 rounded-2xl"></div>
                      {/* Modal card nổi */}
                      <div
                        className="relative bg-white rounded-2xl border border-[#DFE3E4] overflow-hidden z-10 animate-float-sm"
                        style={{ boxShadow: block.shadowColor ? `0 25px 50px -12px ${block.shadowColor}` : '0 25px 50px -12px rgba(0,0,0,0.25)' }}
                      >
                        <img
                          loading="lazy"
                          decoding="async"
                          src={block.img}
                          alt={block.imgAlt}
                          className="w-full h-auto"
                        />
                      </div>
                    </div>
                  )}
                  </motion.div>
                </motion.div>

                {/* Image Side Mobile (No 3D/Glow for performance) */}
                <div className="flex-1 relative w-full flex justify-center sm:hidden">
                  {block.mockupType === 'phone' && (
                    <PhoneMockup>
                      <img
                        loading="lazy"
                        decoding="async"
                        src={block.img}
                        alt={block.imgAlt}
                        className="w-full h-full object-cover object-top"
                      />
                    </PhoneMockup>
                  )}

                  {block.mockupType === 'browser' && (
                    <div className="w-full">
                      <BrowserMockup aspectClass={block.aspectClass} shadowColor={block.shadowColor}>
                        <img
                          loading="lazy"
                          decoding="async"
                          src={block.img}
                          alt={block.imgAlt}
                          className={block.imageClass || "w-full h-full object-cover object-top"}
                        />
                      </BrowserMockup>
                    </div>
                  )}

                  {block.mockupType === 'modal' && (
                    <div className="relative w-full max-w-md mx-auto">
                      <div className="absolute inset-0 -m-6 bg-black/5 rounded-2xl"></div>
                      <div className="relative bg-white rounded-2xl shadow-xl border border-[#DFE3E4] overflow-hidden z-10">
                        <img loading="lazy" decoding="async" src={block.img} alt={block.imgAlt} className="w-full h-auto" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
