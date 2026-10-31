import React, { useState } from 'react';
import {
  ShieldCheck, Bell, Megaphone, Send, Trash2, Building2,
  Sliders, Users, AlertTriangle, CheckCircle2, Lock, Save,
  Clock, DollarSign, Calendar, Camera, Briefcase, Download, Upload, Shield
} from 'lucide-react';
import { useStore } from '../store/useStore';
import type { CompanyInfo, Notification } from '../types';
import { formatCurrency, formatDate, daysUntil } from '../utils/helpers';
import GlassSelect from '../components/GlassSelect';

const NOTIF_TYPE_OPTIONS = [
  { value: 'announcement', label: 'Thông báo chung / Tin tức nội bộ', icon: '📢' },
  { value: 'deadline', label: 'Khẩn cấp / Deadline gấp', icon: '⚠️' },
  { value: 'reminder', label: 'Lịch quay / Họp chuẩn bị', icon: '⏰' },
  { value: 'equipment', label: 'Nhắc kiểm tra thiết bị', icon: '📷' },
  { value: 'payment', label: 'Cập nhật thanh toán dự án', icon: '💰' },
  { value: 'revision', label: 'Feedback / Revision khách hàng', icon: '🎞️' },
];

export default function AdminDashboard() {
  const {
    currentUser,
    settings,
    updateSettings,
    notifications,
    sendBroadcastNotification,
    deleteNotification,
    clearNotifications,
    users,
    projects,
    equipment,
    invoices,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'broadcast' | 'company' | 'rules' | 'users' | 'risks'>('broadcast');

  // Broadcast state
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<Notification['type']>('announcement');
  const [notifProjectId, setNotifProjectId] = useState<string>('');
  const [sendSuccess, setSendSuccess] = useState(false);

  // Company Form state
  const [companyForm, setCompanyForm] = useState<CompanyInfo>({ ...settings.companyInfo });
  const [companySaved, setCompanySaved] = useState(false);

  // Rules state
  const [taxRate, setTaxRate] = useState(settings.defaultTaxRate);
  const [maxRevisions, setMaxRevisions] = useState(settings.defaultMaxRevisions);
  const [rulesSaved, setRulesSaved] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="card p-8 text-center max-w-lg mx-auto mt-12">
        <div className="w-14 h-14 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Khu Vực Dành Riêng Cho Admin</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Bạn cần đăng nhập bằng tài khoản Quản Trị Viên (Admin) để truy cập Trung Tâm Điều Hành này.
        </p>
      </div>
    );
  }

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;

    sendBroadcastNotification(
      notifTitle.trim(),
      notifMessage.trim(),
      notifType,
      notifProjectId || null
    );

    setNotifTitle('');
    setNotifMessage('');
    setNotifProjectId('');
    setSendSuccess(true);
    setTimeout(() => setSendSuccess(false), 3000);
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({ companyInfo: companyForm });
    setCompanySaved(true);
    setTimeout(() => setCompanySaved(false), 2500);
  };

  const handleSaveRules = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      defaultTaxRate: Number(taxRate) || 0,
      defaultMaxRevisions: Number(maxRevisions) || 3,
    });
    setRulesSaved(true);
    setTimeout(() => setRulesSaved(false), 2500);
  };

  // High risk jobs (sắp đến hạn <= 5 ngày)
  const urgentProjects = projects.filter((p) => {
    if (p.status === 'Delivered' || p.status === 'Archived') return false;
    const days = daysUntil(p.deadline);
    return days <= 5;
  });

  // Gear not available
  const gearInUse = equipment.filter((e) => e.status === 'In Use');
  const unpaidInvoices = invoices.filter((i) => i.paymentStatus !== 'Paid');

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-purple-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300 shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">Trung Tâm Điều Hành Admin</h1>
                <span className="badge bg-purple-500/30 text-purple-200 border border-purple-400/30 text-[10px] font-bold">
                  MASTER CONTROL
                </span>
              </div>
              <p className="text-xs text-purple-200/80 mt-0.5">
                Bảng điều khiển tối cao dành riêng cho <strong>{currentUser?.name}</strong> • Tùy chỉnh thông báo, pháp nhân & cấu hình
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur border border-white/10 text-center">
              <div className="text-xs text-purple-200 font-medium">Tài khoản</div>
              <div className="text-lg font-bold">{users.length}</div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur border border-white/10 text-center">
              <div className="text-xs text-purple-200 font-medium">Thông báo</div>
              <div className="text-lg font-bold">{notifications.length}</div>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-white/10 backdrop-blur border border-white/10 text-center">
              <div className="text-xs text-purple-200 font-medium">Dự án gấp</div>
              <div className="text-lg font-bold text-amber-300">{urgentProjects.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-dark-700 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('broadcast')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'broadcast'
              ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Phát Thông Báo Toàn Team</span>
          {notifications.length > 0 && (
            <span className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${activeTab === 'broadcast' ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-dark-700'}`}>
              {notifications.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'company'
              ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Thông Tin Doanh Nghiệp & Bank</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'rules'
              ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Quy Tắc Sản Xuất & Hợp Đồng</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'users'
              ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>3 Cấp Bậc Quyền Hạn</span>
        </button>

        <button
          onClick={() => setActiveTab('risks')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all whitespace-nowrap ${
            activeTab === 'risks'
              ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Giám Sát Rủi Ro & Vận Hành</span>
        </button>
      </div>

      {/* Tab 1: Broadcast Notification Center */}
      {activeTab === 'broadcast' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Send Box */}
          <div className="lg:col-span-2 card p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-700 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-950/40 text-primary-600">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
                    Soạn & Bắn Thông Báo Khẩn Cho Toàn Team
                  </h2>
                  <p className="text-xs text-gray-400">
                    Thông báo này sẽ xuất hiện ngay lập tức trên icon chuông của tất cả anh em
                  </p>
                </div>
              </div>
            </div>

            {sendSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>Đã phát thông báo thành công đến toàn bộ thành viên Artdict Media!</span>
              </div>
            )}

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              <div>
                <label className="label">Tiêu đề thông báo *</label>
                <input
                  type="text"
                  value={notifTitle}
                  onChange={(e) => setNotifTitle(e.target.value)}
                  placeholder="VD: [GẤP] Họp toàn bộ ekip chốt thiết bị đi quay Bảo Lộc chiều nay"
                  className="input w-full font-medium"
                  required
                />
              </div>

              <div>
                <label className="label">Nội dung chi tiết *</label>
                <textarea
                  rows={4}
                  value={notifMessage}
                  onChange={(e) => setNotifMessage(e.target.value)}
                  placeholder="Nhập thông tin thời gian, địa điểm, dặn dò pin, thẻ nhớ, chuẩn bị gear..."
                  className="textarea w-full"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Loại thông báo</label>
                  <GlassSelect
                    value={notifType}
                    onChange={(val) => setNotifType(val as any)}
                    options={NOTIF_TYPE_OPTIONS}
                    placeholder="Chọn loại thông báo..."
                  />
                </div>

                <div>
                  <label className="label">Gắn với dự án (tùy chọn)</label>
                  <GlassSelect
                    value={notifProjectId}
                    onChange={(val) => setNotifProjectId(val)}
                    options={[
                      { value: '', label: '-- Toàn công ty (Không gắn dự án cụ thể) --', icon: '🏢' },
                      ...projects.map((p) => ({
                        value: p.id,
                        label: p.name,
                        icon: '🎬',
                        badge: p.status,
                      })),
                    ]}
                    placeholder="Chọn dự án liên quan..."
                  />
                </div>
              </div>

              <div className="pt-2">
                <button type="submit" className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  <span>Phát thông báo ngay lập tức</span>
                </button>
              </div>
            </form>
          </div>

          {/* Sent Notifications History */}
          <div className="card p-6 flex flex-col h-[520px]">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-dark-700 mb-3">
              <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-primary-500" />
                <span>Hộp thông báo hiện tại ({notifications.length})</span>
              </h3>
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa hết</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {notifications.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-xs">
                  Chưa có thông báo nào được lưu trữ
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-xl border border-gray-100 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-800/40 hover:bg-white dark:hover:bg-dark-800 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-primary-600 dark:text-primary-400 block mb-0.5">
                          {n.senderName ? `Phát bởi: ${n.senderName}` : 'Hệ thống'}
                        </span>
                        <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100 line-clamp-1">
                          {n.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-gray-400 mt-1 block">
                          {formatDate(n.createdAt)}
                        </span>
                      </div>
                      <button
                        onClick={() => deleteNotification(n.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all shrink-0"
                        title="Xóa thông báo này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Company & Bank Info */}
      {activeTab === 'company' && (
        <div className="card p-6 max-w-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-700 pb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary-600" />
                <span>Thông Tin Pháp Nhân & Tài Khoản Ngân Hàng</span>
              </h2>
              <p className="text-xs text-gray-400">
                Thông tin này sẽ tự động xuất hiện trên tất cả Invoice PDF gửi khách hàng
              </p>
            </div>
            {companySaved && (
              <span className="badge bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs font-bold animate-pulse">
                ✓ Đã cập nhật
              </span>
            )}
          </div>

          <form onSubmit={handleSaveCompany} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Tên công ty / Studio *</label>
                <input
                  type="text"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="label">Mã số thuế</label>
                <input
                  type="text"
                  value={companyForm.taxId}
                  onChange={(e) => setCompanyForm({ ...companyForm, taxId: e.target.value })}
                  className="input w-full font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="label">Địa chỉ trụ sở</label>
                <input
                  type="text"
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="label">Hotline liên hệ</label>
                <input
                  type="text"
                  value={companyForm.phone}
                  onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="label">Email doanh nghiệp</label>
                <input
                  type="email"
                  value={companyForm.email}
                  onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                  className="input w-full"
                />
              </div>
            </div>

            {/* Bank details */}
            <div className="pt-4 border-t border-gray-100 dark:border-dark-700">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Tài Khoản Nhận Thanh Toán Hợp Đồng</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">Ngân hàng</label>
                  <input
                    type="text"
                    value={companyForm.bankName}
                    onChange={(e) => setCompanyForm({ ...companyForm, bankName: e.target.value })}
                    className="input w-full"
                    placeholder="VD: Techcombank"
                  />
                </div>
                <div>
                  <label className="label">Số tài khoản</label>
                  <input
                    type="text"
                    value={companyForm.bankAccount}
                    onChange={(e) => setCompanyForm({ ...companyForm, bankAccount: e.target.value })}
                    className="input w-full font-mono font-bold text-primary-600"
                    placeholder="19036789160707"
                  />
                </div>
                <div>
                  <label className="label">Tên chủ tài khoản</label>
                  <input
                    type="text"
                    value={companyForm.bankAccountName}
                    onChange={(e) => setCompanyForm({ ...companyForm, bankAccountName: e.target.value })}
                    className="input w-full uppercase"
                    placeholder="CONG TY TNHH ARTDICT MEDIA"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                <span>Lưu thông tin công ty</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Production System Rules */}
      {activeTab === 'rules' && (
        <div className="card p-6 max-w-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-700 pb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-primary-600" />
                <span>Quy Tắc Vận Hành Hợp Đồng & Dự Án</span>
              </h2>
              <p className="text-xs text-gray-400">
                Thiết lập các tiêu chuẩn áp dụng tự động cho báo giá, hợp đồng và tiến độ
              </p>
            </div>
            {rulesSaved && (
              <span className="badge bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs font-bold animate-pulse">
                ✓ Đã lưu quy tắc
              </span>
            )}
          </div>

          <form onSubmit={handleSaveRules} className="space-y-5">
            <div>
              <label className="label font-semibold">Thuế GTGT (VAT) mặc định (%)</label>
              <input
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                min="0"
                max="100"
                className="input w-48 font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">
                Tỷ lệ thuế VAT tự động tính khi khởi tạo hóa đơn mới (thường là 8% hoặc 10%)
              </p>
            </div>

            <div>
              <label className="label font-semibold">Số lần chỉnh sửa (Revision) miễn phí tối đa</label>
              <input
                type="number"
                value={maxRevisions}
                onChange={(e) => setMaxRevisions(Number(e.target.value))}
                min="1"
                max="10"
                className="input w-48 font-mono"
              />
              <p className="text-xs text-gray-400 mt-1">
                Hệ thống sẽ hiện cảnh báo đỏ nếu khách hàng yêu cầu sửa video vượt quá số lần thỏa thuận trong hợp đồng
              </p>
            </div>

            <div className="pt-2">
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                <span>Lưu cấu hình quy tắc</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 4: 3-Tier User Role Overview */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-5 border-l-4 border-l-purple-500">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold mb-1">
                <ShieldCheck className="w-5 h-5" />
                <span>Cấp 1: Quản Trị Viên (Admin)</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Toàn quyền hệ thống, bắn thông báo toàn team, sửa thông tin công ty, quản lý tài khoản.
              </p>
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {users.filter((u) => u.role === 'admin').length} tài khoản
              </div>
            </div>

            <div className="card p-5 border-l-4 border-l-amber-500">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold mb-1">
                <Shield className="w-5 h-5" />
                <span>Cấp 2: Người Quản Lý (Manager)</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Trưởng nhóm / PM, điều phối dự án, chỉ định nhân sự, duyệt tiến độ dựng, kiểm tra gear.
              </p>
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {users.filter((u) => u.role === 'manager').length} tài khoản
              </div>
            </div>

            <div className="card p-5 border-l-4 border-l-blue-500">
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold mb-1">
                <Users className="w-5 h-5" />
                <span>Cấp 3: Nhân Viên (Employee)</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Ekip thực hiện (DOP, Editor, Sound...), chỉ thao tác trên các phần việc được cấp phép.
              </p>
              <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                {users.filter((u) => u.role === 'employee').length} tài khoản
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4">
              Danh sách tài khoản & Phân quyền trực thuộc Artdict Media
            </h3>
            <div className="divide-y divide-gray-100 dark:divide-dark-800">
              {users.map((u) => (
                <div key={u.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      <span>{u.name}</span>
                      <span className="font-mono text-xs text-gray-400">(@{u.username})</span>
                      {u.isProtected && (
                        <span className="badge bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-[10px] font-bold">
                          Master
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {u.role === 'admin' ? 'Quản trị viên tối cao' : u.role === 'manager' ? 'Người quản lý dự án (PM)' : 'Nhân viên ekip'}
                    </div>
                  </div>
                  <div>
                    <span
                      className={`badge text-xs font-bold ${
                        u.role === 'admin'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                          : u.role === 'manager'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}
                    >
                      {u.role === 'admin' ? 'Admin' : u.role === 'manager' ? 'Quản lý' : 'Nhân viên'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Risk Monitoring */}
      {activeTab === 'risks' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Urgent Deadlines (<= 5 ngày) */}
            <div className="card p-5 border-t-4 border-t-red-500">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-red-500" />
                  <span>Dự án sắp đến hạn (&le; 5 ngày)</span>
                </h3>
                <span className="badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs font-bold">
                  {urgentProjects.length}
                </span>
              </div>
              <div className="space-y-2">
                {urgentProjects.length === 0 ? (
                  <p className="text-xs text-gray-400 py-3 text-center">Không có dự án nào bị gấp</p>
                ) : (
                  urgentProjects.map((p) => (
                    <div key={p.id} className="p-2.5 rounded-lg bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-xs">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{p.name}</div>
                      <div className="text-red-600 dark:text-red-400 mt-0.5">
                        Hạn chót: {formatDate(p.deadline)} ({daysUntil(p.deadline)} ngày còn lại)
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Gear in use */}
            <div className="card p-5 border-t-4 border-t-amber-500">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-amber-500" />
                  <span>Thiết bị đang xuất kho</span>
                </h3>
                <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 text-xs font-bold">
                  {gearInUse.length}
                </span>
              </div>
              <div className="space-y-2">
                {gearInUse.length === 0 ? (
                  <p className="text-xs text-gray-400 py-3 text-center">Tất cả gear đã về kho</p>
                ) : (
                  gearInUse.map((e) => (
                    <div key={e.id} className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{e.name}</div>
                      <div className="text-amber-700 dark:text-amber-300 mt-0.5">
                        Model: {e.model} • SN: {e.serialNumber}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Unpaid invoices */}
            <div className="card p-5 border-t-4 border-t-blue-500">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-blue-500" />
                  <span>Hóa đơn chưa thanh toán</span>
                </h3>
                <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-bold">
                  {unpaidInvoices.length}
                </span>
              </div>
              <div className="space-y-2">
                {unpaidInvoices.length === 0 ? (
                  <p className="text-xs text-gray-400 py-3 text-center">Không có hóa đơn nợ</p>
                ) : (
                  unpaidInvoices.map((i) => (
                    <div key={i.id} className="p-2.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{i.invoiceNumber}</div>
                      <div className="text-blue-700 dark:text-blue-300 mt-0.5">
                        Tổng tiền: {formatCurrency(i.total)} ({i.paymentStatus === 'Partial' ? 'Đã cọc 50%' : 'Chưa thanh toán'})
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
