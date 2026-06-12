import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ErrorBoundary from '../common/ErrorBoundary';
import { Menu } from 'lucide-react';
import { Leaf } from 'lucide-react';

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F0F2F3] flex">

      {/* ── Desktop Sidebar (fixed 260px, lg+) ─────────────────────── */}
      <div className="hidden lg:block w-[260px] flex-shrink-0">
        <div className="fixed top-0 left-0 w-[260px] h-screen bg-white border-r border-[#DFE3E4] z-30 flex flex-col overflow-y-auto">
          <Sidebar />
        </div>
      </div>

      {/* ── Mobile overlay backdrop ─────────────────────────────────── */}
      {isSidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ── Mobile Sidebar (slide-in overlay) ──────────────────────── */}
      <div className={`lg:hidden fixed top-0 left-0 h-screen w-[260px] bg-white border-r border-[#DFE3E4] z-50 flex flex-col overflow-y-auto transition-transform duration-300 ease-in-out ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar onClose={() => setIsSidebarOpen(false)} />
      </div>

      {/* ── Main Content Area ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">

        {/* Mobile topbar */}
        <div className="lg:hidden sticky top-0 z-30 h-16 bg-white border-b border-[#DFE3E4] flex items-center px-4 gap-3 shadow-[rgba(21,23,29,0.06)_0px_2px_8px]">
          <button
            id="mobile-menu-toggle"
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg text-[#244348] hover:bg-[#F0F2F3] transition-colors"
            aria-label="Mở menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5">
            <Leaf className="w-5 h-5 text-[#5FE089]" />
            <span className="text-lg font-bold text-[#003139] font-heading">NutriTrack</span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

    </div>
  );
}
