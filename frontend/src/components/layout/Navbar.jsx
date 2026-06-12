import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Menu, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
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
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-[rgba(21,23,29,0.08)_0px_2px_8px] border-b border-[#DFE3E4] py-3'
          : 'bg-white border-b border-[#DFE3E4] py-4'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-6 lg:px-12 flex justify-between items-center">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 text-xl font-bold font-heading text-[#003139]">
          <Leaf className="w-6 h-6 text-[#5FE089]" />
          <span>NutriTrack</span>
        </a>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-1">
          <a href="#features" className="tcl-nav-link">Tính năng</a>
          <a href="#how-it-works" className="tcl-nav-link">Cách hoạt động</a>
          <a href="#testimonials" className="tcl-nav-link">Đánh giá</a>
        </div>

        {/* Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="tcl-btn-ghost text-sm">Đăng nhập</Link>
          <Link to="/register" className="tcl-btn-primary text-sm px-5 py-2.5">
            Bắt đầu ngay
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-lg text-[#244348] hover:bg-[#F0F2F3] transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#DFE3E4] bg-white px-6 py-4 flex flex-col gap-1">
          <a
            href="#features"
            className="tcl-nav-link py-3"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Tính năng
          </a>
          <a
            href="#how-it-works"
            className="tcl-nav-link py-3"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Cách hoạt động
          </a>
          <a
            href="#testimonials"
            className="tcl-nav-link py-3"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Đánh giá
          </a>
          <div className="pt-3 border-t border-[#DFE3E4] mt-2 flex flex-col gap-2">
            <Link to="/login" className="tcl-btn-ghost w-full justify-center">Đăng nhập</Link>
            <Link to="/register" className="tcl-btn-primary w-full justify-center">Bắt đầu ngay</Link>
          </div>
        </div>
      )}
    </motion.nav>
  );
}
