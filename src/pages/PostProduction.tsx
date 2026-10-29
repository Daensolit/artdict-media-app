import React, { useState, useMemo } from 'react';
import {
  Plus,
  Film,
  Clock,
  User,
  Edit2,
  Trash2,
  Filter,
  ChevronRight,
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import Modal from '../components/Modal';
import type { PostProductionTask, PostProductionStep } from '../types';
import {
  formatDate,
  generateId,
  getPostProductionStepColor,
  getInitials,
  getAvatarColor,
  daysUntil,
} from '../utils/helpers';

const ALL_STEPS: PostProductionStep[] = [
  'Ingest',
  'Rough Cut',
  'Color Grading',
  'Sound Design',
  'VFX',
  'Final Cut',
  'Export',
  'Done',
];

const STATUS_OPTIONS: { value: PostProductionTask['status']; label: string }[] = [
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'in_progress', label: 'Đang thực hiện' },
  { value: 'completed', label: 'Hoàn thành' },
];

const STEP_HEADER_COLORS: Record<PostProductionStep, string> = {
  'Ingest': 'bg-gray-500',
  'Rough Cut': 'bg-blue-500',
  'Color Grading': 'bg-purple-500',
  'Sound Design': 'bg-amber-500',
  'VFX': 'bg-pink-500',
  'Final Cut': 'bg-emerald-500',
  'Export': 'bg-indigo-500',
  'Done': 'bg-green-500',
};

const STEP_HEADER_LIGHT_BG: Record<PostProductionStep, string> = {
  'Ingest': 'bg-gray-50 dark:bg-gray-800/50',
  'Rough Cut': 'bg-blue-50 dark:bg-blue-900/20',
  'Color Grading': 'bg-purple-50 dark:bg-purple-900/20',
  'Sound Design': 'bg-amber-50 dark:bg-amber-900/20',
  'VFX': 'bg-pink-50 dark:bg-pink-900/20',
  'Final Cut': 'bg-emerald-50 dark:bg-emerald-900/20',
  'Export': 'bg-indigo-50 dark:bg-indigo-900/20',
  'Done': 'bg-green-50 dark:bg-green-900/20',
};

interface TaskFormData {
  projectId: string;
  step: PostProductionStep;
  assignedToId: string;
  status: PostProductionTask['status'];
  deadline: string;
  progress: number;
  notes: string;
}

const defaultFormData: TaskFormData = {
  projectId: '',
  step: 'Ingest',
  assignedToId: '',
  status: 'pending',
  deadline: new Date().toISOString().split('T')[0],
  progress: 0,
  notes: '',
};

export default function PostProduction() {
  const {
    currentUser,
    postProductionTasks,
    projects,
    teamMembers,
    addPostProductionTask,
    updatePostProductionTask,
    deletePostProductionTask,
  } = useStore();

  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PostProductionTask | null>(null);
  const [formData, setFormData] = useState<TaskFormData>(defaultFormData);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filters
  const [filterProjectId, setFilterProjectId] = useState<string>('');
  const [filterAssignedToId, setFilterAssignedToId] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return postProductionTasks.filter((task) => {
      if (filterProjectId && task.projectId !== filterProjectId) return false;
      if (filterAssignedToId && task.assignedToId !== filterAssignedToId) return false;
      if (filterStatus && task.status !== filterStatus) return false;
      return true;
    });
  }, [postProductionTasks, filterProjectId, filterAssignedToId, filterStatus]);

  // Group tasks by step for kanban
  const tasksByStep = useMemo(() => {
    const grouped: Record<PostProductionStep, PostProductionTask[]> = {} as any;
    ALL_STEPS.forEach((step) => {
      grouped[step] = filteredTasks.filter((t) => t.step === step);
    });
    return grouped;
  }, [filteredTasks]);

  // Unique projects that have post-production tasks
  const projectsWithTasks = useMemo(() => {
    const ids = new Set(postProductionTasks.map((t) => t.projectId));
    return projects.filter((p) => ids.has(p.id));
  }, [projects, postProductionTasks]);

  // Helpers
  const getProject = (id: string) => projects.find((p) => p.id === id);
  const getMember = (id: string) => teamMembers.find((m) => m.id === id);

  const getStatusIcon = (status: PostProductionTask['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      case 'in_progress':
        return <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />;
      default:
        return <Circle className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: PostProductionTask['status']) => {
    const map: Record<string, string> = {
      pending: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
      in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    };
    const labelMap: Record<string, string> = {
      pending: 'Chờ xử lý',
      in_progress: 'Đang thực hiện',
      completed: 'Hoàn thành',
    };
    return (
      <span className={`badge text-xs ${map[status]}`}>
        {labelMap[status]}
      </span>
    );
  };

  // Form handlers
  const openAddModal = () => {
    setEditingTask(null);
    setFormData(defaultFormData);
    setIsModalOpen(true);
  };

  const openEditModal = (task: PostProductionTask) => {
    setEditingTask(task);
    setFormData({
      projectId: task.projectId,
      step: task.step,
      assignedToId: task.assignedToId,
      status: task.status,
      deadline: task.deadline.split('T')[0],
      progress: task.progress,
      notes: task.notes,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId || !formData.assignedToId) return;

    if (editingTask) {
      updatePostProductionTask(editingTask.id, {
        ...formData,
        deadline: new Date(formData.deadline).toISOString(),
        completedAt: formData.status === 'completed' && !editingTask.completedAt
          ? new Date().toISOString()
          : formData.status !== 'completed'
            ? null
            : editingTask.completedAt,
      });
    } else {
      const newTask: PostProductionTask = {
        id: generateId(),
        projectId: formData.projectId,
        step: formData.step,
        assignedToId: formData.assignedToId,
        status: formData.status,
        deadline: new Date(formData.deadline).toISOString(),
        completedAt: formData.status === 'completed' ? new Date().toISOString() : null,
        notes: formData.notes,
        progress: formData.progress,
      };
      addPostProductionTask(newTask);
    }
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleDelete = (id: string) => {
    deletePostProductionTask(id);
    setDeleteConfirmId(null);
  };

  const activeFiltersCount = [filterProjectId, filterAssignedToId, filterStatus].filter(Boolean).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Film className="w-7 h-7 text-purple-500" />
            Pipeline Hậu kỳ
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Quản lý tiến trình hậu kỳ theo từng bước sản xuất
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary flex items-center gap-2 ${activeFiltersCount > 0 ? 'ring-2 ring-purple-300 dark:ring-purple-600' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Bộ lọc
            {activeFiltersCount > 0 && (
              <span className="bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
          {(isAdmin || isManager) && (
            <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Thêm task
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Dự án</label>
              <select
                className="select w-full"
                value={filterProjectId}
                onChange={(e) => setFilterProjectId(e.target.value)}
              >
                <option value="">Tất cả dự án</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Người thực hiện</label>
              <select
                className="select w-full"
                value={filterAssignedToId}
                onChange={(e) => setFilterAssignedToId(e.target.value)}
              >
                <option value="">Tất cả</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Trạng thái</label>
              <select
                className="select w-full"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Tất cả</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          {activeFiltersCount > 0 && (
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => {
                  setFilterProjectId('');
                  setFilterAssignedToId('');
                  setFilterStatus('');
                }}
                className="btn-ghost text-sm"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>
      )}

      {/* Progress Overview */}
      {projectsWithTasks.length > 0 && (
        <div className="card p-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            Tổng quan tiến độ theo dự án
          </h2>
          <div className="space-y-3">
            {projectsWithTasks.map((project) => {
              const projectTasks = postProductionTasks.filter((t) => t.projectId === project.id);
              return (
                <div key={project.id} className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {project.name}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {ALL_STEPS.map((step, idx) => {
                      const stepTask = projectTasks.find((t) => t.step === step);
                      let bgClass = 'bg-gray-200 dark:bg-gray-700';
                      let tooltip = `${step}: Chưa có task`;
                      if (stepTask) {
                        if (stepTask.status === 'completed') {
                          bgClass = getPostProductionStepColor(step);
                          tooltip = `${step}: Hoàn thành (${stepTask.progress}%)`;
                        } else if (stepTask.status === 'in_progress') {
                          bgClass = getPostProductionStepColor(step) + ' opacity-60';
                          tooltip = `${step}: Đang thực hiện (${stepTask.progress}%)`;
                        } else {
                          bgClass = 'bg-gray-300 dark:bg-gray-600';
                          tooltip = `${step}: Chờ xử lý (${stepTask.progress}%)`;
                        }
                      }
                      return (
                        <div
                          key={step}
                          className={`h-3 flex-1 ${bgClass} ${idx === 0 ? 'rounded-l-full' : ''} ${idx === ALL_STEPS.length - 1 ? 'rounded-r-full' : ''} transition-all`}
                          title={tooltip}
                        />
                      );
                    })}
                  </div>
                  <div className="flex items-center gap-1 overflow-x-auto">
                    {ALL_STEPS.map((step, idx) => (
                      <React.Fragment key={step}>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap flex-1 text-center">
                          {step}
                        </span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4 -mx-2 px-2">
        <div className="flex gap-4 min-w-max">
          {ALL_STEPS.map((step) => {
            const tasks = tasksByStep[step];
            const stepColor = STEP_HEADER_COLORS[step];
            const stepBg = STEP_HEADER_LIGHT_BG[step];
            return (
              <div
                key={step}
                className={`w-72 flex-shrink-0 rounded-xl ${stepBg} border border-gray-200 dark:border-gray-700 flex flex-col max-h-[calc(100vh-20rem)]`}
              >
                {/* Column Header */}
                <div className="p-3 flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${stepColor}`} />
                  <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                    {step}
                  </h3>
                  <span className="ml-auto text-xs font-medium bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full px-2 py-0.5 shadow-sm">
                    {tasks.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-2 pt-0 space-y-2">
                  {tasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-gray-400 dark:text-gray-600">
                      <Circle className="w-8 h-8 mb-2 opacity-40" />
                      <span className="text-xs">Không có task</span>
                    </div>
                  )}
                  {tasks.map((task) => {
                    const project = getProject(task.projectId);
                    const member = getMember(task.assignedToId);
                    const days = daysUntil(task.deadline);
                    const isOverdue = days < 0 && task.status !== 'completed';

                    return (
                      <div
                        key={task.id}
                        className="card p-3 hover:shadow-md transition-shadow cursor-pointer group"
                        onClick={() => openEditModal(task)}
                      >
                        {/* Project name */}
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight line-clamp-2">
                            {project?.name || 'Dự án không xác định'}
                          </span>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(task);
                              }}
                              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="Cập nhật tiến độ"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                            </button>
                            {(isAdmin || isManager) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmId(task.id);
                                }}
                                className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Xóa task"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Status badge */}
                        <div className="mb-2">
                          {getStatusBadge(task.status)}
                        </div>

                        {/* Progress bar */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Tiến độ</span>
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                              {task.progress}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                task.progress === 100
                                  ? 'bg-emerald-500'
                                  : task.progress >= 50
                                    ? 'bg-blue-500'
                                    : 'bg-amber-500'
                              }`}
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>

                        {/* Assigned person & deadline */}
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50">
                          {/* Person */}
                          {member ? (
                            <div className="flex items-center gap-1.5">
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${getAvatarColor(member.name)}`}
                              >
                                {getInitials(member.name)}
                              </div>
                              <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[80px]">
                                {member.name}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                              <User className="w-3.5 h-3.5" />
                              N/A
                            </div>
                          )}

                          {/* Deadline */}
                          <div
                            className={`flex items-center gap-1 text-xs ${
                              isOverdue
                                ? 'text-red-500 font-medium'
                                : days <= 2 && task.status !== 'completed'
                                  ? 'text-amber-500'
                                  : 'text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {isOverdue && <AlertCircle className="w-3 h-3" />}
                            <Clock className="w-3 h-3" />
                            <span>
                              {task.status === 'completed'
                                ? 'Xong'
                                : isOverdue
                                  ? `Quá hạn ${Math.abs(days)}d`
                                  : days === 0
                                    ? 'Hôm nay'
                                    : `${days}d`}
                            </span>
                          </div>
                        </div>

                        {/* Notes */}
                        {task.notes && (
                          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500 line-clamp-2 italic">
                            {task.notes}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty state when no tasks at all */}
      {postProductionTasks.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-16">
          <Film className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-600 dark:text-gray-400 mb-1">
            Chưa có task hậu kỳ nào
          </h3>
          <p className="text-gray-400 dark:text-gray-500 text-sm mb-4">
            Bắt đầu bằng cách thêm task mới cho dự án của bạn
          </p>
          <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Thêm task đầu tiên
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        title={editingTask ? 'Chỉnh sửa task' : 'Thêm task hậu kỳ'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Project */}
            <div>
              <label className="label">Dự án <span className="text-red-400">*</span></label>
              <select
                className="select w-full"
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                required
              >
                <option value="">Chọn dự án</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Step */}
            <div>
              <label className="label">Bước sản xuất <span className="text-red-400">*</span></label>
              <select
                className="select w-full"
                value={formData.step}
                onChange={(e) => setFormData({ ...formData, step: e.target.value as PostProductionStep })}
                required
              >
                {ALL_STEPS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Assigned To */}
            <div>
              <label className="label">Người thực hiện <span className="text-red-400">*</span></label>
              <select
                className="select w-full"
                value={formData.assignedToId}
                onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                required
              >
                <option value="">Chọn thành viên</option>
                {teamMembers.filter((m) => m.isActive).map((m) => (
                  <option key={m.id} value={m.id}>{m.name} - {m.role}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="label">Trạng thái</label>
              <select
                className="select w-full"
                value={formData.status}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.value as PostProductionTask['status'],
                    progress: e.target.value === 'completed' ? 100 : formData.progress,
                  })
                }
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Deadline */}
            <div>
              <label className="label">Hạn chót</label>
              <input
                type="date"
                className="input w-full"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>

            {/* Progress */}
            <div>
              <label className="label">Tiến độ: {formData.progress}%</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: Number(e.target.value) })}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500 dark:bg-gray-700"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-10 text-right">
                  {formData.progress}%
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="label">Ghi chú</label>
            <textarea
              className="textarea w-full"
              rows={3}
              placeholder="Ghi chú cho task này..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                setEditingTask(null);
              }}
              className="btn-secondary"
            >
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              {editingTask ? 'Cập nhật' : 'Thêm task'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Xác nhận xóa"
        size="sm"
      >
        <div className="text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-6 h-6 text-red-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Bạn có chắc chắn muốn xóa task này? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="btn-secondary"
            >
              Hủy
            </button>
            <button
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="btn-danger"
            >
              Xóa
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
