import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './Sidebar';
import ErrorBoundary from '../common/ErrorBoundary';

export default function AppLayout() {
  return (
    <div className="drawer lg:drawer-open">
      <input id="app-drawer-toggle" type="checkbox" className="drawer-toggle" />

      {/* ─── Main content ─────────────────────────────────────────── */}
      <div className="drawer-content flex flex-col min-h-screen gradient-bg">
        {/* Mobile topbar */}
        <div className="navbar bg-base-100 border-b border-base-300 lg:hidden sticky top-0 z-30">
          <label
            htmlFor="app-drawer-toggle"
            className="btn btn-ghost btn-square drawer-button"
            aria-label="Mở menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </label>
          <span className="text-lg font-bold text-primary ml-2">🥗 NutriTrack</span>
        </div>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      {/* ─── Sidebar drawer ───────────────────────────────────────── */}
      <div className="drawer-side z-40">
        <label htmlFor="app-drawer-toggle" aria-label="Đóng menu" className="drawer-overlay" />
        <Sidebar />
      </div>

      {/* ─── Toast container ──────────────────────────────────────── */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '8px',
            fontSize: '14px',
          },
        }}
      />
    </div>
  );
}
