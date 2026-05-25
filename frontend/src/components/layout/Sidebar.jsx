import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  CalendarDays,
  Scale,
  Dumbbell,
  LogOut,
} from 'lucide-react';

const navItems = [
  { to: '/dashboard',    label: 'Tổng quan',    icon: LayoutDashboard },
  { to: '/diary',        label: 'Nhật ký',       icon: BookOpen },
  { to: '/meal-planner', label: 'Lập kế hoạch',  icon: CalendarDays },
];

// EJS pages (dùng window.location thay vì NavLink)
const ejsItems = [
  { href: '/can-nang',  label: 'Cân nặng',   icon: Scale },
  { href: '/luyen-tap', label: 'Luyện tập',  icon: Dumbbell },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 min-h-screen bg-base-100 border-r border-base-300 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-base-300">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🥗</span>
          <span className="text-xl font-bold text-primary">NutriTrack</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 flex flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${isActive
                ? 'bg-primary/10 text-primary'
                : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}

        <div className="divider my-2 text-xs text-base-content/40">EJS Pages</div>

        {ejsItems.map(({ href, label, icon: Icon }) => (
          <a
            key={href}
            href={href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-base-content/70 hover:bg-base-200 hover:text-base-content transition-colors"
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </a>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="p-4 border-t border-base-300">
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar placeholder">
            <div className="bg-primary/20 text-primary rounded-full w-9">
              <span className="text-sm font-bold">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.name || 'Người dùng'}</p>
            <p className="text-xs text-base-content/50 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          id="sidebar-logout"
          onClick={logout}
          className="btn btn-ghost btn-sm w-full justify-start gap-2 text-error hover:bg-error/10"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
