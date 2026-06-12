import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Leaf, LayoutDashboard, BookOpen, CalendarDays, Scale, Dumbbell, User, LogOut, X } from 'lucide-react';

const navItems = [
  { to: '/dashboard',    label: 'Tổng quan',    icon: LayoutDashboard },
  { to: '/diary',        label: 'Nhật ký',       icon: BookOpen },
  { to: '/meal-planner', label: 'Lập kế hoạch',  icon: CalendarDays },
  { to: '/weight',       label: 'Cân nặng',      icon: Scale },
  { to: '/exercise',     label: 'Luyện tập',     icon: Dumbbell },
  { to: '/profile',      label: 'Hồ sơ',         icon: User },
];

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <aside className="w-[260px] flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#DFE3E4] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Leaf className="w-5 h-5 text-[#5FE089]" />
          <span className="text-xl font-bold text-[#003139] font-heading">NutriTrack</span>
        </div>
        {/* Mobile close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-[#96A5A8] hover:bg-[#F0F2F3] transition-colors"
            aria-label="Đóng menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#003139]/8 text-[#003139] font-semibold border-l-2 border-[#003139] rounded-l-none pl-[10px]'
                  : 'text-[#244348] hover:bg-[#003139]/5 hover:text-[#003139]'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-[#DFE3E4] flex-shrink-0">
        <div className="flex items-center gap-3 px-3 mb-3">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-[#003139]/15 text-[#003139] flex items-center justify-center font-bold text-sm flex-shrink-0">
            {userInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#003139] truncate">{user?.name || 'Người dùng'}</p>
            <p className="text-xs text-[#96A5A8] truncate">{user?.email}</p>
          </div>
        </div>

        <button
          id="sidebar-logout"
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#003139] hover:bg-[#003139]/8 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Đăng xuất
        </button>
      </div>
    </aside>
  );
}
