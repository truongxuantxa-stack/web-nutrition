import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Sun, Moon, Menu, X } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-base-100/80 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-6 lg:px-12 flex justify-between items-center">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 text-2xl font-bold font-heading text-emerald-600 dark:text-emerald-400">
          <Leaf className="w-8 h-8" />
          <span>NutriTrack</span>
        </a>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 font-medium">
          <a href="#features" className="hover:text-emerald-600 transition-colors">Tính năng</a>
          <a href="#how-it-works" className="hover:text-emerald-600 transition-colors">Cách hoạt động</a>
          <a href="#testimonials" className="hover:text-emerald-600 transition-colors">Đánh giá</a>
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={toggleTheme} 
            className="btn btn-circle btn-ghost btn-sm text-base-content"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <Link to="/welcome" className="btn btn-primary rounded-full px-8 text-white border-none bg-emerald-600 hover:bg-emerald-700">
            Bắt đầu ngay
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-2">
          <button 
            onClick={toggleTheme} 
            className="btn btn-circle btn-ghost btn-sm"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            className="btn btn-square btn-ghost btn-sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-base-100 shadow-lg border-t border-base-200 p-4 flex flex-col gap-4">
          <a href="#features" className="p-2 hover:bg-base-200 rounded-lg">Tính năng</a>
          <a href="#how-it-works" className="p-2 hover:bg-base-200 rounded-lg">Cách hoạt động</a>
          <a href="#testimonials" className="p-2 hover:bg-base-200 rounded-lg">Đánh giá</a>
          <Link to="/welcome" className="btn btn-primary w-full text-white bg-emerald-600 hover:bg-emerald-700 border-none mt-2">
            Bắt đầu ngay
          </Link>
        </div>
      )}
    </motion.nav>
  );
}
