import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

export default function QuickActionFAB({ onClick }) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-primary to-secondary text-primary-content flex items-center justify-center shadow-lg hover:shadow-xl cursor-pointer focus:outline-none animate-fab-pulse"
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
