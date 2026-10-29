import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Eye,
  ChevronDown,
  ChevronUp,
  Timer,
  CircleDot,
  X,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import Modal from '../components/Modal';
import type { Revision, RevisionStatus, RevisionTimestamp } from '../types';
import {
  generateId,
  formatDate,
  formatDateTime,
  getRevisionStatusColor,
  matchesSearch,
} from '../utils/helpers';

const REVISION_STATUSES: RevisionStatus[] = [
  'Pending Review',
  'Changes Requested',
  'Approved',
];

const statusIcons: Record<RevisionStatus, React.ReactNode> = {
  'Pending Review': <Clock className="w-4 h-4" />,
  'Changes Requested': <RotateCcw className="w-4 h-4" />,
  'Approved': <CheckCircle2 className="w-4 h-4" />,
};

interface RevisionFormData {
  projectId: string;
  revisionNumber: number;
  previewLink: string;
  status: RevisionStatus;
  feedback: string;
  maxRevisions: number;
  timestamps: RevisionTimestamp[];
}

const emptyForm: RevisionFormData = {
  projectId: '',
  revisionNumber: 1,
  previewLink: '',
  status: 'Pending Review',
  feedback: '',
  maxRevisions: 3,
  timestamps: [],
};

export default function Revisions() {
  const {
    currentUser,
    revisions,
    projects,
    addRevision,
    updateRevision,
    deleteRevision,
    settings,
  } = useStore();

  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';

  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRevision, setEditingRevision] = useState<Revision | null>(null);
  const [formData, setFormData] = useState<RevisionFormData>(emptyForm);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  // Timestamp form state
  const [newTimestampTime, setNewTimestampTime] = useState('');
  const [newTimestampComment, setNewTimestampComment] = useState('');

  // Helpers
  const getProjectName = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.name || 'Dự án không xác định';
  };

  // Grouped & Filtered revisions
  const filteredRevisions = useMemo(() => {
    return revisions.filter((rev) => {
      const project = projects.find((p) => p.id === rev.projectId);
      const projectName = project?.name || '';
      const matchSearch =
        matchesSearch(projectName, searchQuery) ||
        matchesSearch(rev.feedback, searchQuery) ||
        matchesSearch(rev.previewLink, searchQuery);
      const matchProject = !filterProject || rev.projectId === filterProject;
      const matchStatus = !filterStatus || rev.status === filterStatus;
      return matchSearch && matchProject && matchStatus;
    });
  }, [revisions, projects, searchQuery, filterProject, filterStatus]);

  const groupedByProject = useMemo(() => {
    const groups: Record<string, Revision[]> = {};
    filteredRevisions.forEach((rev) => {
      if (!groups[rev.projectId]) {
        groups[rev.projectId] = [];
      }
      groups[rev.projectId].push(rev);
    });
    // Sort revisions within each group by revision number
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => a.revisionNumber - b.revisionNumber);
    });
    return groups;
  }, [filteredRevisions]);

  // Stats
  const stats = useMemo(() => {
    const totalPending = revisions.filter((r) => r.status === 'Pending Review').length;
    const totalApproved = revisions.filter((r) => r.status === 'Approved').length;
    const projectRevisionCounts: Record<string, number> = {};
    revisions.forEach((r) => {
      projectRevisionCounts[r.projectId] = (projectRevisionCounts[r.projectId] || 0) + 1;
    });
    const projectCount = Object.keys(projectRevisionCounts).length;
    const avgRevisions = projectCount > 0
      ? (revisions.length / projectCount).toFixed(1)
      : '0';
    return { totalPending, totalApproved, avgRevisions };
  }, [revisions]);

  // Auto-calculate next revision number for a project
  const getNextRevisionNumber = (projectId: string) => {
    const projectRevisions = revisions.filter((r) => r.projectId === projectId);
    if (projectRevisions.length === 0) return 1;
    return Math.max(...projectRevisions.map((r) => r.revisionNumber)) + 1;
  };

  // Expand/collapse project groups
  const toggleProject = (projectId: string) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  // Open Add Modal
  const openAddModal = () => {
    const defaultProjectId = projects.length > 0 ? projects[0].id : '';
    const nextNumber = defaultProjectId ? getNextRevisionNumber(defaultProjectId) : 1;
    setFormData({
      ...emptyForm,
      projectId: defaultProjectId,
      revisionNumber: nextNumber,
      maxRevisions: settings.defaultMaxRevisions || 3,
    });
    setEditingRevision(null);
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (revision: Revision) => {
    setFormData({
      projectId: revision.projectId,
      revisionNumber: revision.revisionNumber,
      previewLink: revision.previewLink,
      status: revision.status,
      feedback: revision.feedback,
      maxRevisions: revision.maxRevisions,
      timestamps: [...revision.timestamps],
    });
    setEditingRevision(revision);
    setIsModalOpen(true);
  };

  // Save revision
  const handleSave = () => {
    if (!formData.projectId) return;

    if (editingRevision) {
      updateRevision(editingRevision.id, {
        projectId: formData.projectId,
        revisionNumber: formData.revisionNumber,
        previewLink: formData.previewLink,
        status: formData.status,
        feedback: formData.feedback,
        maxRevisions: formData.maxRevisions,
        timestamps: formData.timestamps,
        respondedAt:
          formData.status === 'Changes Requested' || formData.status === 'Approved'
            ? new Date().toISOString()
            : editingRevision.respondedAt,
      });
    } else {
      const newRevision: Revision = {
        id: generateId(),
        projectId: formData.projectId,
        revisionNumber: formData.revisionNumber,
        previewLink: formData.previewLink,
        status: formData.status,
        feedback: formData.feedback,
        timestamps: formData.timestamps,
        maxRevisions: formData.maxRevisions,
        submittedAt: new Date().toISOString(),
        respondedAt: null,
      };
      addRevision(newRevision);
    }
    setIsModalOpen(false);
  };

  // Delete
  const handleDelete = (id: string) => {
    deleteRevision(id);
    setDeleteConfirmId(null);
  };

  // Timestamp management
  const addTimestamp = () => {
    if (!newTimestampTime || !newTimestampComment) return;
    const ts: RevisionTimestamp = {
      id: generateId(),
      time: newTimestampTime,
      comment: newTimestampComment,
      resolved: false,
    };
    setFormData((prev) => ({
      ...prev,
      timestamps: [...prev.timestamps, ts],
    }));
    setNewTimestampTime('');
    setNewTimestampComment('');
  };

  const removeTimestamp = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      timestamps: prev.timestamps.filter((t) => t.id !== id),
    }));
  };

  const toggleTimestampResolved = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      timestamps: prev.timestamps.map((t) =>
        t.id === id ? { ...t, resolved: !t.resolved } : t
      ),
    }));
  };

  // When project changes in form, recalculate revision number
  const handleProjectChange = (projectId: string) => {
    setFormData((prev) => ({
      ...prev,
      projectId,
      revisionNumber: editingRevision ? prev.revisionNumber : getNextRevisionNumber(projectId),
    }));
  };

  // Get max revisions for a project group (take the latest one)
  const getProjectMaxRevisions = (projectRevisions: Revision[]) => {
    if (projectRevisions.length === 0) return 3;
    return projectRevisions[projectRevisions.length - 1].maxRevisions;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Quản lý Revision & Feedback
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Theo dõi các phiên bản chỉnh sửa và phản hồi từ khách hàng
          </p>
        </div>
        <button onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Thêm Revision
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Chờ duyệt</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.totalPending}
            </p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Đã duyệt</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.totalApproved}
            </p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <RotateCcw className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">TB revision/dự án</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {stats.avgRevisions}
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo dự án, feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <select
            value={filterProject}
            onChange={(e) => setFilterProject(e.target.value)}
            className="select min-w-[200px]"
          >
            <option value="">Tất cả dự án</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="select min-w-[180px]"
          >
            <option value="">Tất cả trạng thái</option>
            {REVISION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Revisions grouped by project */}
      {Object.keys(groupedByProject).length === 0 ? (
        <div className="card p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-2">
            Chưa có revision nào
          </h3>
          <p className="text-gray-400 dark:text-gray-500 mb-4">
            Tạo revision đầu tiên để bắt đầu theo dõi phản hồi từ khách hàng
          </p>
          <button onClick={openAddModal} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Thêm Revision
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByProject).map(([projectId, projectRevisions]) => {
            const project = projects.find((p) => p.id === projectId);
            const projectName = project?.name || 'Dự án không xác định';
            const maxRevisions = getProjectMaxRevisions(projectRevisions);
            const revisionCount = projectRevisions.length;
            const isOverLimit = revisionCount > maxRevisions;
            const isExpanded = expandedProjects.has(projectId);

            return (
              <div key={projectId} className="card overflow-hidden">
                {/* Project Header */}
                <button
                  onClick={() => toggleProject(projectId)}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {projectName}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {revisionCount} / {maxRevisions} revisions
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Mini status indicators */}
                    <div className="hidden sm:flex items-center gap-1">
                      {projectRevisions.map((rev) => (
                        <div
                          key={rev.id}
                          className={`w-3 h-3 rounded-full ${
                            rev.status === 'Approved'
                              ? 'bg-emerald-500'
                              : rev.status === 'Changes Requested'
                              ? 'bg-red-500'
                              : 'bg-amber-500'
                          }`}
                          title={`Lần ${rev.revisionNumber}: ${rev.status}`}
                        />
                      ))}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Over limit warning */}
                {isOverLimit && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                      ⚠️ Vượt quá số lần revision cho phép! ({revisionCount}/{maxRevisions})
                    </span>
                  </div>
                )}

                {/* Revision Timeline */}
                {isExpanded && (
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                      Timeline
                    </h4>
                    <div className="flex items-center gap-0 overflow-x-auto pb-2">
                      {projectRevisions.map((rev, idx) => (
                        <React.Fragment key={rev.id}>
                          <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                rev.status === 'Approved'
                                  ? 'bg-emerald-500'
                                  : rev.status === 'Changes Requested'
                                  ? 'bg-red-500'
                                  : 'bg-amber-500'
                              }`}
                            >
                              {rev.revisionNumber}
                            </div>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                              {formatDate(rev.submittedAt)}
                            </span>
                          </div>
                          {idx < projectRevisions.length - 1 && (
                            <div
                              className={`h-0.5 w-8 sm:w-12 flex-shrink-0 ${
                                rev.status === 'Approved'
                                  ? 'bg-emerald-300 dark:bg-emerald-700'
                                  : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {/* Revision Cards */}
                {isExpanded && (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {projectRevisions.map((rev) => {
                      const resolvedCount = rev.timestamps.filter((t) => t.resolved).length;
                      const totalTimestamps = rev.timestamps.length;

                      return (
                        <div
                          key={rev.id}
                          className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            {/* Left side */}
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                  Lần {rev.revisionNumber}
                                </h4>
                                <span
                                  className={`badge inline-flex items-center gap-1 ${getRevisionStatusColor(
                                    rev.status
                                  )}`}
                                >
                                  {statusIcons[rev.status]}
                                  {rev.status}
                                </span>
                                {totalTimestamps > 0 && (
                                  <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <Timer className="w-3 h-3" />
                                    {resolvedCount}/{totalTimestamps} resolved
                                  </span>
                                )}
                              </div>

                              {/* Preview Link */}
                              {rev.previewLink && (
                                <a
                                  href={rev.previewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  Xem preview
                                </a>
                              )}

                              {/* Feedback */}
                              {rev.feedback && (
                                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 mt-2">
                                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {rev.feedback}
                                  </p>
                                </div>
                              )}

                              {/* Timestamp Feedback Items */}
                              {rev.timestamps.length > 0 && (
                                <div className="mt-3 space-y-1.5">
                                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    Feedback theo timestamp
                                  </p>
                                  {rev.timestamps.map((ts) => (
                                    <div
                                      key={ts.id}
                                      className={`flex items-start gap-2 text-sm p-2 rounded-md ${
                                        ts.resolved
                                          ? 'bg-emerald-50 dark:bg-emerald-900/10'
                                          : 'bg-amber-50 dark:bg-amber-900/10'
                                      }`}
                                    >
                                      {ts.resolved ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                      ) : (
                                        <CircleDot className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                      )}
                                      <span className="font-mono text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded flex-shrink-0">
                                        {ts.time}
                                      </span>
                                      <span
                                        className={`text-gray-700 dark:text-gray-300 ${
                                          ts.resolved ? 'line-through opacity-60' : ''
                                        }`}
                                      >
                                        {ts.comment}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Dates */}
                              <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                                <span>Gửi: {formatDateTime(rev.submittedAt)}</span>
                                {rev.respondedAt && (
                                  <span>Phản hồi: {formatDateTime(rev.respondedAt)}</span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => openEditModal(rev)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                title="Chỉnh sửa"
                              >
                                <Edit2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                              </button>
                              {(isAdmin || isManager) && (
                                <button
                                  onClick={() => setDeleteConfirmId(rev.id)}
                                  className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                  title="Xóa"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRevision ? 'Chỉnh sửa Revision' : 'Thêm Revision mới'}
        size="lg"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Project Select */}
          <div>
            <label className="label">Dự án *</label>
            <select
              value={formData.projectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="select w-full"
            >
              <option value="">Chọn dự án...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Revision Number */}
            <div>
              <label className="label">Revision số</label>
              <input
                type="number"
                value={formData.revisionNumber}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    revisionNumber: parseInt(e.target.value) || 1,
                  }))
                }
                className="input w-full"
                min={1}
              />
            </div>

            {/* Max Revisions */}
            <div>
              <label className="label">Tối đa revision (hợp đồng)</label>
              <input
                type="number"
                value={formData.maxRevisions}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    maxRevisions: parseInt(e.target.value) || 1,
                  }))
                }
                className="input w-full"
                min={1}
              />
            </div>
          </div>

          {/* Preview Link */}
          <div>
            <label className="label">Link Preview</label>
            <input
              type="url"
              value={formData.previewLink}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, previewLink: e.target.value }))
              }
              className="input w-full"
              placeholder="https://drive.google.com/..."
            />
          </div>

          {/* Status */}
          <div>
            <label className="label">Trạng thái</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.value as RevisionStatus,
                }))
              }
              className="select w-full"
            >
              {REVISION_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Feedback */}
          <div>
            <label className="label">Feedback chung</label>
            <textarea
              value={formData.feedback}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, feedback: e.target.value }))
              }
              className="textarea w-full"
              rows={3}
              placeholder="Nhập phản hồi từ khách hàng..."
            />
          </div>

          {/* Timestamp Feedback Section */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Timer className="w-4 h-4" />
              Feedback theo Timestamp
            </h4>

            {/* Existing timestamps */}
            {formData.timestamps.length > 0 && (
              <div className="space-y-2">
                {formData.timestamps.map((ts) => (
                  <div
                    key={ts.id}
                    className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                  >
                    <input
                      type="checkbox"
                      checked={ts.resolved}
                      onChange={() => toggleTimestampResolved(ts.id)}
                      className="mt-1 rounded border-gray-300 dark:border-gray-600 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="font-mono text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">
                      {ts.time}
                    </span>
                    <span
                      className={`text-sm flex-1 text-gray-700 dark:text-gray-300 ${
                        ts.resolved ? 'line-through opacity-60' : ''
                      }`}
                    >
                      {ts.comment}
                    </span>
                    <button
                      onClick={() => removeTimestamp(ts.id)}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new timestamp */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={newTimestampTime}
                onChange={(e) => setNewTimestampTime(e.target.value)}
                className="input w-full sm:w-28 font-mono"
                placeholder="01:23:45"
              />
              <textarea
                value={newTimestampComment}
                onChange={(e) => setNewTimestampComment(e.target.value)}
                className="textarea w-full flex-1"
                rows={1}
                placeholder="Nhận xét tại thời điểm này..."
              />
              <button
                onClick={addTimestamp}
                disabled={!newTimestampTime || !newTimestampComment}
                className="btn-secondary flex items-center gap-1 flex-shrink-0 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Thêm
              </button>
            </div>
          </div>

          {/* Save buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => setIsModalOpen(false)} className="btn-ghost">
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={!formData.projectId}
              className="btn-primary disabled:opacity-50"
            >
              {editingRevision ? 'Cập nhật' : 'Tạo Revision'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Xác nhận xóa"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Bạn có chắc chắn muốn xóa revision này? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteConfirmId(null)} className="btn-ghost">
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
