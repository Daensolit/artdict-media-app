import React, { useState, useMemo } from 'react';
import {
  Plus, Search, Camera, CircleDot, Move3d, Lightbulb, Mic, Battery,
  HardDrive, Plane, Monitor, Triangle, Package, Edit2, Trash2,
  AlertTriangle, CheckSquare, User, FolderOpen, Wrench, XCircle,
  ClipboardList, ChevronDown, ChevronUp, Cable, SlidersHorizontal,
  Disc, Box,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import Modal from '../components/Modal';
import {
  generateId,
  formatDate,
  getEquipmentStatusColor,
  matchesSearch,
  daysUntil,
} from '../utils/helpers';
import type {
  Equipment as EquipmentType,
  EquipmentCategory,
  EquipmentStatus,
  EquipmentChecklist,
  EquipmentChecklistItem,
} from '../types';

// ── Category icon mapping ──────────────────────────────────────────
const categoryIconMap: Record<EquipmentCategory, React.ReactNode> = {
  Camera: <Camera className="w-5 h-5" />,
  Lens: <CircleDot className="w-5 h-5" />,
  Gimbal: <Move3d className="w-5 h-5" />,
  Light: <Lightbulb className="w-5 h-5" />,
  Microphone: <Mic className="w-5 h-5" />,
  Battery: <Battery className="w-5 h-5" />,
  'Memory Card': <HardDrive className="w-5 h-5" />,
  Drone: <Plane className="w-5 h-5" />,
  Monitor: <Monitor className="w-5 h-5" />,
  Tripod: <Triangle className="w-5 h-5" />,
  'Audio Recorder': <Disc className="w-5 h-5" />,
  Cable: <Cable className="w-5 h-5" />,
  Filter: <SlidersHorizontal className="w-5 h-5" />,
  Other: <Box className="w-5 h-5" />,
};

const CATEGORIES: EquipmentCategory[] = [
  'Camera', 'Lens', 'Gimbal', 'Light', 'Microphone',
  'Battery', 'Memory Card', 'Drone', 'Monitor', 'Tripod',
  'Audio Recorder', 'Cable', 'Filter', 'Other',
];

const STATUSES: EquipmentStatus[] = ['Available', 'In Use', 'Maintenance', 'Lost'];

const statusVietnamese: Record<EquipmentStatus, string> = {
  Available: 'Sẵn sàng',
  'In Use': 'Đang sử dụng',
  Maintenance: 'Bảo trì',
  Lost: 'Thất lạc',
};

// ── Blank form data ────────────────────────────────────────────────
interface EquipmentForm {
  name: string;
  category: EquipmentCategory;
  brand: string;
  model: string;
  serialNumber: string;
  status: EquipmentStatus;
  assignedToId: string;
  currentProjectId: string;
  purchaseDate: string;
  maintenanceDueDate: string;
  notes: string;
}

const blankForm: EquipmentForm = {
  name: '',
  category: 'Camera',
  brand: '',
  model: '',
  serialNumber: '',
  status: 'Available',
  assignedToId: '',
  currentProjectId: '',
  purchaseDate: '',
  maintenanceDueDate: '',
  notes: '',
};

// ── Component ──────────────────────────────────────────────────────
export default function Equipment() {
  const {
    currentUser,
    equipment,
    teamMembers,
    projects,
    equipmentChecklists,
    addEquipment,
    updateEquipment,
    deleteEquipment,
    addEquipmentChecklist,
    updateEquipmentChecklist,
    deleteEquipmentChecklist,
  } = useStore();

  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const canManageEquipment = isAdmin || (isManager && currentUser?.permissions?.canManageEquipment);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EquipmentForm>(blankForm);
  const [deleteTarget, setDeleteTarget] = useState<EquipmentType | null>(null);

  // Checklist section
  const [checklistProjectId, setChecklistProjectId] = useState<string>('');
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<EquipmentChecklist | null>(null);
  const [checklistShootDate, setChecklistShootDate] = useState('');
  const [checklistResponsible, setChecklistResponsible] = useState('');
  const [checklistNotes, setChecklistNotes] = useState('');
  const [checklistItems, setChecklistItems] = useState<EquipmentChecklistItem[]>([]);
  const [deleteChecklistTarget, setDeleteChecklistTarget] = useState<EquipmentChecklist | null>(null);

  // ── Derived data ──────────────────────────────────────────────
  const counts = useMemo(() => {
    const total = equipment.length;
    const available = equipment.filter((e) => e.status === 'Available').length;
    const inUse = equipment.filter((e) => e.status === 'In Use').length;
    const maintenance = equipment.filter((e) => e.status === 'Maintenance').length;
    const lost = equipment.filter((e) => e.status === 'Lost').length;
    return { total, available, inUse, maintenance, lost };
  }, [equipment]);

  const filtered = useMemo(() => {
    return equipment.filter((e) => {
      const search = matchesSearch(
        `${e.name} ${e.brand} ${e.model} ${e.serialNumber}`,
        searchQuery,
      );
      const cat = filterCategory === 'all' || e.category === filterCategory;
      const st = filterStatus === 'all' || e.status === filterStatus;
      return search && cat && st;
    });
  }, [equipment, searchQuery, filterCategory, filterStatus]);

  const memberName = (id: string | null) =>
    id ? teamMembers.find((m) => m.id === id)?.name ?? '—' : '—';

  const projectName = (id: string | null) =>
    id ? projects.find((p) => p.id === id)?.name ?? '—' : '—';

  const equipmentName = (id: string) =>
    equipment.find((e) => e.id === id)?.name ?? id;

  // ── Form handlers ─────────────────────────────────────────────
  const openAdd = () => {
    setEditingId(null);
    setForm(blankForm);
    setIsFormOpen(true);
  };

  const openEdit = (item: EquipmentType) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      category: item.category,
      brand: item.brand,
      model: item.model,
      serialNumber: item.serialNumber,
      status: item.status,
      assignedToId: item.assignedToId ?? '',
      currentProjectId: item.currentProjectId ?? '',
      purchaseDate: item.purchaseDate,
      maintenanceDueDate: item.maintenanceDueDate ?? '',
      notes: item.notes,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    if (editingId) {
      updateEquipment(editingId, {
        ...form,
        assignedToId: form.assignedToId || null,
        currentProjectId: form.currentProjectId || null,
        maintenanceDueDate: form.maintenanceDueDate || null,
      });
    } else {
      addEquipment({
        id: generateId(),
        ...form,
        assignedToId: form.assignedToId || null,
        currentProjectId: form.currentProjectId || null,
        maintenanceDueDate: form.maintenanceDueDate || null,
        createdAt: now,
      });
    }
    setIsFormOpen(false);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      deleteEquipment(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  // ── Checklist handlers ────────────────────────────────────────
  const projectChecklists = useMemo(
    () => equipmentChecklists.filter((c) => c.projectId === checklistProjectId),
    [equipmentChecklists, checklistProjectId],
  );

  const openAddChecklist = () => {
    setEditingChecklist(null);
    setChecklistShootDate('');
    setChecklistResponsible('');
    setChecklistNotes('');
    setChecklistItems([]);
    setChecklistModalOpen(true);
  };

  const openEditChecklist = (cl: EquipmentChecklist) => {
    setEditingChecklist(cl);
    setChecklistShootDate(cl.shootDate);
    setChecklistResponsible(cl.responsiblePersonId);
    setChecklistNotes(cl.notes);
    setChecklistItems([...cl.items]);
    setChecklistModalOpen(true);
  };

  const toggleChecklistEquipment = (eqId: string) => {
    setChecklistItems((prev) => {
      const exists = prev.find((i) => i.equipmentId === eqId);
      if (exists) return prev.filter((i) => i.equipmentId !== eqId);
      return [...prev, { equipmentId: eqId, checked: false, assignedToId: '', returnedChecked: false }];
    });
  };

  const updateChecklistItemField = (
    eqId: string,
    field: keyof EquipmentChecklistItem,
    value: string | boolean,
  ) => {
    setChecklistItems((prev) =>
      prev.map((i) => (i.equipmentId === eqId ? { ...i, [field]: value } : i)),
    );
  };

  const handleChecklistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingChecklist) {
      updateEquipmentChecklist(editingChecklist.id, {
        shootDate: checklistShootDate,
        responsiblePersonId: checklistResponsible,
        notes: checklistNotes,
        items: checklistItems,
      });
    } else {
      addEquipmentChecklist({
        id: generateId(),
        projectId: checklistProjectId,
        shootDate: checklistShootDate,
        responsiblePersonId: checklistResponsible,
        notes: checklistNotes,
        items: checklistItems,
        createdAt: new Date().toISOString(),
      });
    }
    setChecklistModalOpen(false);
  };

  const confirmDeleteChecklist = () => {
    if (deleteChecklistTarget) {
      deleteEquipmentChecklist(deleteChecklistTarget.id);
      setDeleteChecklistTarget(null);
    }
  };

  // Inline toggle for existing checklists
  const toggleItemChecked = (clId: string, eqId: string) => {
    const cl = equipmentChecklists.find((c) => c.id === clId);
    if (!cl) return;
    updateEquipmentChecklist(clId, {
      items: cl.items.map((i) =>
        i.equipmentId === eqId ? { ...i, checked: !i.checked } : i,
      ),
    });
  };

  const toggleItemReturned = (clId: string, eqId: string) => {
    const cl = equipmentChecklists.find((c) => c.id === clId);
    if (!cl) return;
    updateEquipmentChecklist(clId, {
      items: cl.items.map((i) =>
        i.equipmentId === eqId ? { ...i, returnedChecked: !i.returnedChecked } : i,
      ),
    });
  };

  // ── Stats cards config ────────────────────────────────────────
  const stats = [
    { label: 'Tổng thiết bị', value: counts.total, icon: <Package className="w-5 h-5" />, color: 'text-gray-600 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-800' },
    { label: 'Sẵn sàng', value: counts.available, icon: <CheckSquare className="w-5 h-5" />, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    { label: 'Đang sử dụng', value: counts.inUse, icon: <User className="w-5 h-5" />, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Bảo trì', value: counts.maintenance, icon: <Wrench className="w-5 h-5" />, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    { label: 'Thất lạc', value: counts.lost, icon: <XCircle className="w-5 h-5" />, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20' },
  ];

  // ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Quản lý Thiết bị & Gear
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Theo dõi, phân bổ và bảo trì trang thiết bị sản xuất
          </p>
        </div>
        {canManageEquipment && (
          <button className="btn-primary flex items-center gap-2" onClick={openAdd}>
            <Plus className="w-4 h-4" /> Thêm thiết bị
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${s.bg} ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-10 w-full"
            placeholder="Tìm thiết bị..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="select"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          <option value="all">Tất cả loại</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          className="select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Tất cả trạng thái</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{statusVietnamese[s]}</option>
          ))}
        </select>
      </div>

      {/* Equipment grid */}
      {filtered.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <Package className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">
            Không tìm thấy thiết bị
          </h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Thêm thiết bị mới hoặc thay đổi bộ lọc
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item) => {
            const maintenanceDays = item.maintenanceDueDate
              ? daysUntil(item.maintenanceDueDate)
              : null;
            const maintenanceWarning = maintenanceDays !== null && maintenanceDays <= 7;

            return (
              <div
                key={item.id}
                className="card p-4 flex flex-col gap-3 hover:shadow-lg transition-shadow group"
              >
                {/* Top row: icon + actions */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                      {categoryIconMap[item.category]}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {item.brand} {item.model}
                      </p>
                    </div>
                  </div>
                  {canManageEquipment && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        className="btn-ghost p-1.5"
                        onClick={() => openEdit(item)}
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button
                          className="btn-ghost p-1.5 text-red-500"
                          onClick={() => setDeleteTarget(item)}
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Status badge */}
                <span
                  className={`badge self-start text-xs ${getEquipmentStatusColor(item.status)}`}
                >
                  {statusVietnamese[item.status]}
                </span>

                {/* Details */}
                <div className="text-xs space-y-1 text-gray-500 dark:text-gray-400">
                  {item.serialNumber && (
                    <p>
                      <span className="font-medium text-gray-600 dark:text-gray-300">S/N:</span>{' '}
                      {item.serialNumber}
                    </p>
                  )}
                  <p>
                    <span className="font-medium text-gray-600 dark:text-gray-300">
                      Người giữ:
                    </span>{' '}
                    {memberName(item.assignedToId)}
                  </p>
                  <p>
                    <span className="font-medium text-gray-600 dark:text-gray-300">
                      Dự án:
                    </span>{' '}
                    {projectName(item.currentProjectId)}
                  </p>
                </div>

                {/* Maintenance warning */}
                {maintenanceWarning && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2 py-1">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      Bảo trì{' '}
                      {maintenanceDays! <= 0
                        ? 'quá hạn'
                        : `trong ${maintenanceDays} ngày`}{' '}
                      ({formatDate(item.maintenanceDueDate!)})
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Checklist Section ─────────────────────────────────── */}
      <div className="card overflow-hidden">
        <button
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          onClick={() => setIsChecklistOpen((o) => !o)}
        >
          <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-gray-100">
            <ClipboardList className="w-5 h-5" />
            Checklist thiết bị theo dự án
          </div>
          {isChecklistOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {isChecklistOpen && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4">
            {/* Project picker */}
            <div className="flex flex-col sm:flex-row gap-4">
              <select
                className="select flex-1"
                value={checklistProjectId}
                onChange={(e) => setChecklistProjectId(e.target.value)}
              >
                <option value="">— Chọn dự án —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {checklistProjectId && canManageEquipment && (
                <button className="btn-primary flex items-center gap-2" onClick={openAddChecklist}>
                  <Plus className="w-4 h-4" /> Tạo checklist
                </button>
              )}
            </div>

            {/* Existing checklists */}
            {checklistProjectId && projectChecklists.length === 0 && (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Chưa có checklist nào cho dự án này</p>
              </div>
            )}

            {projectChecklists.map((cl) => (
              <div
                key={cl.id}
                className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      Ngày quay: {formatDate(cl.shootDate)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Người phụ trách: {memberName(cl.responsiblePersonId)}
                    </p>
                  </div>
                  {canManageEquipment && (
                    <div className="flex gap-1">
                      <button
                        className="btn-ghost p-1.5"
                        onClick={() => openEditChecklist(cl)}
                        title="Sửa checklist"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button
                          className="btn-ghost p-1.5 text-red-500"
                          onClick={() => setDeleteChecklistTarget(cl)}
                          title="Xóa checklist"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Items table */}
                {cl.items.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                          <th className="pb-2 pr-2">Thiết bị</th>
                          <th className="pb-2 pr-2">Người giữ</th>
                          <th className="pb-2 pr-2 text-center">Đã lấy</th>
                          <th className="pb-2 text-center">Đã trả</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cl.items.map((item) => (
                          <tr
                            key={item.equipmentId}
                            className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                          >
                            <td className="py-2 pr-2 text-gray-900 dark:text-gray-100">
                              {equipmentName(item.equipmentId)}
                            </td>
                            <td className="py-2 pr-2 text-gray-500 dark:text-gray-400">
                              {memberName(item.assignedToId)}
                            </td>
                            <td className="py-2 pr-2 text-center">
                              <input
                                type="checkbox"
                                checked={item.checked}
                                onChange={() => toggleItemChecked(cl.id, item.equipmentId)}
                                className="w-4 h-4 rounded accent-blue-600"
                              />
                            </td>
                            <td className="py-2 text-center">
                              <input
                                type="checkbox"
                                checked={item.returnedChecked}
                                onChange={() => toggleItemReturned(cl.id, item.equipmentId)}
                                className="w-4 h-4 rounded accent-emerald-600"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {cl.notes && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">{cl.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ═══════════ Modals ═══════════ */}

      {/* Add / Edit equipment */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? 'Chỉnh sửa thiết bị' : 'Thêm thiết bị mới'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Name */}
            <div>
              <label className="label">Tên thiết bị *</label>
              <input
                className="input w-full"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            {/* Category */}
            <div>
              <label className="label">Loại *</label>
              <select
                className="select w-full"
                value={form.category}
                onChange={(e) =>
                  setForm({ ...form, category: e.target.value as EquipmentCategory })
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {/* Brand */}
            <div>
              <label className="label">Hãng</label>
              <input
                className="input w-full"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
              />
            </div>
            {/* Model */}
            <div>
              <label className="label">Model</label>
              <input
                className="input w-full"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
              />
            </div>
            {/* Serial */}
            <div>
              <label className="label">Số Serial</label>
              <input
                className="input w-full"
                value={form.serialNumber}
                onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
              />
            </div>
            {/* Status */}
            <div>
              <label className="label">Trạng thái *</label>
              <select
                className="select w-full"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as EquipmentStatus })
                }
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{statusVietnamese[s]}</option>
                ))}
              </select>
            </div>
            {/* Assigned to */}
            <div>
              <label className="label">Người giữ</label>
              <select
                className="select w-full"
                value={form.assignedToId}
                onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
              >
                <option value="">— Không —</option>
                {teamMembers
                  .filter((m) => m.isActive)
                  .map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
              </select>
            </div>
            {/* Current project */}
            <div>
              <label className="label">Dự án hiện tại</label>
              <select
                className="select w-full"
                value={form.currentProjectId}
                onChange={(e) => setForm({ ...form, currentProjectId: e.target.value })}
              >
                <option value="">— Không —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            {/* Purchase date */}
            <div>
              <label className="label">Ngày mua</label>
              <input
                type="date"
                className="input w-full"
                value={form.purchaseDate}
                onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
              />
            </div>
            {/* Maintenance due */}
            <div>
              <label className="label">Bảo trì tiếp theo</label>
              <input
                type="date"
                className="input w-full"
                value={form.maintenanceDueDate}
                onChange={(e) => setForm({ ...form, maintenanceDueDate: e.target.value })}
              />
            </div>
          </div>
          {/* Notes */}
          <div>
            <label className="label">Ghi chú</label>
            <textarea
              className="textarea w-full"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setIsFormOpen(false)}>
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              {editingId ? 'Lưu thay đổi' : 'Thêm thiết bị'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete equipment confirmation */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Xác nhận xóa"
        size="sm"
      >
        <p className="text-gray-600 dark:text-gray-300">
          Bạn có chắc muốn xóa thiết bị{' '}
          <span className="font-semibold">{deleteTarget?.name}</span>? Hành động này không thể
          hoàn tác.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button className="btn-secondary" onClick={() => setDeleteTarget(null)}>
            Hủy
          </button>
          <button className="btn-danger" onClick={confirmDelete}>
            Xóa
          </button>
        </div>
      </Modal>

      {/* Add / Edit checklist modal */}
      <Modal
        isOpen={checklistModalOpen}
        onClose={() => setChecklistModalOpen(false)}
        title={editingChecklist ? 'Chỉnh sửa checklist' : 'Tạo checklist mới'}
        size="xl"
      >
        <form onSubmit={handleChecklistSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Ngày quay *</label>
              <input
                type="date"
                className="input w-full"
                required
                value={checklistShootDate}
                onChange={(e) => setChecklistShootDate(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Người phụ trách *</label>
              <select
                className="select w-full"
                required
                value={checklistResponsible}
                onChange={(e) => setChecklistResponsible(e.target.value)}
              >
                <option value="">— Chọn —</option>
                {teamMembers
                  .filter((m) => m.isActive)
                  .map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
              </select>
            </div>
            <div>
              <label className="label">Ghi chú</label>
              <input
                className="input w-full"
                value={checklistNotes}
                onChange={(e) => setChecklistNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Equipment picker */}
          <div>
            <label className="label mb-2">Chọn thiết bị</label>
            <div className="max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-xl divide-y divide-gray-100 dark:divide-gray-800">
              {equipment.length === 0 ? (
                <p className="p-4 text-sm text-gray-400">Chưa có thiết bị nào</p>
              ) : (
                equipment.map((eq) => {
                  const selected = checklistItems.some((i) => i.equipmentId === eq.id);
                  return (
                    <div
                      key={eq.id}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                        selected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                      onClick={() => toggleChecklistEquipment(eq.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        readOnly
                        className="w-4 h-4 rounded accent-blue-600"
                      />
                      <div className="text-gray-500 dark:text-gray-400">
                        {categoryIconMap[eq.category]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {eq.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {eq.brand} {eq.model}
                        </p>
                      </div>
                      <span
                        className={`badge text-xs ${getEquipmentStatusColor(eq.status)}`}
                      >
                        {statusVietnamese[eq.status]}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Assign person per item */}
          {checklistItems.length > 0 && (
            <div>
              <label className="label mb-2">Phân công thiết bị</label>
              <div className="space-y-2">
                {checklistItems.map((ci) => (
                  <div
                    key={ci.equipmentId}
                    className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 py-2"
                  >
                    <span className="text-sm flex-1 text-gray-900 dark:text-gray-100 truncate">
                      {equipmentName(ci.equipmentId)}
                    </span>
                    <select
                      className="select text-sm"
                      value={ci.assignedToId}
                      onChange={(e) =>
                        updateChecklistItemField(ci.equipmentId, 'assignedToId', e.target.value)
                      }
                    >
                      <option value="">— Người giữ —</option>
                      {teamMembers
                        .filter((m) => m.isActive)
                        .map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setChecklistModalOpen(false)}
            >
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              {editingChecklist ? 'Lưu thay đổi' : 'Tạo checklist'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete checklist confirmation */}
      <Modal
        isOpen={!!deleteChecklistTarget}
        onClose={() => setDeleteChecklistTarget(null)}
        title="Xác nhận xóa checklist"
        size="sm"
      >
        <p className="text-gray-600 dark:text-gray-300">
          Bạn có chắc muốn xóa checklist ngày{' '}
          <span className="font-semibold">
            {deleteChecklistTarget ? formatDate(deleteChecklistTarget.shootDate) : ''}
          </span>
          ? Hành động này không thể hoàn tác.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button className="btn-secondary" onClick={() => setDeleteChecklistTarget(null)}>
            Hủy
          </button>
          <button className="btn-danger" onClick={confirmDeleteChecklist}>
            Xóa
          </button>
        </div>
      </Modal>
    </div>
  );
}
