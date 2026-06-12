import React from 'react';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import HeroSection from '../components/landing/HeroSection';
import AppShowcase from '../components/landing/AppShowcase';
import StatsCounter from '../components/landing/StatsCounter';
import FeaturesSection from '../components/landing/FeaturesSection';
import AlgorithmShowcase from '../components/landing/AlgorithmShowcase';
import IntegrationSection from '../components/landing/IntegrationSection';
import PricingSection from '../components/landing/PricingSection';
import Testimonials from '../components/landing/Testimonials';
import CTASection from '../components/landing/CTASection';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-[#003139] font-sans">
      <Navbar />
      <main>
        <HeroSection />
        <AppShowcase />
        <FeaturesSection />
        <AlgorithmShowcase />
        <IntegrationSection />
        <StatsCounter />
        <PricingSection />
        <Testimonials />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
