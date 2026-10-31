import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useStore } from '../store/useStore';
import { Bell, Search, Moon, Sun, LogOut, Menu, UserCheck, Sparkles, Phone, Mail, Edit3, Camera, Upload, Trash2, Image as ImageIcon } from 'lucide-react';
import { useState, useRef } from 'react';
import Login from '../pages/Login';
import Modal from './Modal';
import Avatar from './Avatar';
import GlassSelect from './GlassSelect';
import AmbientGlow from './AmbientGlow';
import { getAvatarColor, getInitials, generateId, compressAvatarImage } from '../utils/helpers';
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
    updateUser,
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
  const [profileAvatar, setProfileAvatar] = useState('');
  const [isCompressingAvatar, setIsCompressingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const navigate = useNavigate();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Thành viên tương ứng của user hiện tại
  const currentMember = teamMembers.find(
    (m) => m.id === currentUser?.teamMemberId || m.name.toLowerCase() === currentUser?.name.toLowerCase()
  );
  const currentAvatar = currentMember?.avatar || currentUser?.avatar || '';

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
    setProfileAvatar(member?.avatar || currentUser.avatar || '');
    setAvatarError('');
    setProfileSaved(false);
    setIsProfileModalOpen(true);
  };

  // Chọn ảnh avatar và nén tự động
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP...).');
      return;
    }

    try {
      setIsCompressingAvatar(true);
      setAvatarError('');
      const compressed = await compressAvatarImage(file);
      setProfileAvatar(compressed);
    } catch (err: any) {
      setAvatarError(err?.message || 'Lỗi khi xử lý hình ảnh');
    } finally {
      setIsCompressingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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

    const finalAvatar = profileAvatar || getInitials(profileName.trim());

    if (existingMember) {
      updateTeamMember(existingMember.id, {
        name: profileName.trim(),
        role: profileRole,
        phone: profilePhone.trim(),
        email: profileEmail.trim(),
        avatar: finalAvatar,
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
        avatar: finalAvatar,
        skills: skillsArray,
        projectRate: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      });
    }

    // Cập nhật cả User state để đồng bộ tức thì trên header
    updateUser(currentUser.id, {
      name: profileName.trim(),
      avatar: finalAvatar,
      teamMemberId: existingMember?.id || currentUser.teamMemberId,
    });

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
    <div className={`flex h-screen overflow-hidden ${settings.darkMode ? 'dark' : ''} bg-[#f8fafc] dark:bg-[#070709]`}>
      {/* visionOS Spatial Ambient Mesh Glow */}
      <AmbientGlow />

      {/* Responsive Sidebar (Desktop permanent + Mobile slide-out drawer) */}
      <Sidebar
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden w-full relative z-10">
        {/* Top Header bar - Apple Liquid Glass with Specular Rim Light */}
        <header className="h-14 bg-white/70 dark:bg-[#08090f]/60 backdrop-blur-2xl border-b border-slate-200/80 dark:border-white/[0.08] dark:border-t-white/[0.12] flex items-center justify-between px-3 sm:px-6 flex-shrink-0 z-20 shadow-[0_4px_24px_rgba(0,0,0,0.15)]">
          {/* Left section: Hamburger menu on mobile + Search on desktop */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Hamburger Menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-xl text-gray-600 dark:text-zinc-300 hover:bg-white/60 dark:hover:bg-white/[0.08] lg:hidden shrink-0 transition-all hover:scale-105 active:scale-95"
              title="Mở menu điều hướng"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Brand Name */}
            <div className="flex items-center gap-2 lg:hidden shrink-0">
              <img
                src="/artdict-logo.jpg"
                alt="Logo"
                className="w-7 h-7 rounded-lg object-cover shadow-md ring-1 ring-white/20"
              />
              <span className="font-black text-xs tracking-wider text-gray-900 dark:text-zinc-100">
                ARTDICT
              </span>
            </div>

            {/* Search - Pro Studio Liquid Search */}
            <div className="hidden md:flex relative w-48 lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
              <input
                type="text"
                placeholder="Tìm dự án, gear, nhân sự..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/80 dark:border-white/[0.08] dark:border-t-white/[0.14] rounded-xl text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500/80 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-all shadow-inner"
              />
            </div>
          </div>

          {/* Right section: Dark Mode, Notifications, User info, Logout */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl hover:bg-white/60 dark:hover:bg-white/[0.08] transition-all hover:scale-105 active:scale-95 text-zinc-500 dark:text-zinc-400"
              title={settings.darkMode ? 'Giao diện sáng' : 'Giao diện tối'}
            >
              {settings.darkMode ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-xl hover:bg-white/60 dark:hover:bg-white/[0.08] transition-all hover:scale-105 active:scale-95 text-zinc-500 dark:text-zinc-400 relative"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-to-r from-orange-500 to-rose-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold shadow-[0_0_10px_rgba(249,115,22,0.6)]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 card p-0 shadow-2xl z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b border-slate-200/80 dark:border-white/[0.08] flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100">Thông báo</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 font-mono font-bold">
                      {unreadCount} mới
                    </span>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm text-zinc-500">
                      Không có thông báo mới
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                      {notifications.slice(0, 10).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={`p-3 cursor-pointer hover:bg-white/60 dark:hover:bg-white/[0.05] transition-colors ${
                            !n.isRead ? 'bg-orange-500/[0.06] dark:bg-orange-500/[0.08]' : ''
                          }`}
                        >
                          {n.senderName && (
                            <span className="text-[10px] uppercase font-bold text-orange-500 dark:text-orange-400 block mb-0.5">
                              {n.senderName}
                            </span>
                          )}
                          <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-zinc-100">{n.title}</p>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{n.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Profile Info & Logout */}
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200/70 dark:border-white/[0.08]">
              <button
                onClick={handleOpenProfileModal}
                className="flex items-center gap-2 group p-1 -m-1 rounded-xl hover:bg-white/60 dark:hover:bg-white/[0.08] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-left"
                title="Bấm để chỉnh sửa hồ sơ & thay avatar của bạn"
              >
                <div className="relative">
                  <Avatar
                    name={currentUser.name}
                    avatar={currentAvatar}
                    size="sm"
                    className="ring-2 ring-transparent group-hover:ring-orange-500/50 shadow-md transition-all"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#070709] shadow-sm" />
                </div>
                <div className="hidden sm:block text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-zinc-100 truncate max-w-[100px] lg:max-w-[130px] group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">
                      {currentUser.name}
                    </span>
                    {currentUser.role === 'admin' ? (
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-[10px] font-bold font-mono">
                        Admin
                      </span>
                    ) : currentUser.role === 'manager' ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold font-mono">
                        Quản lý
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-[10px] font-mono">
                        Nhân viên
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono leading-none flex items-center gap-1 mt-0.5">
                    <span>@{currentUser.username}</span>
                    <span className="text-[9px] text-orange-400 opacity-0 group-hover:opacity-100 transition-opacity">✏️ Sửa</span>
                  </div>
                </div>
              </button>

              {/* Logout button */}
              <button
                onClick={logout}
                className="p-1.5 rounded-xl hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 transition-all hover:scale-105 active:scale-95 ml-0.5 cursor-pointer"
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
        title="Hồ sơ cá nhân & Ảnh đại diện"
        size="md"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* Avatar Upload Box */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileChange}
            />

            <div
              className="relative group/avatar cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
              title="Nhấn để đổi ảnh đại diện"
            >
              <Avatar
                name={profileName || currentUser.name}
                avatar={profileAvatar}
                size="xl"
                className="ring-4 ring-white dark:ring-dark-800 shadow-lg"
              />
              <div className="absolute inset-0 bg-black/45 rounded-full flex flex-col items-center justify-center text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                <Camera className="w-5 h-5 mb-0.5" />
                <span className="text-[10px] font-semibold">Đổi ảnh</span>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left space-y-2">
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Ảnh đại diện nhân sự
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tự động nén thông minh (~20KB WebP) sắc nét, tuyệt đối an toàn và không làm đầy cơ sở dữ liệu.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressingAvatar}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isCompressingAvatar ? 'Đang nén ảnh...' : 'Tải ảnh từ máy'}
                </button>
                {profileAvatar && (
                  <button
                    type="button"
                    onClick={() => setProfileAvatar('')}
                    className="text-xs py-1.5 px-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa ảnh (dùng chữ cái)
                  </button>
                )}
              </div>

              {avatarError && (
                <p className="text-xs text-red-500 font-medium">{avatarError}</p>
              )}
            </div>
          </div>

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
            <GlassSelect
              value={profileRole}
              onChange={(v) => setProfileRole(v as TeamRole)}
              options={ROLE_OPTIONS}
            />
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
