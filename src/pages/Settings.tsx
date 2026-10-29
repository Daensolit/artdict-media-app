import React, { useState, useRef } from 'react';
import {
  Building2, Save, Sun, Moon, Upload, Download,
  Trash2, Info, Database, Settings as SettingsIcon,
  Image as ImageIcon, AlertTriangle, Lock, Shield,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import Modal from '../components/Modal';
import type { CompanyInfo } from '../types';

export default function Settings() {
  const { settings, updateSettings, currentUser } = useStore();
  const isAdmin = currentUser?.role === 'admin';

  // ---------- Company Info ----------
  const [companyForm, setCompanyForm] = useState<CompanyInfo>({ ...settings.companyInfo });
  const [companySaved, setCompanySaved] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleCompanyChange = (field: keyof CompanyInfo, value: string) => {
    setCompanyForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      handleCompanyChange('logo', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const saveCompanyInfo = () => {
    updateSettings({ companyInfo: companyForm });
    setCompanySaved(true);
    setTimeout(() => setCompanySaved(false), 2000);
  };

  // ---------- App Settings ----------
  const toggleDarkMode = () => {
    const newDark = !settings.darkMode;
    updateSettings({ darkMode: newDark });
    if (newDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleTaxRate = (val: string) => {
    const n = parseFloat(val);
    if (!isNaN(n) && n >= 0) updateSettings({ defaultTaxRate: n });
  };

  const handleMaxRevisions = (val: string) => {
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 0) updateSettings({ defaultMaxRevisions: n });
  };

  const handleCurrency = (val: string) => {
    updateSettings({ currency: val });
  };

  // ---------- Data Management ----------
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const state = useStore.getState();
    const data = {
      projects: state.projects,
      clients: state.clients,
      teamMembers: state.teamMembers,
      equipment: state.equipment,
      equipmentChecklists: state.equipmentChecklists,
      calendarEvents: state.calendarEvents,
      postProductionTasks: state.postProductionTasks,
      revisions: state.revisions,
      expenses: state.expenses,
      invoices: state.invoices,
      notifications: state.notifications,
      shotListItems: state.shotListItems,
      settings: state.settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `media-team-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        const state = useStore.getState();
        // Restore all slices that exist in the backup
        if (data.projects) state.projects = data.projects;
        if (data.clients) state.clients = data.clients;
        if (data.teamMembers) state.teamMembers = data.teamMembers;
        if (data.equipment) state.equipment = data.equipment;
        if (data.equipmentChecklists) state.equipmentChecklists = data.equipmentChecklists;
        if (data.calendarEvents) state.calendarEvents = data.calendarEvents;
        if (data.postProductionTasks) state.postProductionTasks = data.postProductionTasks;
        if (data.revisions) state.revisions = data.revisions;
        if (data.expenses) state.expenses = data.expenses;
        if (data.invoices) state.invoices = data.invoices;
        if (data.notifications) state.notifications = data.notifications;
        if (data.shotListItems) state.shotListItems = data.shotListItems;
        if (data.settings) state.settings = { ...state.settings, ...data.settings };

        // Force Zustand to re-render by calling setState
        useStore.setState({ ...data });
        alert('Import dữ liệu thành công!');
      } catch {
        alert('Lỗi: File không hợp lệ.');
      }
    };
    reader.readAsText(file);
    // reset so same file can be re-imported
    e.target.value = '';
  };

  const handleClearAll = () => {
    useStore.setState({
      projects: [],
      clients: [],
      teamMembers: [],
      equipment: [],
      equipmentChecklists: [],
      calendarEvents: [],
      postProductionTasks: [],
      revisions: [],
      expenses: [],
      invoices: [],
      notifications: [],
      shotListItems: [],
    });
    setShowClearConfirm(false);
  };

  // ---------- render ----------
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Cài đặt</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Tùy chỉnh thông tin công ty và ứng dụng
        </p>
      </div>

      {/* =================== Section 1: Company Info =================== */}
      <section className="card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Building2 className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold">Thông tin công ty</h2>
          </div>
          {!isAdmin && (
            <span className="badge bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-xs flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" />
              Chế độ chỉ xem
            </span>
          )}
        </div>

        {!isAdmin && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Chỉ Quản trị viên (Admin) mới có quyền chỉnh sửa thông tin pháp nhân và số tài khoản ngân hàng của Artdict Media.</span>
          </div>
        )}

        {/* Logo */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 dark:border-dark-600 flex items-center justify-center overflow-hidden bg-gray-50 dark:bg-dark-800">
            {companyForm.logo ? (
              <img src={companyForm.logo} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <ImageIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            )}
          </div>
          {isAdmin ? (
            <div>
              <button
                className="btn-secondary text-sm flex items-center gap-1.5"
                onClick={() => logoInputRef.current?.click()}
              >
                <Upload className="w-4 h-4" />
                Tải logo
              </button>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <p className="text-xs text-gray-400 mt-1">PNG, JPG. Khuyến nghị 200×200px</p>
            </div>
          ) : (
            <p className="text-xs text-gray-400">Logo thương hiệu chính thức của công ty</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Tên công ty</label>
            <input
              className="input w-full disabled:bg-gray-100 disabled:dark:bg-dark-800 disabled:cursor-not-allowed disabled:text-gray-500"
              value={companyForm.name}
              disabled={!isAdmin}
              onChange={(e) => handleCompanyChange('name', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Mã số thuế</label>
            <input
              className="input w-full disabled:bg-gray-100 disabled:dark:bg-dark-800 disabled:cursor-not-allowed disabled:text-gray-500"
              value={companyForm.taxId}
              disabled={!isAdmin}
              onChange={(e) => handleCompanyChange('taxId', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Địa chỉ</label>
            <input
              className="input w-full disabled:bg-gray-100 disabled:dark:bg-dark-800 disabled:cursor-not-allowed disabled:text-gray-500"
              value={companyForm.address}
              disabled={!isAdmin}
              onChange={(e) => handleCompanyChange('address', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Số điện thoại</label>
            <input
              className="input w-full disabled:bg-gray-100 disabled:dark:bg-dark-800 disabled:cursor-not-allowed disabled:text-gray-500"
              value={companyForm.phone}
              disabled={!isAdmin}
              onChange={(e) => handleCompanyChange('phone', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              className="input w-full disabled:bg-gray-100 disabled:dark:bg-dark-800 disabled:cursor-not-allowed disabled:text-gray-500"
              type="email"
              value={companyForm.email}
              disabled={!isAdmin}
              onChange={(e) => handleCompanyChange('email', e.target.value)}
            />
          </div>
          <div>
            <label className="label">Website</label>
            <input
              className="input w-full disabled:bg-gray-100 disabled:dark:bg-dark-800 disabled:cursor-not-allowed disabled:text-gray-500"
              value={companyForm.website}
              disabled={!isAdmin}
              onChange={(e) => handleCompanyChange('website', e.target.value)}
            />
          </div>
        </div>

        {/* Bank info */}
        <div className="border-t border-gray-100 dark:border-dark-700 pt-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Thông tin ngân hàng
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Ngân hàng</label>
              <input
                className="input w-full disabled:bg-gray-100 disabled:dark:bg-dark-800 disabled:cursor-not-allowed disabled:text-gray-500"
                value={companyForm.bankName}
                disabled={!isAdmin}
                onChange={(e) => handleCompanyChange('bankName', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Số tài khoản</label>
              <input
                className="input w-full disabled:bg-gray-100 disabled:dark:bg-dark-800 disabled:cursor-not-allowed disabled:text-gray-500"
                value={companyForm.bankAccount}
                disabled={!isAdmin}
                onChange={(e) => handleCompanyChange('bankAccount', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Tên tài khoản</label>
              <input
                className="input w-full disabled:bg-gray-100 disabled:dark:bg-dark-800 disabled:cursor-not-allowed disabled:text-gray-500"
                value={companyForm.bankAccountName}
                disabled={!isAdmin}
                onChange={(e) => handleCompanyChange('bankAccountName', e.target.value)}
              />
            </div>
          </div>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-3 pt-2">
            <button className="btn-primary flex items-center gap-2" onClick={saveCompanyInfo}>
              <Save className="w-4 h-4" />
              Lưu thông tin
            </button>
            {companySaved && (
              <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium animate-pulse">
                ✓ Đã lưu
              </span>
            )}
          </div>
        )}
      </section>

      {/* =================== Section 2: App Settings =================== */}
      <section className="card p-6 space-y-5">
        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <SettingsIcon className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Cài đặt ứng dụng</h2>
        </div>

        <div className="space-y-4">
          {/* Dark mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.darkMode ? (
                <Moon className="w-5 h-5 text-indigo-500" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500" />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Chế độ tối</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {settings.darkMode ? 'Đang bật' : 'Đang tắt'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleDarkMode}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.darkMode ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-dark-600'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.darkMode ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="label">Thuế mặc định (%)</label>
              <input
                className="input w-full"
                type="number"
                min="0"
                step="0.5"
                value={settings.defaultTaxRate}
                onChange={(e) => handleTaxRate(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Số lần duyệt tối đa</label>
              <input
                className="input w-full"
                type="number"
                min="1"
                value={settings.defaultMaxRevisions}
                onChange={(e) => handleMaxRevisions(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Đơn vị tiền tệ</label>
              <select
                className="select w-full"
                value={settings.currency}
                onChange={(e) => handleCurrency(e.target.value)}
              >
                <option value="VND">VND - Việt Nam Đồng</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* =================== Section 3: Data Management =================== */}
      <section className="card p-6 space-y-5">
        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Database className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Quản lý dữ liệu</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Export */}
          <button
            className="btn-secondary flex items-center justify-center gap-2 py-3"
            onClick={handleExport}
          >
            <Download className="w-4 h-4" />
            Xuất dữ liệu (JSON)
          </button>

          {/* Import */}
          <button
            className="btn-secondary flex items-center justify-center gap-2 py-3"
            onClick={() => importInputRef.current?.click()}
          >
            <Upload className="w-4 h-4" />
            Nhập dữ liệu (JSON)
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />

          {/* Clear */}
          <button
            className="btn-danger flex items-center justify-center gap-2 py-3"
            onClick={() => setShowClearConfirm(true)}
          >
            <Trash2 className="w-4 h-4" />
            Xóa toàn bộ dữ liệu
          </button>
        </div>
      </section>

      {/* =================== Section 4: About =================== */}
      <section className="card p-6 space-y-3">
        <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
          <Info className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Giới thiệu</h2>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p>
            <span className="font-bold text-gray-900 dark:text-gray-100">
              Artdict Media Production Suite
            </span>{' '}
            — Hệ thống quản lý toàn diện đội ngũ sản xuất media
          </p>
          <p>Phiên bản: <span className="font-medium text-gray-900 dark:text-gray-100">1.0.0</span></p>
          <p>
            Xây dựng với React 18, TypeScript, TailwindCSS, Zustand & SQLite ready.
          </p>
          <p className="text-gray-400 dark:text-gray-500 pt-1">
            © {new Date().getFullYear()} Artdict Media. Bản quyền thuộc về Artdict Media.
          </p>
        </div>
      </section>

      {/* Clear Data Confirmation Modal */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Xóa toàn bộ dữ liệu"
        size="sm"
      >
        <div className="flex items-start gap-3 mb-6">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-gray-700 dark:text-gray-300 font-medium">
              Bạn có chắc chắn?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Tất cả dự án, khách hàng, nhân sự, thiết bị, hóa đơn và dữ liệu khác sẽ bị xóa
              vĩnh viễn. Hành động này không thể hoàn tác.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <button className="btn-secondary" onClick={() => setShowClearConfirm(false)}>
            Hủy
          </button>
          <button className="btn-danger" onClick={handleClearAll}>
            Xóa tất cả
          </button>
        </div>
      </Modal>
    </div>
  );
}
