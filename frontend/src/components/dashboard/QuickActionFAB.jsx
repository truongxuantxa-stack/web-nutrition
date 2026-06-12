import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

export default function QuickActionFAB({ onClick }) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#003139] text-white flex items-center justify-center shadow-[rgba(0,49,57,0.35)_0px_4px_12px] hover:bg-[#244348] hover:shadow-[rgba(0,49,57,0.5)_0px_8px_20px] cursor-pointer focus:outline-none animate-fab-pulse"
      whileHover={{ scale: 1.1, rotate: 90 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      aria-label="Thêm bữa ăn nhanh"
    >
      <Plus className="w-7 h-7" />
    </motion.button>
  );
}
