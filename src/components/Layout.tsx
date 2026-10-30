import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useStore } from '../store/useStore';
import { Bell, Search, Moon, Sun, LogOut, Menu, UserCheck, Sparkles, Phone, Mail, Edit3 } from 'lucide-react';
import { useState } from 'react';
import Login from '../pages/Login';
import Modal from './Modal';
import { getAvatarColor, getInitials, generateId } from '../utils/helpers';
import type { TeamRole } from '../types';

const ROLE_OPTIONS: TeamRole[] = [
  'Director', 'DOP', 'Camera Operator', 'Editor', 'Colorist',
  'Sound Engineer', 'Drone Pilot', 'Gaffer', 'Production Assistant',
  'Producer', 'Photographer', 'Other',
];

export default function Layout() {
  const {
    settings,
    updateSettings,
    notifications,
    markNotificationRead,
    currentUser,
    logout,
    teamMembers,
    addTeamMember,
    updateTeamMember,
  } = useStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Profile Edit Modal State
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileRole, setProfileRole] = useState<TeamRole>('Camera Operator');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileSkills, setProfileSkills] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  const navigate = useNavigate();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const toggleDarkMode = () => {
    const newDark = !settings.darkMode;
    updateSettings({ darkMode: newDark });
    if (newDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Mở modal chỉnh sửa hồ sơ nhân sự cá nhân
  const handleOpenProfileModal = () => {
    if (!currentUser) return;
    const member = teamMembers.find(
      (m) => m.id === currentUser.teamMemberId || m.name.toLowerCase() === currentUser.name.toLowerCase()
    );

    setProfileName(member?.name || currentUser.name || '');
    setProfileRole((member?.role as TeamRole) || 'Camera Operator');
    setProfilePhone(member?.phone || '');
    setProfileEmail(member?.email || '');
    setProfileSkills(member?.skills ? member.skills.join(', ') : '');
    setProfileSaved(false);
    setIsProfileModalOpen(true);
  };

  // Lưu hồ sơ nhân sự
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const existingMember = teamMembers.find(
      (m) => m.id === currentUser.teamMemberId || m.name.toLowerCase() === currentUser.name.toLowerCase()
    );

    const skillsArray = profileSkills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (existingMember) {
      updateTeamMember(existingMember.id, {
        name: profileName.trim(),
        role: profileRole,
        phone: profilePhone.trim(),
        email: profileEmail.trim(),
        skills: skillsArray,
      });
    } else {
      const newMemberId = generateId();
      addTeamMember({
        id: newMemberId,
        name: profileName.trim(),
        role: profileRole,
        phone: profilePhone.trim(),
        email: profileEmail.trim(),
        avatar: getInitials(profileName.trim()),
        skills: skillsArray,
        projectRate: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      });
    }

    setProfileSaved(true);
    setTimeout(() => {
      setProfileSaved(false);
      setIsProfileModalOpen(false);
    }, 1200);
  };

  // If not logged in, render the Login screen
  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className={`flex h-screen overflow-hidden ${settings.darkMode ? 'dark' : ''}`}>
      {/* Responsive Sidebar (Desktop permanent + Mobile slide-out drawer) */}
      <Sidebar
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden w-full">
        {/* Top Header bar */}
        <header className="h-14 bg-white/75 dark:bg-[#0a0e17]/75 backdrop-blur-2xl border-b border-slate-200/70 dark:border-white/10 flex items-center justify-between px-3 sm:px-6 flex-shrink-0 z-20 shadow-xs">
          {/* Left section: Hamburger menu on mobile + Search on desktop */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Hamburger Menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800 lg:hidden shrink-0 transition-colors"
              title="Mở menu điều hướng"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Brand Name */}
            <div className="flex items-center gap-2 lg:hidden shrink-0">
              <img
                src="/artdict-logo.jpg"
                alt="Logo"
                className="w-7 h-7 rounded-lg object-cover shadow-sm"
              />
              <span className="font-black text-xs tracking-wider text-gray-900 dark:text-gray-100">
                ARTDICT
              </span>
            </div>

            {/* Search - Hidden on small mobile screens to prevent breaking the header */}
            <div className="hidden md:flex relative w-48 lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm dự án, gear, nhân sự..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-gray-100 dark:bg-dark-800 border-0 rounded-lg text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-gray-100 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Right section: Dark Mode, Notifications, User info, Logout */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors text-gray-500 dark:text-gray-400"
              title={settings.darkMode ? 'Giao diện sáng' : 'Giao diện tối'}
            >
              {settings.darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors text-gray-500 dark:text-gray-400 relative"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 card shadow-2xl z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b border-gray-200 dark:border-dark-700">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Thông báo</h3>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-gray-500">
                      Không có thông báo mới
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-dark-700">
                      {notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-800 ${
                            !n.isRead ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''
                          }`}
                        >
                          {n.senderName && (
                            <span className="text-[10px] uppercase font-bold text-primary-600 dark:text-primary-400 block mb-0.5">
                              {n.senderName}
                            </span>
                          )}
                          <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">{n.title}</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Profile Info & Logout */}
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200/70 dark:border-white/10">
              <button
                onClick={handleOpenProfileModal}
                className="flex items-center gap-2 group p-1 -m-1 rounded-xl hover:bg-white/60 dark:hover:bg-white/10 transition-all cursor-pointer text-left"
                title="Bấm để chỉnh sửa hồ sơ nhân sự của bạn"
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-md ring-2 ring-transparent group-hover:ring-primary-500/50 shrink-0 transition-all ${getAvatarColor(
                    currentUser.name
                  )}`}
                >
                  {getInitials(currentUser.name)}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[100px] lg:max-w-[130px] group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {currentUser.name}
                    </span>
                    {currentUser.role === 'admin' ? (
                      <span className="badge bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-[10px] font-bold">
                        Admin
                      </span>
                    ) : currentUser.role === 'manager' ? (
                      <span className="badge bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-[10px] font-bold">
                        Quản lý
                      </span>
                    ) : (
                      <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[10px]">
                        Nhân viên
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono leading-none flex items-center gap-1">
                    <span>@{currentUser.username}</span>
                    <span className="text-[9px] text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity">✏️ Sửa</span>
                  </div>
                </div>
              </button>

              {/* Logout button */}
              <button
                onClick={logout}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors ml-0.5 cursor-pointer"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content View with responsive padding */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 lg:p-6 bg-transparent w-full min-w-0">
          <Outlet />
        </main>
      </div>

      {/* MODAL CHỈNH SỬA PROFILE NHÂN SỰ CỦA MỌI ROLE */}
      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="Hồ sơ nhân sự của bạn"
        size="md"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="p-3 bg-primary-50/50 dark:bg-primary-950/20 border border-primary-200/60 dark:border-primary-800/40 rounded-xl text-xs text-primary-800 dark:text-primary-300">
            💡 Bạn có thể tự cập nhật họ tên, vai trò chuyên môn, số điện thoại, email và kỹ năng của mình để xuất hiện chính xác trong Call Sheet và danh bạ team.
          </div>

          <div>
            <label className="label">Họ và tên *</label>
            <input
              type="text"
              className="input w-full"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              placeholder="Họ và tên của bạn"
              required
            />
          </div>

          <div>
            <label className="label">Vai trò chuyên môn trong đoàn *</label>
            <select
              className="select w-full"
              value={profileRole}
              onChange={(e) => setProfileRole(e.target.value as TeamRole)}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Số điện thoại</label>
              <input
                type="text"
                className="input w-full"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value)}
                placeholder="09xx xxx xxx"
              />
            </div>
            <div>
              <label className="label">Email liên hệ</label>
              <input
                type="email"
                className="input w-full"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                placeholder="email@artdictmedia.vn"
              />
            </div>
          </div>

          <div>
            <label className="label">Kỹ năng / Thiết bị sở trường</label>
            <input
              type="text"
              className="input w-full"
              value={profileSkills}
              onChange={(e) => setProfileSkills(e.target.value)}
              placeholder="VD: Sony FX6, DaVinci Resolve, Gimbal RS3, FPV Drone..."
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Phân cách nhau bằng dấu phẩy</span>
          </div>

          {profileSaved && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold text-center">
              ✓ Đã lưu hồ sơ nhân sự thành công!
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200/70 dark:border-white/10">
            <button
              type="button"
              onClick={() => setIsProfileModalOpen(false)}
              className="btn-secondary"
            >
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              Cập nhật hồ sơ
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
