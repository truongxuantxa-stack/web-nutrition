import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView, animate } from 'framer-motion';

function Counter({ from, to, suffix = '', duration = 2 }) {
  const nodeRef = useRef(null);
  const inView = useInView(nodeRef, { once: true });
  
  useEffect(() => {
    if (inView) {
      const node = nodeRef.current;
      const controls = animate(from, to, {
        duration,
        onUpdate(value) {
          if (node) {
            node.textContent = Math.round(value) + suffix;
          }
        },
      });
      return () => controls.stop();
    }
  }, [from, to, suffix, duration, inView]);

  return <span ref={nodeRef}>{from}{suffix}</span>;
}

export default function StatsCounter() {
  const stats = [
    { value: 500, suffix: '+', label: 'Nguyên liệu CSDL', duration: 2 },
    { value: 4, suffix: '', label: 'Thuật toán thông minh', duration: 1.5 },
    { value: 100, suffix: '%', label: 'Cá nhân hóa', duration: 2 },
    { value: 7, suffix: ' - 30', label: 'Ngày lên thực đơn', duration: 1.5 },
  ];

  return (
    <section className="py-16 bg-white relative overflow-hidden">
      {/* Subtle decorative line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-[#DFE3E4] to-transparent"></div>
      
      <div className="container mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x-0 md:divide-x divide-[#DFE3E4]">
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              className="text-center px-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="text-4xl md:text-5xl font-bold font-heading text-[#003139] mb-2">
                <Counter from={0} to={stat.value} suffix={stat.suffix} duration={stat.duration} />
              </div>
              <div className="text-sm font-medium text-[#244348] uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
