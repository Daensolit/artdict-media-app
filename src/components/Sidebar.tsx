import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, FolderKanban, Calendar, Camera, Users,
  Film, MessageSquare, DollarSign, FileText, Settings,
  UserCircle, ChevronLeft, ChevronRight, ShieldCheck, Sliders, X
} from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store/useStore';

interface SidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({ isOpenMobile, onCloseMobile }: SidebarProps) {
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
    <>
      {/* ─── DESKTOP SIDEBAR (Visible on lg screens and up) ─── */}
      <aside
        className={`hidden lg:flex flex-col h-screen bg-white/75 dark:bg-[#08090f]/70 backdrop-blur-2xl border-r border-slate-200/80 dark:border-white/[0.08] dark:border-t-white/[0.12] sticky top-0 transition-all duration-300 z-30 shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.15)] ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Logo with Pro Studio Squircle Glow */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-200/70 dark:border-white/[0.08]">
          <div className="relative group">
            <img
              src="/artdict-logo.jpg"
              alt="Artdict Media"
              className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-lg ring-1 ring-white/30 dark:ring-white/15 transition-transform duration-200 group-hover:scale-105"
            />
            <div className="absolute inset-0 rounded-xl bg-orange-500/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-black text-gray-900 dark:text-zinc-100 whitespace-nowrap tracking-wider leading-tight">
                ARTDICT MEDIA
              </h1>
              <p className="text-[10px] text-orange-500 dark:text-orange-400 font-semibold tracking-widest uppercase">
                Production Suite
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
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
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="whitespace-nowrap font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse Toggle */}
        <div className="px-3 py-3 border-t border-slate-200/70 dark:border-white/[0.08]">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-xl hover:bg-white/60 dark:hover:bg-white/[0.08] transition-all hover:scale-105 active:scale-95 text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200"
            title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
          >
            {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>
      </aside>

      {/* ─── MOBILE DRAWER (For phones and small tablets) ─── */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-md z-40 lg:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white/95 dark:bg-[#08090f]/90 backdrop-blur-3xl border-r border-slate-200/80 dark:border-white/[0.08] shadow-2xl flex flex-col lg:hidden transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200/70 dark:border-white/[0.08]">
          <div className="flex items-center gap-3">
            <img
              src="/artdict-logo.jpg"
              alt="Artdict Media"
              className="w-9 h-9 rounded-xl object-cover shadow-md ring-1 ring-white/20"
            />
            <div>
              <h1 className="text-sm font-black text-gray-900 dark:text-zinc-100 tracking-wider leading-tight">
                ARTDICT MEDIA
              </h1>
              <p className="text-[10px] text-orange-500 dark:text-orange-400 font-semibold tracking-widest uppercase">
                Production Suite
              </p>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-white/60 dark:hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Nav links */}
        <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                isActive ? 'sidebar-link-active' : 'sidebar-link'
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
