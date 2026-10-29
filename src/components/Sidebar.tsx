import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, Calendar, Camera, Users,
  Film, MessageSquare, DollarSign, FileText, Settings,
  UserCircle, ChevronLeft, ChevronRight, Clapperboard, ShieldCheck, Sliders
} from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store/useStore';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser } = useStore();

  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const canFinance = isAdmin || isManager || currentUser?.permissions?.canManageFinance;

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    ...(isAdmin ? [
      { to: '/admin', icon: Sliders, label: 'Trung tâm Admin' },
    ] : []),
    { to: '/projects', icon: FolderKanban, label: 'Dự án' },
    { to: '/calendar', icon: Calendar, label: 'Lịch' },
    { to: '/equipment', icon: Camera, label: 'Thiết bị' },
    { to: '/team', icon: Users, label: 'Nhân sự' },
    { to: '/post-production', icon: Film, label: 'Hậu kỳ' },
    { to: '/revisions', icon: MessageSquare, label: 'Revision' },
    ...(canFinance ? [
      { to: '/budget', icon: DollarSign, label: 'Tài chính' },
      { to: '/invoices', icon: FileText, label: 'Invoice' },
    ] : []),
    { to: '/clients', icon: UserCircle, label: 'Khách hàng' },
    ...(isAdmin ? [
      { to: '/users', icon: ShieldCheck, label: 'Tài khoản & Quyền' },
    ] : []),
    { to: '/settings', icon: Settings, label: 'Cài đặt' },
  ];

  return (
    <aside
      className={`${
        collapsed ? 'w-[68px]' : 'w-60'
      } h-screen bg-white dark:bg-dark-900 border-r border-gray-200 dark:border-dark-700 flex flex-col transition-all duration-300 sticky top-0`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 dark:border-dark-700">
        <img
          src="/artdict-logo.jpg"
          alt="Artdict Media"
          className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-md border border-gray-200 dark:border-dark-700"
        />
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-black text-gray-900 dark:text-gray-100 whitespace-nowrap tracking-wide leading-tight">
              ARTDICT MEDIA
            </h1>
            <p className="text-[10px] text-primary-600 dark:text-primary-400 font-semibold tracking-wider uppercase">
              Production Suite
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              isActive ? 'sidebar-link-active' : 'sidebar-link'
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <div className="px-3 py-3 border-t border-gray-200 dark:border-dark-700">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors text-gray-500"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
}
