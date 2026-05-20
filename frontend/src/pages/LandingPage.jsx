import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/landing/HeroSection';
import AppShowcase from '../components/landing/AppShowcase';
import StatsCounter from '../components/landing/StatsCounter';
import FeaturesSection from '../components/landing/FeaturesSection';
import HowItWorks from '../components/landing/HowItWorks';
import Testimonials from '../components/landing/Testimonials';
import CTASection from '../components/landing/CTASection';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-base-100 text-base-content selection:bg-emerald-200 selection:text-emerald-900 transition-colors duration-300">
      <Navbar />
      <main>
        <HeroSection />
        <AppShowcase />
        <StatsCounter />
        <FeaturesSection />
        <HowItWorks />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
