import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const features = [
  {
    image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=600&auto=format&fit=crop',
    text: 'Sẵn sàng cho những mục tiêu sức khỏe của bạn.'
  },
  {
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=600&auto=format&fit=crop',
    text: 'Khám phá tác động của chế độ ăn uống và tình trạng sức khỏe của bạn.'
  },
  {
    image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=600&auto=format&fit=crop',
    text: 'Và hãy ăn uống có trách nhiệm.'
  }
];

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-white text-base-content flex flex-col pb-24">
      {/* Header */}
      <div className="text-center pt-12 pb-8 px-6">
        <p className="text-sm text-gray-500 mb-2">Chào mừng đến với</p>
        <h1 className="text-3xl font-bold font-heading text-emerald-600">NutriTrack</h1>
      </div>

      {/* Content */}
      <div className="flex-1 container mx-auto px-6 max-w-md space-y-12">
        {features.map((item, index) => (
          <motion.div 
            key={index}
            className="flex flex-col items-center text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
          >
            <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden mb-6 shadow-md">
              <img 
                src={item.image} 
                alt="Feature illustration" 
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-lg text-gray-700 font-medium px-4">
              {item.text}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Fixed Bottom Action */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-white via-white to-transparent">
        <div className="max-w-md mx-auto">
          <Link 
            to="/register" 
            className="btn btn-primary w-full rounded-full bg-emerald-600 hover:bg-emerald-700 border-none text-white text-lg h-14"
          >
            TIẾP TỤC
          </Link>
        </div>
      </div>
    </div>
  );
}
