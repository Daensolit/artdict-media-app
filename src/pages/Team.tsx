import React, { useState, useMemo, useRef } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Phone,
  Mail,
  DollarSign,
  Briefcase,
  Package,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  UserCheck,
  UserX,
  AlertTriangle,
  Star,
  Activity,
  Camera,
  Upload,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import Modal from '../components/Modal';
import Avatar from '../components/Avatar';
import GlassSelect from '../components/GlassSelect';
import type { TeamMember, TeamRole } from '../types';
import {
  generateId,
  getInitials,
  getAvatarColor,
  formatCurrency,
  formatDate,
  matchesSearch,
  getProjectStatusColor,
  getEquipmentStatusColor,
  compressAvatarImage,
} from '../utils/helpers';

const ROLE_OPTIONS: TeamRole[] = [
  'Director',
  'DOP',
  'Camera Operator',
  'Editor',
  'Colorist',
  'Sound Engineer',
  'Drone Pilot',
  'Gaffer',
  'Production Assistant',
  'Producer',
  'Photographer',
  'Other',
];

const ROLE_COLORS: Record<string, string> = {
  Director: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  DOP: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  'Camera Operator': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Editor: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Colorist: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'Sound Engineer': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'Drone Pilot': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  Gaffer: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  'Production Assistant': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  Producer: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  Photographer: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  Other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

function getRoleColor(role: string): string {
  return ROLE_COLORS[role] || ROLE_COLORS['Other'];
}

interface MemberFormData {
  name: string;
  role: TeamRole;
  email: string;
  phone: string;
  skills: string;
  avatar: string;
  projectRate: string;
  isActive: boolean;
}

const emptyForm: MemberFormData = {
  name: '',
  role: 'Camera Operator',
  email: '',
  phone: '',
  skills: '',
  avatar: '',
  projectRate: '',
  isActive: true,
};

export default function Team() {
  const {
    currentUser,
    teamMembers,
    projects,
    equipment,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
  } = useStore();

  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const canManageTeam = isAdmin || (isManager && currentUser?.permissions?.canManageTeam);

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState<MemberFormData>(emptyForm);
  const [isCompressingAvatar, setIsCompressingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const teamAvatarFileInputRef = useRef<HTMLInputElement | null>(null);

  // Helpers to compute relations
  const getAssignedProjects = (memberId: string) =>
    projects.filter((p) => p.teamMemberIds.includes(memberId));

  const getAssignedEquipment = (memberId: string) =>
    equipment.filter((e) => e.assignedToId === memberId);

  const getActiveProjectCount = (memberId: string) =>
    projects.filter(
      (p) =>
        p.teamMemberIds.includes(memberId) &&
        !['Delivered', 'Archived'].includes(p.status)
    ).length;

  // Filtered & searched members
  const filteredMembers = useMemo(() => {
    return teamMembers.filter((m) => {
      const matchName = matchesSearch(m.name, searchQuery) || matchesSearch(m.email, searchQuery) || matchesSearch(m.phone, searchQuery);
      const matchRole = roleFilter === 'all' || m.role === roleFilter;
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && m.isActive) ||
        (statusFilter === 'inactive' && !m.isActive);
      return matchName && matchRole && matchStatus;
    });
  }, [teamMembers, searchQuery, roleFilter, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = teamMembers.length;
    const active = teamMembers.filter((m) => m.isActive).length;
    const roles = teamMembers.reduce<Record<string, number>>((acc, m) => {
      acc[m.role] = (acc[m.role] || 0) + 1;
      return acc;
    }, {});
    const topRoles = Object.entries(roles)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    return { total, active, inactive: total - active, topRoles };
  }, [teamMembers]);

  // Open form modals
  const openAddModal = () => {
    setEditingMember(null);
    setFormData(emptyForm);
    setAvatarError('');
    setIsFormModalOpen(true);
  };

  const openEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      role: member.role,
      email: member.email,
      phone: member.phone,
      skills: member.skills.join(', '),
      avatar: member.avatar || '',
      projectRate: String(member.projectRate || member.hourlyRate || 0),
      isActive: member.isActive,
    });
    setAvatarError('');
    setIsFormModalOpen(true);
  };

  const handleTeamAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAvatarError('Vui lòng chọn file hình ảnh (JPG, PNG, WebP...)');
      return;
    }

    try {
      setIsCompressingAvatar(true);
      setAvatarError('');
      const compressed = await compressAvatarImage(file);
      setFormData((prev) => ({ ...prev, avatar: compressed }));
    } catch (err: any) {
      setAvatarError(err?.message || 'Lỗi khi nén ảnh');
    } finally {
      setIsCompressingAvatar(false);
      if (teamAvatarFileInputRef.current) {
        teamAvatarFileInputRef.current.value = '';
      }
    }
  };

  const openDeleteModal = (member: TeamMember) => {
    setDeletingMember(member);
    setIsDeleteModalOpen(true);
  };

  const openDetail = (member: TeamMember) => {
    setSelectedMember(member);
    setIsDetailOpen(true);
  };

  // Form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const skillsArray = formData.skills
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const finalAvatar = formData.avatar || (editingMember ? editingMember.avatar : '') || getInitials(formData.name.trim());

    if (editingMember) {
      updateTeamMember(editingMember.id, {
        name: formData.name,
        role: formData.role,
        email: formData.email,
        phone: formData.phone,
        avatar: finalAvatar,
        skills: skillsArray,
        projectRate: Number(formData.projectRate) || 0,
        isActive: formData.isActive,
      });
    } else {
      const newMember: TeamMember = {
        id: generateId(),
        name: formData.name,
        role: formData.role,
        email: formData.email,
        phone: formData.phone,
        avatar: finalAvatar,
        skills: skillsArray,
        projectRate: Number(formData.projectRate) || 0,
        isActive: formData.isActive,
        createdAt: new Date().toISOString(),
      };
      addTeamMember(newMember);
    }
    setIsFormModalOpen(false);
  };

  const handleDelete = () => {
    if (deletingMember) {
      deleteTeamMember(deletingMember.id);
      setIsDeleteModalOpen(false);
      setDeletingMember(null);
      // If detail was open for this member, close it
      if (selectedMember?.id === deletingMember.id) {
        setIsDetailOpen(false);
        setSelectedMember(null);
      }
    }
  };

  const toggleActiveStatus = (member: TeamMember) => {
    updateTeamMember(member.id, { isActive: !member.isActive });
  };

  // ==================== Detail View ====================
  if (isDetailOpen && selectedMember) {
    const memberProjects = getAssignedProjects(selectedMember.id);
    const memberEquipment = getAssignedEquipment(selectedMember.id);
    const activeProjects = memberProjects.filter(
      (p) => !['Delivered', 'Archived'].includes(p.status)
    );

    return (
      <div className="space-y-6">
        {/* Back button + header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              setIsDetailOpen(false);
              setSelectedMember(null);
            }}
            className="btn-ghost flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Quay lại
          </button>
        </div>

        {/* Member Header Card */}
        <div className="card p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <Avatar
              name={selectedMember.name}
              avatar={selectedMember.avatar}
              size="xl"
              className="ring-4 ring-white dark:ring-dark-800 shadow-md"
            />
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {selectedMember.name}
                </h1>
                <span
                  className={`badge ${getRoleColor(selectedMember.role)}`}
                >
                  {selectedMember.role}
                </span>
                <span
                  className={`badge ${
                    selectedMember.isActive
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
                  }`}
                >
                  {selectedMember.isActive ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                {selectedMember.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4" />
                    {selectedMember.email}
                  </span>
                )}
                {selectedMember.phone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4" />
                    {selectedMember.phone}
                  </span>
                )}
              </div>

              {selectedMember.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {selectedMember.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            {canManageTeam && (
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(selectedMember)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Sửa
                </button>
                {isAdmin && (
                  <button
                    onClick={() => openDeleteModal(selectedMember)}
                    className="btn-danger flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Xóa
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {memberProjects.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Tổng dự án</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {activeProjects.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Dự án đang thực hiện</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {memberEquipment.length}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Thiết bị được giao</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatDate(selectedMember.createdAt)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Ngày tham gia</div>
          </div>
        </div>

        {/* Assigned Projects */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Dự án được giao ({memberProjects.length})
          </h3>
          {memberProjects.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-600">
              <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Chưa được giao dự án nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header">Tên dự án</th>
                    <th className="table-header">Loại</th>
                    <th className="table-header">Trạng thái</th>
                    <th className="table-header">Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {memberProjects.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                      <td className="table-cell font-medium text-gray-900 dark:text-gray-100">
                        {p.name}
                      </td>
                      <td className="table-cell text-gray-500 dark:text-gray-400">{p.type}</td>
                      <td className="table-cell">
                        <span className={`badge ${getProjectStatusColor(p.status)}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="table-cell text-gray-500 dark:text-gray-400">
                        {formatDate(p.deadline)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Assigned Equipment */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Thiết bị được giao ({memberEquipment.length})
          </h3>
          {memberEquipment.length === 0 ? (
            <div className="text-center py-8 text-gray-400 dark:text-gray-600">
              <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Chưa được giao thiết bị nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header">Tên thiết bị</th>
                    <th className="table-header">Danh mục</th>
                    <th className="table-header">Thương hiệu</th>
                    <th className="table-header">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {memberEquipment.map((eq) => (
                    <tr key={eq.id} className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                      <td className="table-cell font-medium text-gray-900 dark:text-gray-100">
                        {eq.name}
                      </td>
                      <td className="table-cell text-gray-500 dark:text-gray-400">{eq.category}</td>
                      <td className="table-cell text-gray-500 dark:text-gray-400">
                        {eq.brand} {eq.model}
                      </td>
                      <td className="table-cell">
                        <span className={`badge ${getEquipmentStatusColor(eq.status)}`}>
                          {eq.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modals rendered inside detail view too */}
        {renderFormModal()}
        {renderDeleteModal()}
      </div>
    );
  }

  // ==================== Form Modal ====================
  function renderFormModal() {
    return (
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingMember ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10">
            <input
              type="file"
              ref={teamAvatarFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleTeamAvatarUpload}
            />

            <div
              className="relative group/avatar cursor-pointer"
              onClick={() => teamAvatarFileInputRef.current?.click()}
              title="Nhấn để tải hoặc đổi ảnh đại diện"
            >
              <Avatar
                name={formData.name || 'Member'}
                avatar={formData.avatar}
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
                  Ảnh đại diện thành viên
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Nén tự động WebP (~20KB) siêu nhẹ, sắc nét và an toàn cho hệ thống.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <button
                  type="button"
                  onClick={() => teamAvatarFileInputRef.current?.click()}
                  disabled={isCompressingAvatar}
                  className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {isCompressingAvatar ? 'Đang nén ảnh...' : 'Tải ảnh từ máy'}
                </button>
                {formData.avatar && (
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, avatar: '' }))}
                    className="text-xs py-1.5 px-2.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Xóa ảnh
                  </button>
                )}
              </div>

              {avatarError && (
                <p className="text-xs text-red-500 font-medium">{avatarError}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="label">Họ và tên *</label>
              <input
                type="text"
                className="input"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                placeholder="Nguyễn Văn A"
              />
            </div>

            {/* Role */}
            <div>
              <label className="label">Vai trò *</label>
              <GlassSelect
                value={formData.role}
                onChange={(val) =>
                  setFormData({
                    ...formData,
                    role: val as TeamRole,
                  })
                }
                options={ROLE_OPTIONS}
              />
            </div>

            {/* Email */}
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="email@example.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="label">Số điện thoại</label>
              <input
                type="text"
                className="input"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="0901 234 567"
              />
            </div>

            {/* Active */}
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Đang hoạt động
                </span>
              </label>
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="label">Kỹ năng (phân cách bằng dấu phẩy)</label>
            <input
              type="text"
              className="input"
              value={formData.skills}
              onChange={(e) =>
                setFormData({ ...formData, skills: e.target.value })
              }
              placeholder="Adobe Premiere, DaVinci Resolve, After Effects"
            />
            {formData.skills && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {formData.skills
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    >
                      {skill}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="btn-secondary"
            >
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              {editingMember ? 'Cập nhật' : 'Thêm thành viên'}
            </button>
          </div>
        </form>
      </Modal>
    );
  }

  // ==================== Delete Modal ====================
  function renderDeleteModal() {
    if (!deletingMember) return null;
    const activeProjectsCount = getActiveProjectCount(deletingMember.id);

    return (
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeletingMember(null);
        }}
        title="Xác nhận xóa thành viên"
        size="sm"
      >
        <div className="space-y-4">
          {activeProjectsCount > 0 && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Cảnh báo
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  Thành viên <strong>{deletingMember.name}</strong> đang được giao{' '}
                  <strong>{activeProjectsCount}</strong> dự án đang hoạt động. Xóa
                  thành viên sẽ không tự động gỡ khỏi các dự án đó.
                </p>
              </div>
            </div>
          )}

          <p className="text-gray-600 dark:text-gray-400">
            Bạn có chắc chắn muốn xóa thành viên{' '}
            <strong className="text-gray-900 dark:text-gray-100">
              {deletingMember.name}
            </strong>
            ? Hành động này không thể hoàn tác.
          </p>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeletingMember(null);
              }}
              className="btn-secondary"
            >
              Hủy
            </button>
            <button onClick={handleDelete} className="btn-danger">
              Xóa thành viên
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  // ==================== Main List View ====================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Quản lý Nhân sự
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Quản lý thông tin đội ngũ sản xuất và phân công công việc
          </p>
        </div>
        {canManageTeam && (
          <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            Thêm thành viên
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.total}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Tổng thành viên</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.active}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Đang hoạt động</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <UserX className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {stats.inactive}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Ngưng hoạt động</div>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Vai trò chính</div>
              <div className="flex flex-wrap gap-1">
                {stats.topRoles.map(([role, count]) => (
                  <span
                    key={role}
                    className="text-xs px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400"
                  >
                    {role} ({count})
                  </span>
                ))}
                {stats.topRoles.length === 0 && (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="input pl-10"
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <GlassSelect
              className="min-w-[160px]"
              value={roleFilter}
              onChange={setRoleFilter}
              options={[{ value: 'all', label: 'Tất cả vai trò' }, ...ROLE_OPTIONS.map((r) => ({ value: r, label: r }))]}
            />
            <GlassSelect
              className="min-w-[170px]"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'Tất cả trạng thái' },
                { value: 'active', label: 'Đang hoạt động' },
                { value: 'inactive', label: 'Ngưng hoạt động' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Members Grid */}
      {filteredMembers.length === 0 ? (
        <div className="card p-12 text-center">
          <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-700 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">
            Không tìm thấy thành viên
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {teamMembers.length === 0
              ? 'Bắt đầu bằng việc thêm thành viên đầu tiên vào đội ngũ.'
              : 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.'}
          </p>
          {teamMembers.length === 0 && (
            <button onClick={openAddModal} className="btn-primary inline-flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Thêm thành viên
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const memberProjects = getAssignedProjects(member.id);
            const equipmentCount = getAssignedEquipment(member.id).length;
            const activeProjects = memberProjects.filter(
              (p) => !['Delivered', 'Archived'].includes(p.status)
            );

            return (
              <div
                key={member.id}
                className="card p-5 hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => openDetail(member)}
              >
                {/* Top: Avatar + Name + Actions */}
                <div className="flex items-start gap-4">
                  <Avatar name={member.name} avatar={member.avatar} size="lg" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {member.name}
                      </h3>
                      <span
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                          member.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                        title={member.isActive ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                      />
                    </div>
                    <span
                      className={`badge text-xs mt-1 inline-block ${getRoleColor(
                        member.role
                      )}`}
                    >
                      {member.role}
                    </span>
                  </div>
                  {/* Actions */}
                  {canManageTeam && (
                    <div
                      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => toggleActiveStatus(member)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                        title={member.isActive ? 'Tạm ngưng' : 'Kích hoạt'}
                      >
                        {member.isActive ? (
                          <UserX className="w-4 h-4 text-gray-400" />
                        ) : (
                          <UserCheck className="w-4 h-4 text-emerald-500" />
                        )}
                      </button>
                      <button
                        onClick={() => openEditModal(member)}
                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-4 h-4 text-gray-400" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => openDeleteModal(member)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-dark-800 transition-colors"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Contact info */}
                <div className="mt-3 space-y-1.5 text-sm text-gray-500 dark:text-gray-400">
                  {member.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5" />
                      <span className="truncate">{member.phone}</span>
                    </div>
                  )}
                  {member.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  )}
                </div>

                {/* Skills tags */}
                {member.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {member.skills.slice(0, 4).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      >
                        {skill}
                      </span>
                    ))}
                    {member.skills.length > 4 && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500">
                        +{member.skills.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Bottom row: Member status tag + Projects + Equipment */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-dark-700 flex items-center justify-between text-sm">
                  <span className="text-xs text-primary-600 dark:text-primary-400 font-medium flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse"></span>
                    Thành viên Artdict
                  </span>
                  <div className="flex items-center gap-3 text-gray-400 dark:text-gray-500">
                    <span
                      className="flex items-center gap-1"
                      title={`${activeProjects.length} dự án đang hoạt động`}
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      {activeProjects.length}
                    </span>
                    <span
                      className="flex items-center gap-1"
                      title={`${equipmentCount} thiết bị được giao`}
                    >
                      <Package className="w-3.5 h-3.5" />
                      {equipmentCount}
                    </span>
                  </div>
                </div>

                {/* Current projects */}
                {activeProjects.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {activeProjects.slice(0, 2).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/10"
                      >
                        <span className="text-blue-700 dark:text-blue-400 truncate mr-2">
                          {p.name}
                        </span>
                        <span className={`badge text-xs flex-shrink-0 ${getProjectStatusColor(p.status)}`}>
                          {p.status}
                        </span>
                      </div>
                    ))}
                    {activeProjects.length > 2 && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 text-center">
                        +{activeProjects.length - 2} dự án khác
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {renderFormModal()}
      {renderDeleteModal()}
    </div>
  );
}
