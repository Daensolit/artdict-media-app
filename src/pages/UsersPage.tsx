import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, UserPlus, Lock, Check, X, Key, Trash2, Edit2, AlertCircle, Shield } from 'lucide-react';
import { useStore } from '../store/useStore';
import Modal from '../components/Modal';
import Avatar from '../components/Avatar';
import type { User, UserRole, UserPermissions } from '../types';
import { generateId, getAvatarColor, getInitials } from '../utils/helpers';

const defaultPermissions: UserPermissions = {
  canManageProjects: true,
  canManageTeam: false,
  canManageEquipment: true,
  canManageFinance: false,
  canManageClients: false,
  canManageUsers: false,
};

const managerPermissions: UserPermissions = {
  canManageProjects: true,
  canManageTeam: true,
  canManageEquipment: true,
  canManageFinance: true,
  canManageClients: true,
  canManageUsers: false,
};

const adminPermissions: UserPermissions = {
  canManageProjects: true,
  canManageTeam: true,
  canManageEquipment: true,
  canManageFinance: true,
  canManageClients: true,
  canManageUsers: true,
};

export default function UsersPage() {
  const { users, currentUser, teamMembers, addUser, updateUser, deleteUser } = useStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('employee');
  const [teamMemberId, setTeamMemberId] = useState('');
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissions);

  const isAdmin = currentUser?.role === 'admin';

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setName('');
    setRole('employee');
    setTeamMemberId('');
    setPermissions(defaultPermissions);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setUsername(user.username);
    setPassword(user.password);
    setRole(user.role);
    setTeamMemberId(user.teamMemberId || '');
    setPermissions(user.permissions);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
    if (newRole === 'admin') {
      setPermissions(adminPermissions);
    } else if (newRole === 'manager') {
      setPermissions(managerPermissions);
    } else {
      setPermissions(defaultPermissions);
    }
  };

  const handleTogglePermission = (key: keyof UserPermissions) => {
    if (editingUser?.username === 'daensolit' || editingUser?.isProtected) return;
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username.trim() || !password.trim() || !name.trim()) {
      setErrorMsg('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const newUser: User = {
      id: generateId(),
      username: username.trim().toLowerCase(),
      password: password.trim(),
      name: name.trim(),
      role,
      permissions: role === 'admin' ? adminPermissions : permissions,
      isProtected: false,
      isActive: true,
      teamMemberId: teamMemberId || undefined,
      createdAt: new Date().toISOString(),
    };

    const res = addUser(newUser);
    if (!res.success) {
      setErrorMsg(res.message || 'Không thể tạo tài khoản');
      return;
    }

    setIsAddModalOpen(false);
    resetForm();
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setErrorMsg('');

    // Nếu là daensolit, không cho phép đổi role hay phân quyền
    if (editingUser.username === 'daensolit' || editingUser.isProtected) {
      const res = updateUser(editingUser.id, {
        name: name.trim(),
        password: password.trim(),
      });
      if (res.success) {
        setEditingUser(null);
      } else {
        setErrorMsg(res.message || 'Lỗi cập nhật');
      }
      return;
    }

    const res = updateUser(editingUser.id, {
      name: name.trim(),
      password: password.trim(),
      role,
      teamMemberId: teamMemberId || undefined,
      permissions: role === 'admin' ? adminPermissions : permissions,
    });

    if (res.success) {
      setEditingUser(null);
    } else {
      setErrorMsg(res.message || 'Lỗi cập nhật');
    }
  };

  const handleDeleteUser = () => {
    if (!deleteConfirmUser) return;
    const res = deleteUser(deleteConfirmUser.id);
    if (!res.success) {
      alert(res.message);
    }
    setDeleteConfirmUser(null);
  };

  // If user is not admin
  if (!isAdmin) {
    return (
      <div className="card p-8 text-center max-w-lg mx-auto mt-12">
        <div className="w-14 h-14 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Quyền Truy Cập Bị Hạn Chế</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Chỉ có tài khoản quyền Quản Trị Viên (Admin) mới có thẩm quyền quản lý tài khoản và phân quyền nhân viên.
        </p>
        <div className="p-3 bg-gray-50 dark:bg-dark-800 rounded-xl text-xs text-gray-400">
          Tài khoản hiện tại của bạn: <strong>{currentUser?.name}</strong> ({currentUser?.role === 'employee' ? 'Nhân viên' : 'Admin'})
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-primary-600" />
            <span>Quản Lý Tài Khoản & Phân Quyền</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản trị viên có toàn quyền cấp tài khoản, phân chia vai trò và quyền hạn cho các anh em trong team.
          </p>
        </div>

        <button onClick={handleOpenAddModal} className="btn-primary">
          <UserPlus className="w-4 h-4" />
          <span>Tạo tài khoản mới</span>
        </button>
      </div>

      {/* Info Notice about Master Admin daensolit */}
      <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
        <Shield className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <p className="font-bold">Đặc quyền bảo mật hệ thống Artdict Media:</p>
          <p>
            Tài khoản quản trị tối cao <strong className="font-mono bg-amber-200/50 dark:bg-amber-900/50 px-1.5 py-0.5 rounded">daensolit</strong> được bảo vệ vĩnh viễn: không thể bị xóa, không thể bị khóa, và luôn giữ quyền Admin cao nhất. Mọi tài khoản khác có thể phân quyền linh hoạt theo nhu cầu công việc.
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-dark-700 bg-gray-50/50 dark:bg-dark-800/50">
                <th className="table-header">Thành viên / Username</th>
                <th className="table-header">Loại tài khoản</th>
                <th className="table-header">Quyền hạn chi tiết</th>
                <th className="table-header">Trạng thái</th>
                <th className="table-header text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-dark-800">
              {users.map((u) => {
                const isDaensolit = u.username === 'daensolit' || u.isProtected;
                const memberAvatar = teamMembers.find((m) => m.id === u.teamMemberId || m.name.toLowerCase() === u.name.toLowerCase())?.avatar || u.avatar;

                return (
                  <tr key={u.id} className="hover:bg-gray-50/60 dark:hover:bg-dark-800/40 transition-colors">
                    {/* User info */}
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} avatar={memberAvatar} size="sm" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900 dark:text-gray-100">{u.name}</span>
                            {isDaensolit && (
                              <span className="badge bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-[10px] flex items-center gap-1 font-bold">
                                <Shield className="w-3 h-3 text-amber-600" />
                                Master
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 font-mono">@{u.username}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="table-cell">
                      {u.role === 'admin' ? (
                        <span className="badge bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 font-bold flex items-center gap-1 w-max">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Admin (Quản trị)
                        </span>
                      ) : u.role === 'manager' ? (
                        <span className="badge bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-bold flex items-center gap-1 w-max">
                          <Shield className="w-3.5 h-3.5 text-amber-600" />
                          Người quản lý (PM)
                        </span>
                      ) : (
                        <span className="badge bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium flex items-center gap-1 w-max">
                          Nhân viên
                        </span>
                      )}
                    </td>

                    {/* Permissions summary */}
                    <td className="table-cell">
                      {u.role === 'admin' ? (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          Toàn quyền hệ thống
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {u.permissions.canManageProjects && (
                            <span className="px-2 py-0.5 rounded text-[11px] bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300">
                              Dự án
                            </span>
                          )}
                          {u.permissions.canManageEquipment && (
                            <span className="px-2 py-0.5 rounded text-[11px] bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300">
                              Thiết bị
                            </span>
                          )}
                          {u.permissions.canManageTeam && (
                            <span className="px-2 py-0.5 rounded text-[11px] bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300">
                              Nhân sự
                            </span>
                          )}
                          {u.permissions.canManageFinance && (
                            <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium">
                              Tài chính
                            </span>
                          )}
                          {u.permissions.canManageClients && (
                            <span className="px-2 py-0.5 rounded text-[11px] bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300">
                              Khách hàng
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="table-cell">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          Đã khóa
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-500 hover:text-primary-600 transition-colors"
                          title="Chỉnh sửa tài khoản"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {!isDaensolit ? (
                          <button
                            onClick={() => setDeleteConfirmUser(u)}
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors"
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span
                            className="p-1.5 text-gray-300 dark:text-dark-600 cursor-not-allowed"
                            title="Tài khoản daensolit không thể xóa"
                          >
                            <Lock className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add User */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tạo tài khoản mới cho team"
        size="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="label">Họ và tên *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Nguyễn Văn A (Editor)"
              className="input"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tên đăng nhập (username) *</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="VD: nguyenvana"
                className="input font-mono text-sm"
                required
              />
            </div>
            <div>
              <label className="label">Mật khẩu *</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                className="input font-mono text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Loại tài khoản *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleRoleChange('employee')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  role === 'employee'
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-900 dark:text-primary-200 ring-2 ring-primary-500/20'
                    : 'border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800'
                }`}
              >
                <div className="font-semibold text-sm">Nhân viên</div>
                <div className="text-[11px] text-gray-500 mt-0.5">Theo phân quyền chỉ định</div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('manager')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  role === 'manager'
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                    : 'border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800'
                }`}
              >
                <div className="font-semibold text-sm flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  <span>Quản lý (PM)</span>
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">Điều phối dự án & team</div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleChange('admin')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  role === 'admin'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/20'
                    : 'border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800'
                }`}
              >
                <div className="font-semibold text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Admin</span>
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">Toàn quyền hệ thống</div>
              </button>
            </div>
          </div>

          {/* Phân quyền chi tiết cho nhân viên */}
          {role === 'employee' && (
            <div className="border border-gray-200 dark:border-dark-700 rounded-xl p-4 bg-gray-50/50 dark:bg-dark-800/40 space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                Cấp quyền truy cập các module:
              </p>

              <label className="flex items-center justify-between text-sm cursor-pointer p-1.5 hover:bg-white dark:hover:bg-dark-700 rounded-lg">
                <span>Quản lý Dự án & Tiến độ</span>
                <input
                  type="checkbox"
                  checked={permissions.canManageProjects}
                  onChange={() => handleTogglePermission('canManageProjects')}
                  className="rounded text-primary-600"
                />
              </label>

              <label className="flex items-center justify-between text-sm cursor-pointer p-1.5 hover:bg-white dark:hover:bg-dark-700 rounded-lg">
                <span>Quản lý Thiết bị & Gear Checklist</span>
                <input
                  type="checkbox"
                  checked={permissions.canManageEquipment}
                  onChange={() => handleTogglePermission('canManageEquipment')}
                  className="rounded text-primary-600"
                />
              </label>

              <label className="flex items-center justify-between text-sm cursor-pointer p-1.5 hover:bg-white dark:hover:bg-dark-700 rounded-lg">
                <span>Quản lý Nhân sự / Call Sheet</span>
                <input
                  type="checkbox"
                  checked={permissions.canManageTeam}
                  onChange={() => handleTogglePermission('canManageTeam')}
                  className="rounded text-primary-600"
                />
              </label>

              <label className="flex items-center justify-between text-sm cursor-pointer p-1.5 hover:bg-white dark:hover:bg-dark-700 rounded-lg">
                <span className="font-medium text-emerald-600 dark:text-emerald-400">Quản lý Tài chính & Xuất Invoice</span>
                <input
                  type="checkbox"
                  checked={permissions.canManageFinance}
                  onChange={() => handleTogglePermission('canManageFinance')}
                  className="rounded text-emerald-600"
                />
              </label>

              <label className="flex items-center justify-between text-sm cursor-pointer p-1.5 hover:bg-white dark:hover:bg-dark-700 rounded-lg">
                <span>Quản lý Danh bạ Khách hàng</span>
                <input
                  type="checkbox"
                  checked={permissions.canManageClients}
                  onChange={() => handleTogglePermission('canManageClients')}
                  className="rounded text-primary-600"
                />
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-dark-700">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary">
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              Tạo tài khoản
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit User */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={editingUser ? `Chỉnh sửa tài khoản @${editingUser.username}` : ''}
        size="md"
      >
        {editingUser && (
          <form onSubmit={handleUpdateUser} className="space-y-4">
            {editingUser.username === 'daensolit' && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 rounded-xl text-xs flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500 shrink-0" />
                <span>
                  Đây là tài khoản <strong>Master Admin daensolit</strong>. Phân quyền và vai trò Admin được khóa cố định nhằm đảm bảo an toàn hệ thống.
                </span>
              </div>
            )}

            <div>
              <label className="label">Họ và tên *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Username</label>
                <input
                  type="text"
                  value={username}
                  disabled
                  className="input font-mono text-sm bg-gray-100 dark:bg-dark-800 cursor-not-allowed opacity-70"
                />
              </div>
              <div>
                <label className="label">Mật khẩu</label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input font-mono text-sm"
                  required
                />
              </div>
            </div>

            {/* Role switch - Only for non-daensolit */}
            {editingUser.username !== 'daensolit' && !editingUser.isProtected && (
              <div>
                <label className="label">Loại tài khoản</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleRoleChange('employee')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      role === 'employee'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30 text-primary-900 dark:text-primary-200 ring-2 ring-primary-500/20'
                        : 'border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800'
                    }`}
                  >
                    <div className="font-semibold text-sm">Nhân viên</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('manager')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      role === 'manager'
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                        : 'border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800'
                    }`}
                  >
                    <div className="font-semibold text-sm flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-amber-600" />
                      <span>Quản lý (PM)</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleChange('admin')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      role === 'admin'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500/20'
                        : 'border-gray-200 dark:border-dark-700 hover:bg-gray-50 dark:hover:bg-dark-800'
                    }`}
                  >
                    <div className="font-semibold text-sm flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-purple-600" />
                      <span>Admin</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Phân quyền chi tiết cho nhân viên */}
            {role === 'employee' && editingUser.username !== 'daensolit' && (
              <div className="border border-gray-200 dark:border-dark-700 rounded-xl p-4 bg-gray-50/50 dark:bg-dark-800/40 space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 mb-2">
                  Điều chỉnh phân quyền:
                </p>

                <label className="flex items-center justify-between text-sm cursor-pointer p-1.5 hover:bg-white dark:hover:bg-dark-700 rounded-lg">
                  <span>Quản lý Dự án & Tiến độ</span>
                  <input
                    type="checkbox"
                    checked={permissions.canManageProjects}
                    onChange={() => handleTogglePermission('canManageProjects')}
                    className="rounded text-primary-600"
                  />
                </label>

                <label className="flex items-center justify-between text-sm cursor-pointer p-1.5 hover:bg-white dark:hover:bg-dark-700 rounded-lg">
                  <span>Quản lý Thiết bị & Gear Checklist</span>
                  <input
                    type="checkbox"
                    checked={permissions.canManageEquipment}
                    onChange={() => handleTogglePermission('canManageEquipment')}
                    className="rounded text-primary-600"
                  />
                </label>

                <label className="flex items-center justify-between text-sm cursor-pointer p-1.5 hover:bg-white dark:hover:bg-dark-700 rounded-lg">
                  <span>Quản lý Nhân sự / Call Sheet</span>
                  <input
                    type="checkbox"
                    checked={permissions.canManageTeam}
                    onChange={() => handleTogglePermission('canManageTeam')}
                    className="rounded text-primary-600"
                  />
                </label>

                <label className="flex items-center justify-between text-sm cursor-pointer p-1.5 hover:bg-white dark:hover:bg-dark-700 rounded-lg">
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">Quản lý Tài chính & Xuất Invoice</span>
                  <input
                    type="checkbox"
                    checked={permissions.canManageFinance}
                    onChange={() => handleTogglePermission('canManageFinance')}
                    className="rounded text-emerald-600"
                  />
                </label>

                <label className="flex items-center justify-between text-sm cursor-pointer p-1.5 hover:bg-white dark:hover:bg-dark-700 rounded-lg">
                  <span>Quản lý Danh bạ Khách hàng</span>
                  <input
                    type="checkbox"
                    checked={permissions.canManageClients}
                    onChange={() => handleTogglePermission('canManageClients')}
                    className="rounded text-primary-600"
                  />
                </label>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200 dark:border-dark-700">
              <button type="button" onClick={() => setEditingUser(null)} className="btn-secondary">
                Hủy
              </button>
              <button type="submit" className="btn-primary">
                Lưu thay đổi
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmUser}
        onClose={() => setDeleteConfirmUser(null)}
        title="Xác nhận xóa tài khoản"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Bạn có chắc chắn muốn xóa tài khoản <strong>{deleteConfirmUser?.name}</strong> (@{deleteConfirmUser?.username}) không? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setDeleteConfirmUser(null)} className="btn-secondary">
              Hủy
            </button>
            <button onClick={handleDeleteUser} className="btn-danger">
              Xóa tài khoản
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
