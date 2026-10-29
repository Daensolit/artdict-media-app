import React, { useState, useMemo } from 'react';
import {
  Plus, Search, Users, Mail, Phone, MapPin, Building2,
  Edit3, Trash2, ChevronDown, ChevronUp, FileText,
  StickyNote, DollarSign, FolderOpen, UserCircle,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import Modal from '../components/Modal';
import {
  generateId, matchesSearch, formatCurrency, formatDate,
  getProjectStatusColor, getPaymentStatusColor,
} from '../utils/helpers';
import type { Client } from '../types';

const emptyForm = {
  name: '',
  company: '',
  email: '',
  phone: '',
  address: '',
  notes: '',
};

export default function Clients() {
  const {
    clients, projects, invoices, settings,
    addClient, updateClient, deleteClient,
  } = useStore();

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // ---------- derived data ----------
  const clientsWithStats = useMemo(() => {
    return clients.map((client) => {
      const clientProjects = projects.filter((p) => p.clientId === client.id);
      const clientInvoices = invoices.filter((inv) => inv.clientId === client.id);
      const totalRevenue = clientInvoices.reduce((sum, inv) => sum + inv.total, 0);
      return { ...client, clientProjects, clientInvoices, totalRevenue };
    });
  }, [clients, projects, invoices]);

  const filteredClients = useMemo(() => {
    return clientsWithStats.filter(
      (c) => matchesSearch(c.name, search) || matchesSearch(c.company, search)
    );
  }, [clientsWithStats, search]);

  // ---------- handlers ----------
  const openAdd = () => {
    setEditingClient(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setForm({
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone,
      address: client.address,
      notes: client.notes,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (editingClient) {
      updateClient(editingClient.id, { ...form });
    } else {
      const newClient: Client = {
        id: generateId(),
        ...form,
        projectIds: [],
        createdAt: new Date().toISOString(),
      };
      addClient(newClient);
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    deleteClient(id);
    setDeleteConfirm(null);
    if (expandedId === id) setExpandedId(null);
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // ---------- render ----------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Khách hàng</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Quản lý thông tin khách hàng và dự án liên quan
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openAdd}>
          <Plus className="w-4 h-4" />
          Thêm khách hàng
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="input pl-10 w-full"
          placeholder="Tìm theo tên, công ty..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Client Cards */}
      {filteredClients.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">
            {search ? 'Không tìm thấy khách hàng' : 'Chưa có khách hàng'}
          </h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {search ? 'Thử tìm với từ khóa khác' : 'Bấm "Thêm khách hàng" để bắt đầu'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredClients.map((client) => {
            const isExpanded = expandedId === client.id;
            return (
              <div key={client.id} className="card overflow-hidden">
                {/* Card header */}
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="flex-shrink-0 w-11 h-11 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <UserCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                          {client.name}
                        </h3>
                        {client.company && (
                          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                            <Building2 className="w-3.5 h-3.5" />
                            <span className="truncate">{client.company}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        className="btn-ghost p-1.5"
                        onClick={() => openEdit(client)}
                        title="Sửa"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        className="btn-ghost p-1.5 text-red-500 hover:text-red-700"
                        onClick={() => setDeleteConfirm(client.id)}
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Contact info */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
                    {client.email && (
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 truncate">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    {client.phone && (
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 sm:col-span-2 truncate">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{client.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Stats row */}
                  <div className="mt-4 flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-1.5 text-sm">
                      <FolderOpen className="w-4 h-4 text-indigo-500" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {client.clientProjects.length}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">dự án</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <DollarSign className="w-4 h-4 text-emerald-500" />
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {formatCurrency(client.totalRevenue, settings.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {client.notes && (
                    <div className="mt-3 flex items-start gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                      <StickyNote className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span className="line-clamp-2">{client.notes}</span>
                    </div>
                  )}

                  {/* Expand toggle */}
                  {client.clientProjects.length > 0 && (
                    <button
                      className="mt-3 flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      onClick={() => toggleExpand(client.id)}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-4 h-4" /> Ẩn chi tiết
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4" /> Xem dự án ({client.clientProjects.length})
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-gray-100 dark:border-dark-700 bg-gray-50 dark:bg-dark-800/50 px-5 py-4 space-y-4">
                    {/* Projects list */}
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                        <FolderOpen className="w-4 h-4" /> Dự án
                      </h4>
                      <div className="space-y-2">
                        {client.clientProjects.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between bg-white dark:bg-dark-900 rounded-lg px-3 py-2 text-sm"
                          >
                            <div className="min-w-0">
                              <span className="font-medium text-gray-900 dark:text-gray-100 truncate block">
                                {p.name}
                              </span>
                              <span className="text-xs text-gray-400">
                                {p.type} · Deadline: {formatDate(p.deadline)}
                              </span>
                            </div>
                            <span className={`badge ${getProjectStatusColor(p.status)} ml-2 flex-shrink-0`}>
                              {p.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Invoices list */}
                    {client.clientInvoices.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                          <FileText className="w-4 h-4" /> Hóa đơn
                        </h4>
                        <div className="space-y-2">
                          {client.clientInvoices.map((inv) => {
                            const project = projects.find((p) => p.id === inv.projectId);
                            return (
                              <div
                                key={inv.id}
                                className="flex items-center justify-between bg-white dark:bg-dark-900 rounded-lg px-3 py-2 text-sm"
                              >
                                <div className="min-w-0">
                                  <span className="font-medium text-gray-900 dark:text-gray-100 truncate block">
                                    {inv.invoiceNumber}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {project?.name ?? '—'} · {formatDate(inv.createdAt)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {formatCurrency(inv.total, settings.currency)}
                                  </span>
                                  <span className={`badge ${getPaymentStatusColor(inv.paymentStatus)}`}>
                                    {inv.paymentStatus}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingClient ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Tên khách hàng *</label>
              <input
                className="input w-full"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nguyễn Văn A"
                required
              />
            </div>
            <div>
              <label className="label">Công ty</label>
              <input
                className="input w-full"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Tên công ty"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                className="input w-full"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="label">Số điện thoại</label>
              <input
                className="input w-full"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="0123 456 789"
              />
            </div>
          </div>
          <div>
            <label className="label">Địa chỉ</label>
            <input
              className="input w-full"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Địa chỉ"
            />
          </div>
          <div>
            <label className="label">Ghi chú</label>
            <textarea
              className="textarea w-full"
              rows={3}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Ghi chú về khách hàng..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setShowModal(false)}
            >
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              {editingClient ? 'Cập nhật' : 'Thêm'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Xác nhận xóa"
        size="sm"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Bạn có chắc chắn muốn xóa khách hàng{' '}
          <strong className="text-gray-900 dark:text-gray-100">
            {clients.find((c) => c.id === deleteConfirm)?.name}
          </strong>
          ? Hành động này không thể hoàn tác.
        </p>
        <div className="flex justify-end gap-3">
          <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>
            Hủy
          </button>
          <button
            className="btn-danger"
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
          >
            Xóa
          </button>
        </div>
      </Modal>
    </div>
  );
}
