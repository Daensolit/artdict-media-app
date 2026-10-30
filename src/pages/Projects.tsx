import React, { useState, useMemo } from 'react';
import {
  Plus, Search, LayoutGrid, List, FolderOpen, Trash2, Edit3, Eye, X,
  Calendar, MapPin, DollarSign, ExternalLink, ChevronDown, ChevronUp,
  Clock, AlertTriangle, Users, Film, Link as LinkIcon, UserCheck,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import Modal from '../components/Modal';
import Avatar from '../components/Avatar';
import GlassSelect from '../components/GlassSelect';
import type { Project, ProjectType, ProjectStatus, Priority, TeamMember } from '../types';
import {
  formatCurrency, formatDate, formatDateShort, getProjectStatusColor,
  getPriorityColor, getInitials, getAvatarColor, generateId, matchesSearch, daysUntil,
} from '../utils/helpers';

const PROJECT_TYPES: ProjectType[] = [
  'Wedding', 'Event', 'TVC', 'MV', 'Corporate',
  'Social Media', 'Documentary', 'Short Film', 'Live Stream', 'Other',
];

const PROJECT_STATUSES: ProjectStatus[] = [
  'Draft', 'Confirmed', 'In Production', 'Post-production',
  'Review', 'Delivered', 'Archived',
];

const PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Urgent'];

const PROJECT_TYPE_COLORS: Record<string, string> = {
  'Wedding': 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  'Event': 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  'TVC': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  'MV': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  'Corporate': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  'Social Media': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Documentary': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  'Short Film': 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  'Live Stream': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  'Other': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

function getProjectTypeBadgeColor(type: string): string {
  return PROJECT_TYPE_COLORS[type] || PROJECT_TYPE_COLORS['Other'];
}

interface ProjectFormData {
  name: string;
  clientId: string;
  isCustomClient?: boolean;
  clientCustomName?: string;
  clientCustomPhone?: string;
  managerId: string;
  type: ProjectType;
  status: ProjectStatus;
  priority: Priority;
  brief: string;
  shootDates: string[];
  deadline: string;
  location: string;
  teamMemberIds: string[];
  equipmentChecklistIds: string[];
  budget: number;
  driveLink: string;
  moodboardLinks: string[];
  notes: string;
  autoSyncCalendar?: boolean;
}

const emptyFormData: ProjectFormData = {
  name: '',
  clientId: '',
  isCustomClient: false,
  clientCustomName: '',
  clientCustomPhone: '',
  managerId: '',
  type: 'Wedding',
  status: 'Draft',
  priority: 'Medium',
  brief: '',
  shootDates: [''],
  deadline: '',
  location: '',
  teamMemberIds: [],
  equipmentChecklistIds: [],
  budget: 0,
  driveLink: '',
  moodboardLinks: [''],
  notes: '',
  autoSyncCalendar: true,
};

export default function Projects() {
  const {
    currentUser,
    projects, clients, teamMembers, equipment,
    addProject, updateProject, deleteProject,
    calendarEvents, addCalendarEvent, updateCalendarEvent,
  } = useStore();

  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const canManageProjects = isAdmin || (isManager && currentUser?.permissions?.canManageProjects);
  const canViewFinance = isAdmin || isManager || currentUser?.permissions?.canManageFinance;

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [managerFilter, setManagerFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<ProjectFormData>(emptyFormData);

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (!matchesSearch(p.name, searchQuery)) {
        const client = clients.find((c) => c.id === p.clientId);
        if (!client || !matchesSearch(client.name, searchQuery)) return false;
      }
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (typeFilter !== 'all' && p.type !== typeFilter) return false;
      if (priorityFilter !== 'all' && p.priority !== priorityFilter) return false;
      if (managerFilter !== 'all' && p.managerId !== managerFilter) return false;
      return true;
    });
  }, [projects, clients, searchQuery, statusFilter, typeFilter, priorityFilter, managerFilter]);

  // Helpers
  const getClientName = (projectOrClientId: Project | string) => {
    if (typeof projectOrClientId === 'object') {
      if (projectOrClientId.clientCustomName) {
        return projectOrClientId.clientCustomName;
      }
      const client = clients.find((c) => c.id === projectOrClientId.clientId);
      return client?.name || 'Chưa xác định';
    }
    const client = clients.find((c) => c.id === projectOrClientId);
    return client?.name || 'Chưa xác định';
  };

  const getManagerName = (managerId?: string) => {
    if (!managerId) return 'Chưa phân công';
    const member = teamMembers.find((m) => m.id === managerId);
    return member?.name || 'Không rõ';
  };

  const getTeamMembersByIds = (ids: string[]) => {
    return teamMembers.filter((m) => ids.includes(m.id));
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingProject(null);
    setFormData(emptyFormData);
    setIsFormModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      clientId: project.clientId,
      isCustomClient: Boolean(project.clientCustomName),
      clientCustomName: project.clientCustomName || '',
      clientCustomPhone: project.clientCustomPhone || '',
      managerId: project.managerId || '',
      type: project.type,
      status: project.status,
      priority: project.priority,
      brief: project.brief,
      shootDates: project.shootDates.length > 0 ? [...project.shootDates] : [''],
      deadline: project.deadline,
      location: project.location,
      teamMemberIds: [...project.teamMemberIds],
      equipmentChecklistIds: [...project.equipmentChecklistIds],
      budget: project.budget,
      driveLink: project.driveLink,
      moodboardLinks: project.moodboardLinks.length > 0 ? [...project.moodboardLinks] : [''],
      notes: project.notes,
      autoSyncCalendar: true,
    });
    setIsFormModalOpen(true);
  };

  // Open delete confirmation
  const openDeleteModal = (project: Project) => {
    setDeletingProject(project);
    setIsDeleteModalOpen(true);
  };

  // Handle form submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const cleanedShootDates = formData.shootDates.filter((d) => d && d.trim() !== '');
    const cleanedMoodboardLinks = formData.moodboardLinks.filter((l) => l && l.trim() !== '');

    const targetClientId = formData.isCustomClient ? '' : formData.clientId;
    const targetCustomName = formData.isCustomClient ? formData.clientCustomName?.trim() : undefined;
    const targetCustomPhone = formData.isCustomClient ? formData.clientCustomPhone?.trim() : undefined;

    let targetProjectId = editingProject?.id;

    if (editingProject) {
      updateProject(editingProject.id, {
        ...formData,
        clientId: targetClientId,
        clientCustomName: targetCustomName,
        clientCustomPhone: targetCustomPhone,
        shootDates: cleanedShootDates,
        moodboardLinks: cleanedMoodboardLinks,
        updatedAt: now,
      });
    } else {
      const newId = generateId();
      targetProjectId = newId;
      const newProject: Project = {
        id: newId,
        ...formData,
        clientId: targetClientId,
        clientCustomName: targetCustomName,
        clientCustomPhone: targetCustomPhone,
        shootDates: cleanedShootDates,
        moodboardLinks: cleanedMoodboardLinks,
        createdAt: now,
        updatedAt: now,
      };
      addProject(newProject);
    }

    // TỰ ĐỘNG ĐẶT LỊCH QUAY TRÊN PHẦN LỊCH (CALENDAR) NẾU CÓ NGÀY RÕ RÀNG
    if (formData.autoSyncCalendar && targetProjectId && cleanedShootDates.length > 0) {
      cleanedShootDates.forEach((shootDate, idx) => {
        // Kiểm tra xem lịch này đã tồn tại cho dự án và ngày này chưa
        const existingEvent = calendarEvents.find(
          (ce) => ce.projectId === targetProjectId && ce.date === shootDate
        );
        if (!existingEvent) {
          const newEvent = {
            id: generateId(),
            projectId: targetProjectId!,
            title: `🎬 Lịch quay: ${formData.name} (Ngày ${idx + 1})`,
            date: shootDate,
            startTime: '08:00',
            endTime: '18:00',
            type: 'shoot' as const,
            location: formData.location || 'Tại hiện trường',
            reminder: 120, // nhắc trước 2 tiếng
            notes: `Lịch quay tự động tạo từ Dự án ${formData.name}. Brief: ${formData.brief.slice(0, 100)}`,
            color: '#f59e0b',
          };
          addCalendarEvent(newEvent);
        }
      });
    }

    // Tự động tạo sự kiện Deadline nếu có
    if (formData.autoSyncCalendar && targetProjectId && formData.deadline) {
      const existingDeadline = calendarEvents.find(
        (ce) => ce.projectId === targetProjectId && ce.date === formData.deadline && ce.type === 'deadline'
      );
      if (!existingDeadline) {
        addCalendarEvent({
          id: generateId(),
          projectId: targetProjectId,
          title: `⏰ DEADLINE: Bàn giao ${formData.name}`,
          date: formData.deadline,
          startTime: '17:00',
          endTime: '18:00',
          type: 'deadline',
          location: 'Artdict Production',
          reminder: 1440, // nhắc trước 1 ngày
          notes: `Hạn chót bàn giao dự án ${formData.name}.`,
          color: '#ef4444',
        });
      }
    }

    setIsFormModalOpen(false);
    setEditingProject(null);
  };

  // Handle delete
  const handleDelete = () => {
    if (deletingProject) {
      deleteProject(deletingProject.id);
      setIsDeleteModalOpen(false);
      setDeletingProject(null);
      if (expandedProjectId === deletingProject.id) {
        setExpandedProjectId(null);
      }
    }
  };

  // Shoot dates helpers
  const addShootDate = () => setFormData((prev) => ({ ...prev, shootDates: [...prev.shootDates, ''] }));
  const removeShootDate = (idx: number) =>
    setFormData((prev) => ({ ...prev, shootDates: prev.shootDates.filter((_, i) => i !== idx) }));
  const updateShootDate = (idx: number, value: string) =>
    setFormData((prev) => ({
      ...prev,
      shootDates: prev.shootDates.map((d, i) => (i === idx ? value : d)),
    }));

  // Moodboard links helpers
  const addMoodboardLink = () => setFormData((prev) => ({ ...prev, moodboardLinks: [...prev.moodboardLinks, ''] }));
  const removeMoodboardLink = (idx: number) =>
    setFormData((prev) => ({ ...prev, moodboardLinks: prev.moodboardLinks.filter((_, i) => i !== idx) }));
  const updateMoodboardLink = (idx: number, value: string) =>
    setFormData((prev) => ({
      ...prev,
      moodboardLinks: prev.moodboardLinks.map((l, i) => (i === idx ? value : l)),
    }));

  // Team member toggle
  const toggleTeamMember = (memberId: string) => {
    setFormData((prev) => ({
      ...prev,
      teamMemberIds: prev.teamMemberIds.includes(memberId)
        ? prev.teamMemberIds.filter((id) => id !== memberId)
        : [...prev.teamMemberIds, memberId],
    }));
  };

  // Toggle expanded project detail
  const toggleExpandProject = (projectId: string) => {
    setExpandedProjectId((prev) => (prev === projectId ? null : projectId));
  };

  // Deadline indicator
  const getDeadlineIndicator = (deadline: string) => {
    if (!deadline) return null;
    const days = daysUntil(deadline);
    if (days < 0) return <span className="text-red-500 text-xs font-medium">Quá hạn {Math.abs(days)} ngày</span>;
    if (days === 0) return <span className="text-red-500 text-xs font-medium">Hôm nay</span>;
    if (days <= 3) return <span className="text-orange-500 text-xs font-medium">Còn {days} ngày</span>;
    if (days <= 7) return <span className="text-amber-500 text-xs font-medium">Còn {days} ngày</span>;
    return <span className="text-gray-400 text-xs">Còn {days} ngày</span>;
  };

  // Team avatar row
  const renderTeamAvatars = (memberIds: string[], maxShow = 4) => {
    const members = getTeamMembersByIds(memberIds);
    const shown = members.slice(0, maxShow);
    const remaining = members.length - maxShow;

    return (
      <div className="flex -space-x-2">
        {shown.map((m) => (
          <div key={m.id} title={m.name} className="ring-2 ring-white dark:ring-dark-800 rounded-full">
            <Avatar name={m.name} avatar={m.avatar} size="xs" />
          </div>
        ))}
        {remaining > 0 && (
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-medium bg-gray-200 dark:bg-dark-600 text-gray-600 dark:text-gray-300 ring-2 ring-white dark:ring-dark-800">
            +{remaining}
          </div>
        )}
      </div>
    );
  };

  // ==============================
  // RENDER
  // ==============================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Quản lý Dự án</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Quản lý tất cả các dự án sản xuất media của bạn
          </p>
        </div>
        {canManageProjects && (
          <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Tạo dự án mới
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm dự án hoặc khách hàng..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>

          {/* Status filter */}
          <GlassSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(val)}
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              ...PROJECT_STATUSES.map((s) => ({ value: s, label: s })),
            ]}
            className="w-full sm:w-44"
          />

          {/* Type filter */}
          <GlassSelect
            value={typeFilter}
            onChange={(val) => setTypeFilter(val)}
            options={[
              { value: 'all', label: 'Tất cả loại' },
              ...PROJECT_TYPES.map((t) => ({ value: t, label: t })),
            ]}
            className="w-full sm:w-40"
          />

          {/* Priority filter */}
          <GlassSelect
            value={priorityFilter}
            onChange={(val) => setPriorityFilter(val)}
            options={[
              { value: 'all', label: 'Tất cả ưu tiên' },
              ...PRIORITIES.map((p) => ({ value: p, label: p })),
            ]}
            className="w-full sm:w-36"
          />

          {/* Manager filter */}
          <GlassSelect
            value={managerFilter}
            onChange={(val) => setManagerFilter(val)}
            options={[
              { value: 'all', label: 'Tất cả quản lý' },
              ...teamMembers.map((m) => ({ value: m.id, label: m.name })),
            ]}
            className="w-full sm:w-44"
          />

          {/* View toggle */}
          <div className="flex items-center border border-slate-200/80 dark:border-white/[0.08] rounded-xl overflow-hidden bg-slate-100/50 dark:bg-white/[0.03]">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 transition-all ${
                viewMode === 'grid'
                  ? 'bg-orange-500/15 text-orange-500 border-r border-orange-500/30 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-all ${
                viewMode === 'list'
                  ? 'bg-orange-500/15 text-orange-500 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200'
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {filteredProjects.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <FolderOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {projects.length === 0 ? 'Chưa có dự án nào' : 'Không tìm thấy dự án'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {projects.length === 0
              ? 'Bắt đầu bằng cách tạo dự án đầu tiên của bạn.'
              : 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.'}
          </p>
          {projects.length === 0 && (
            <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Tạo dự án mới
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ========= GRID VIEW ========= */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <div key={project.id} className="card hover:shadow-lg transition-shadow">
              {/* Card header */}
              <div className="p-4 pb-3 border-b border-gray-100 dark:border-dark-700">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3
                    className="font-semibold text-gray-900 dark:text-gray-100 truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    onClick={() => toggleExpandProject(project.id)}
                  >
                    {project.name}
                  </h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => toggleExpandProject(project.id)}
                      className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-400 transition-colors"
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {canManageProjects && (
                      <button
                        onClick={() => openEditModal(project)}
                        className="p-1 rounded hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-400 transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => openDeleteModal(project)}
                        className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {getClientName(project)}
                </p>
              </div>

              {/* Card body */}
              <div className="p-4 space-y-3">
                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
                  <span className={`badge ${getProjectTypeBadgeColor(project.type)}`}>{project.type}</span>
                  <span className={`badge ${getProjectStatusColor(project.status)}`}>{project.status}</span>
                  <span className={`badge ${getPriorityColor(project.priority)}`}>{project.priority}</span>
                </div>

                {/* Manager */}
                <div className="flex items-center gap-1.5 text-xs text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 px-2.5 py-1 rounded-md">
                  <UserCheck className="w-3.5 h-3.5 text-primary-600" />
                  <span>Quản lý: <strong>{getManagerName(project.managerId)}</strong></span>
                </div>

                {/* Deadline */}
                {project.deadline && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(project.deadline)}</span>
                    </div>
                    {getDeadlineIndicator(project.deadline)}
                  </div>
                )}

                {/* Budget (Admin & Manager) */}
                {canViewFinance && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>{formatCurrency(project.budget)}</span>
                  </div>
                )}

                {/* Team */}
                {project.teamMemberIds.length > 0 && (
                  <div className="flex items-center justify-between">
                    {renderTeamAvatars(project.teamMemberIds)}
                    <span className="text-xs text-gray-400">{project.teamMemberIds.length} thành viên</span>
                  </div>
                )}
              </div>

              {/* Expanded detail */}
              {expandedProjectId === project.id && (
                <ProjectDetailSection project={project} getClientName={getClientName} getManagerName={getManagerName} getTeamMembersByIds={getTeamMembersByIds} />
              )}
            </div>
          ))}
        </div>
      ) : (
        /* ========= LIST VIEW ========= */
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header">Tên dự án</th>
                <th className="table-header">Khách hàng</th>
                <th className="table-header">Quản lý</th>
                <th className="table-header">Loại</th>
                <th className="table-header">Trạng thái</th>
                <th className="table-header">Ưu tiên</th>
                <th className="table-header">Deadline</th>
                <th className="table-header">Đội ngũ</th>
                <th className="table-header">Ngân sách</th>
                <th className="table-header text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredProjects.map((project) => (
                <React.Fragment key={project.id}>
                  <tr className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors">
                    <td className="table-cell">
                      <button
                        onClick={() => toggleExpandProject(project.id)}
                        className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left flex items-center gap-1"
                      >
                        {expandedProjectId === project.id ? (
                          <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                        )}
                        {project.name}
                      </button>
                    </td>
                    <td className="table-cell text-gray-500 dark:text-gray-400">
                      {getClientName(project)}
                    </td>
                    <td className="table-cell">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded">
                        <UserCheck className="w-3 h-3 text-primary-600" />
                        {getManagerName(project.managerId)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${getProjectTypeBadgeColor(project.type)}`}>{project.type}</span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${getProjectStatusColor(project.status)}`}>{project.status}</span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${getPriorityColor(project.priority)}`}>{project.priority}</span>
                    </td>
                    <td className="table-cell">
                      <div>
                        <span className="text-sm">{formatDate(project.deadline)}</span>
                        <div>{getDeadlineIndicator(project.deadline)}</div>
                      </div>
                    </td>
                    <td className="table-cell">
                      {project.teamMemberIds.length > 0 ? renderTeamAvatars(project.teamMemberIds, 3) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="table-cell text-sm">
                      {canViewFinance ? (
                        formatCurrency(project.budget)
                      ) : (
                        <span className="text-xs text-gray-400 italic">Bảo mật</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center justify-end gap-1">
                        {canManageProjects && (
                          <button
                            onClick={() => openEditModal(project)}
                            className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-dark-700 text-gray-400 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => openDeleteModal(project)}
                            className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {expandedProjectId === project.id && (
                    <tr>
                      <td colSpan={10} className="p-0">
                        <ProjectDetailSection project={project} getClientName={getClientName} getManagerName={getManagerName} getTeamMembersByIds={getTeamMembersByIds} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {filteredProjects.length > 0 && (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Hiển thị {filteredProjects.length} / {projects.length} dự án
        </div>
      )}

      {/* ========= CREATE / EDIT MODAL ========= */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingProject ? 'Chỉnh sửa dự án' : 'Tạo dự án mới'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Row 1: Name & Client */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Tên dự án *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                className="input w-full"
                placeholder="Nhập tên dự án"
                required
              />
            </div>
            {/* Client selector with Direct Custom Button */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="label mb-0">Khách hàng *</label>
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, isCustomClient: !p.isCustomClient }))}
                  className="text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 font-medium underline cursor-pointer transition-colors"
                >
                  {formData.isCustomClient ? '← Chọn từ danh sách có sẵn' : '+ Tùy chỉnh thông tin ngay (không cần tạo trước)'}
                </button>
              </div>

              {formData.isCustomClient ? (
                <div className="space-y-2 p-3 bg-primary-50/40 dark:bg-primary-950/20 border border-primary-200/60 dark:border-primary-800/40 rounded-xl">
                  <input
                    type="text"
                    value={formData.clientCustomName || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, clientCustomName: e.target.value }))}
                    className="input w-full"
                    placeholder="Tên khách hàng / Nhãn hàng (VD: Anh Đại Dương Homestay)..."
                    required
                  />
                  <input
                    type="text"
                    value={formData.clientCustomPhone || ''}
                    onChange={(e) => setFormData((p) => ({ ...p, clientCustomPhone: e.target.value }))}
                    className="input w-full text-xs"
                    placeholder="Số điện thoại / Liên hệ nhanh (không bắt buộc)..."
                  />
                </div>
              ) : (
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData((p) => ({ ...p, clientId: e.target.value }))}
                  className="select w-full"
                  required
                >
                  <option value="">Chọn khách hàng</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Row 1.5: Manager Selection */}
          <div>
            <label className="label flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-primary-600" />
              <span>Người quản lý job (Job Lead / PM)</span>
            </label>
            <select
              value={formData.managerId}
              onChange={(e) => setFormData((p) => ({ ...p, managerId: e.target.value }))}
              className="select w-full"
            >
              <option value="">-- Chưa chỉ định người quản lý --</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
              ))}
            </select>
          </div>

          {/* Row 2: Type, Status, Priority */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Loại dự án</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value as ProjectType }))}
                className="select w-full"
              >
                {PROJECT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Trạng thái</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData((p) => ({ ...p, status: e.target.value as ProjectStatus }))}
                className="select w-full"
              >
                {PROJECT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Ưu tiên</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData((p) => ({ ...p, priority: e.target.value as Priority }))}
                className="select w-full"
              >
                {PRIORITIES.map((pr) => (
                  <option key={pr} value={pr}>{pr}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Brief */}
          <div>
            <label className="label">Brief / Yêu cầu</label>
            <textarea
              value={formData.brief}
              onChange={(e) => setFormData((p) => ({ ...p, brief: e.target.value }))}
              className="textarea w-full"
              rows={3}
              placeholder="Mô tả yêu cầu của khách hàng..."
            />
          </div>

          {/* Row 3: Deadline, Location, Budget */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData((p) => ({ ...p, deadline: e.target.value }))}
                className="input w-full"
              />
            </div>
            <div>
              <label className="label">Địa điểm</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                className="input w-full"
                placeholder="Địa điểm quay"
              />
            </div>
            <div>
              <label className="label">Ngân sách (VND)</label>
              <input
                type="number"
                value={formData.budget || ''}
                onChange={(e) => setFormData((p) => ({ ...p, budget: Number(e.target.value) || 0 }))}
                className="input w-full"
                placeholder="0"
                min={0}
              />
            </div>
          </div>

          {/* Shoot Dates with Auto Calendar notification */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <label className="label mb-0">Ngày quay</label>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">⚡ Tự động đồng bộ lên Lịch (Calendar) khi lưu</span>
              </div>
              <button type="button" onClick={addShootDate} className="btn-ghost text-xs flex items-center gap-1">
                <Plus className="w-3 h-3" /> Thêm ngày
              </button>
            </div>
            <div className="space-y-2">
              {formData.shootDates.map((date, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => updateShootDate(idx, e.target.value)}
                    className="input flex-1"
                  />
                  {formData.shootDates.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeShootDate(idx)}
                      className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Drive Link */}
          <div>
            <label className="label">Drive Link</label>
            <input
              type="url"
              value={formData.driveLink}
              onChange={(e) => setFormData((p) => ({ ...p, driveLink: e.target.value }))}
              className="input w-full"
              placeholder="https://drive.google.com/..."
            />
          </div>

          {/* Moodboard Links */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Moodboard Links</label>
              <button type="button" onClick={addMoodboardLink} className="btn-ghost text-xs flex items-center gap-1">
                <Plus className="w-3 h-3" /> Thêm link
              </button>
            </div>
            <div className="space-y-2">
              {formData.moodboardLinks.map((link, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => updateMoodboardLink(idx, e.target.value)}
                    className="input flex-1"
                    placeholder="https://..."
                  />
                  {formData.moodboardLinks.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMoodboardLink(idx)}
                      className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Team Members */}
          <div>
            <label className="label">Đội ngũ sản xuất</label>
            {teamMembers.length === 0 ? (
              <p className="text-sm text-gray-400">Chưa có thành viên nào. Hãy thêm thành viên trong trang Đội ngũ.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-200 dark:border-dark-700 rounded-lg p-3">
                {teamMembers
                  .filter((m) => m.isActive)
                  .map((member) => (
                    <label
                      key={member.id}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                        formData.teamMemberIds.includes(member.id)
                          ? 'bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-300 dark:ring-blue-700'
                          : 'hover:bg-gray-50 dark:hover:bg-dark-700'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.teamMemberIds.includes(member.id)}
                        onChange={() => toggleTeamMember(member.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Avatar name={member.name} avatar={member.avatar} size="xs" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{member.name}</p>
                        <p className="text-xs text-gray-400 truncate">{member.role}</p>
                      </div>
                    </label>
                  ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="label">Ghi chú</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
              className="textarea w-full"
              rows={2}
              placeholder="Ghi chú thêm..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700">
            <button type="button" onClick={() => setIsFormModalOpen(false)} className="btn-secondary">
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              {editingProject ? 'Cập nhật' : 'Tạo dự án'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========= DELETE MODAL ========= */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Xác nhận xóa"
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-gray-900 dark:text-gray-100">
                Bạn có chắc chắn muốn xóa dự án <strong>{deletingProject?.name}</strong>?
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan sẽ bị mất.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button onClick={() => setIsDeleteModalOpen(false)} className="btn-secondary">
              Hủy
            </button>
            <button onClick={handleDelete} className="btn-danger">
              Xóa dự án
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ==============================
// PROJECT DETAIL SECTION
// ==============================

interface ProjectDetailSectionProps {
  project: Project;
  getClientName: (id: string) => string;
  getManagerName: (id?: string) => string;
  getTeamMembersByIds: (ids: string[]) => TeamMember[];
}

function ProjectDetailSection({ project, getClientName, getManagerName, getTeamMembersByIds }: ProjectDetailSectionProps) {
  const members = getTeamMembersByIds(project.teamMemberIds);

  return (
    <div className="bg-gray-50 dark:bg-dark-800/50 border-t border-gray-100 dark:border-dark-700 p-4 space-y-4">
      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Client */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase mb-1">Khách hàng</p>
          <p className="text-sm text-gray-900 dark:text-gray-100">{getClientName(project.clientId)}</p>
        </div>

        {/* Manager */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase mb-1">Người quản lý job (PM)</p>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-primary-600 dark:text-primary-400">
            <UserCheck className="w-4 h-4" />
            <span>{getManagerName(project.managerId)}</span>
          </div>
        </div>

        {/* Location */}
        {project.location && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase mb-1">Địa điểm</p>
            <div className="flex items-center gap-1 text-sm text-gray-900 dark:text-gray-100">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              {project.location}
            </div>
          </div>
        )}

        {/* Budget */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase mb-1">Ngân sách</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatCurrency(project.budget)}</p>
        </div>

        {/* Deadline */}
        {project.deadline && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase mb-1">Deadline</p>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-900 dark:text-gray-100">{formatDate(project.deadline)}</span>
              {(() => {
                const days = daysUntil(project.deadline);
                if (days < 0) return <span className="badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Quá hạn</span>;
                if (days <= 3) return <span className="badge bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">Gấp</span>;
                return null;
              })()}
            </div>
          </div>
        )}

        {/* Shoot dates */}
        {project.shootDates.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase mb-1">Ngày quay</p>
            <div className="flex flex-wrap gap-1">
              {project.shootDates.map((d, i) => (
                <span key={i} className="text-sm bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 px-2 py-0.5 rounded">
                  {formatDateShort(d)}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Created at */}
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase mb-1">Ngày tạo</p>
          <p className="text-sm text-gray-900 dark:text-gray-100">{formatDate(project.createdAt)}</p>
        </div>
      </div>

      {/* Brief */}
      {project.brief && (
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase mb-1">Brief / Yêu cầu</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-white dark:bg-dark-700 p-3 rounded-lg border border-gray-200 dark:border-dark-600">
            {project.brief}
          </p>
        </div>
      )}

      {/* Team */}
      {members.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase mb-2">Đội ngũ ({members.length})</p>
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex items-center gap-2 bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600 rounded-lg px-2.5 py-1.5"
              >
                <Avatar name={m.name} avatar={m.avatar} size="xs" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Links */}
      <div className="flex flex-wrap gap-3">
        {project.driveLink && (
          <a
            href={project.driveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Google Drive
          </a>
        )}
        {project.moodboardLinks.map((link, i) => (
          link && (
            <a
              key={i}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              Moodboard {project.moodboardLinks.length > 1 ? i + 1 : ''}
            </a>
          )
        ))}
      </div>

      {/* Notes */}
      {project.notes && (
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase mb-1">Ghi chú</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{project.notes}</p>
        </div>
      )}
    </div>
  );
}
