import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Eye,
  Edit3,
  Trash2,
  Download,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  PlusCircle,
  MinusCircle,
  Receipt,
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useStore } from '../store/useStore';
import Modal from '../components/Modal';
import type { Invoice, InvoiceItem, PaymentStatus } from '../types';
import {
  formatCurrency,
  formatDate,
  generateId,
  matchesSearch,
  getPaymentStatusColor,
} from '../utils/helpers';

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateInvoiceNumber(existingInvoices: Invoice[]): string {
  const year = new Date().getFullYear();
  const thisYearInvoices = existingInvoices.filter((inv) =>
    inv.invoiceNumber.startsWith(`INV-${year}`)
  );
  const nextNum = thisYearInvoices.length + 1;
  return `INV-${year}-${String(nextNum).padStart(3, '0')}`;
}

function emptyItem(): InvoiceItem {
  return { id: generateId(), description: '', quantity: 1, unitPrice: 0, total: 0 };
}

const paymentStatusOptions: PaymentStatus[] = ['Unpaid', 'Deposit', 'Partial', 'Paid'];

const paymentStatusLabels: Record<PaymentStatus, string> = {
  Unpaid: 'Chưa thanh toán',
  Deposit: 'Đã đặt cọc',
  Partial: 'Thanh toán một phần',
  Paid: 'Đã thanh toán',
};

// ─── Component ──────────────────────────────────────────────────────────────

export default function InvoicePage() {
  const {
    invoices,
    projects,
    clients,
    settings,
    addInvoice,
    updateInvoice,
    deleteInvoice,
  } = useStore();

  // UI state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'All'>('All');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);

  // Form state
  const [formProjectId, setFormProjectId] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formItems, setFormItems] = useState<InvoiceItem[]>([emptyItem()]);
  const [formTaxRate, setFormTaxRate] = useState(settings.defaultTaxRate ?? 10);
  const [formDueDate, setFormDueDate] = useState('');
  const [formPaymentStatus, setFormPaymentStatus] = useState<PaymentStatus>('Unpaid');
  const [formDepositAmount, setFormDepositAmount] = useState(0);
  const [formDepositPaidDate, setFormDepositPaidDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');

  // ── Derived data ──────────────────────────────────────────────────────────

  const getProject = (id: string) => projects.find((p) => p.id === id);
  const getClient = (id: string) => clients.find((c) => c.id === id);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const project = getProject(inv.projectId);
      const client = getClient(inv.clientId);
      const matchStatus = statusFilter === 'All' || inv.paymentStatus === statusFilter;
      const matchSearch =
        matchesSearch(inv.invoiceNumber, search) ||
        matchesSearch(project?.name || '', search) ||
        matchesSearch(client?.name || '', search);
      return matchStatus && matchSearch;
    });
  }, [invoices, search, statusFilter, projects, clients]);

  const stats = useMemo(() => {
    const total = invoices.length;
    const paid = invoices.filter((i) => i.paymentStatus === 'Paid').length;
    const unpaid = invoices.filter((i) => i.paymentStatus === 'Unpaid').length;
    const partial = invoices.filter(
      (i) => i.paymentStatus === 'Partial' || i.paymentStatus === 'Deposit'
    ).length;
    const revenue = invoices
      .filter((i) => i.paymentStatus === 'Paid')
      .reduce((sum, i) => sum + i.total, 0);
    return { total, paid, unpaid, partial, revenue };
  }, [invoices]);

  // ── Form helpers ──────────────────────────────────────────────────────────

  function resetForm() {
    setFormProjectId('');
    setFormClientId('');
    setFormItems([emptyItem()]);
    setFormTaxRate(settings.defaultTaxRate ?? 10);
    setFormDueDate('');
    setFormPaymentStatus('Unpaid');
    setFormDepositAmount(0);
    setFormDepositPaidDate('');
    setFormNotes('');
    setFormInvoiceNumber(generateInvoiceNumber(invoices));
    setEditingInvoice(null);
  }

  function openCreateModal() {
    resetForm();
    setShowFormModal(true);
  }

  function openEditModal(inv: Invoice) {
    setEditingInvoice(inv);
    setFormProjectId(inv.projectId);
    setFormClientId(inv.clientId);
    setFormItems(inv.items.length > 0 ? inv.items : [emptyItem()]);
    setFormTaxRate(inv.taxRate);
    setFormDueDate(inv.dueDate);
    setFormPaymentStatus(inv.paymentStatus);
    setFormDepositAmount(inv.depositAmount);
    setFormDepositPaidDate(inv.depositPaidDate || '');
    setFormNotes(inv.notes);
    setFormInvoiceNumber(inv.invoiceNumber);
    setShowFormModal(true);
  }

  function handleProjectChange(projectId: string) {
    setFormProjectId(projectId);
    const project = getProject(projectId);
    if (project) {
      setFormClientId(project.clientId);
    }
  }

  function updateItem(index: number, field: keyof InvoiceItem, value: string | number) {
    setFormItems((prev) => {
      const copy = [...prev];
      const item = { ...copy[index] };
      if (field === 'description') item.description = value as string;
      else if (field === 'quantity') item.quantity = Number(value) || 0;
      else if (field === 'unitPrice') item.unitPrice = Number(value) || 0;
      item.total = item.quantity * item.unitPrice;
      copy[index] = item;
      return copy;
    });
  }

  function addItem() {
    setFormItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(index: number) {
    setFormItems((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  const subtotal = formItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const taxAmount = (subtotal * formTaxRate) / 100;
  const total = subtotal + taxAmount;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalItems = formItems.map((item) => ({
      ...item,
      total: item.quantity * item.unitPrice,
    }));

    if (editingInvoice) {
      updateInvoice(editingInvoice.id, {
        projectId: formProjectId,
        clientId: formClientId,
        items: finalItems,
        subtotal,
        tax: taxAmount,
        taxRate: formTaxRate,
        total,
        paymentStatus: formPaymentStatus,
        depositAmount: formDepositAmount,
        depositPaidDate: formDepositPaidDate || null,
        dueDate: formDueDate,
        notes: formNotes,
        companyInfo: settings.companyInfo,
      });
    } else {
      const invoice: Invoice = {
        id: generateId(),
        invoiceNumber: formInvoiceNumber,
        projectId: formProjectId,
        clientId: formClientId,
        items: finalItems,
        subtotal,
        tax: taxAmount,
        taxRate: formTaxRate,
        total,
        paymentStatus: formPaymentStatus,
        depositAmount: formDepositAmount,
        depositPaidDate: formDepositPaidDate || null,
        dueDate: formDueDate,
        paidDate: formPaymentStatus === 'Paid' ? new Date().toISOString() : null,
        notes: formNotes,
        companyInfo: settings.companyInfo,
        createdAt: new Date().toISOString(),
      };
      addInvoice(invoice);
    }
    setShowFormModal(false);
    resetForm();
  }

  function handleDelete() {
    if (deleteTarget) {
      deleteInvoice(deleteTarget.id);
      setDeleteTarget(null);
      setShowDeleteConfirm(false);
    }
  }

  // ── PDF Export ─────────────────────────────────────────────────────────────

  function exportPDF(inv: Invoice) {
    const project = getProject(inv.projectId);
    const client = getClient(inv.clientId);
    const company = inv.companyInfo;

    const doc = new jsPDF();

    // Company header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(company.name || 'Company Name', 14, 22);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    const headerLines: string[] = [];
    if (company.address) headerLines.push(company.address);
    if (company.phone) headerLines.push(`DT: ${company.phone}`);
    if (company.email) headerLines.push(`Email: ${company.email}`);
    if (company.website) headerLines.push(company.website);
    if (company.taxId) headerLines.push(`MST: ${company.taxId}`);
    headerLines.forEach((line, i) => doc.text(line, 14, 28 + i * 5));

    // Title
    doc.setTextColor(0);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('HOA DON', 140, 22, { align: 'center' });

    // Invoice meta
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const metaX = 140;
    doc.text(`So: ${inv.invoiceNumber}`, metaX, 34);
    doc.text(`Ngay: ${formatDate(inv.createdAt)}`, metaX, 40);
    doc.text(`Han thanh toan: ${formatDate(inv.dueDate)}`, metaX, 46);

    // Separator line
    const startY = 28 + headerLines.length * 5 + 4;
    doc.setDrawColor(200);
    doc.line(14, Math.max(startY, 54), 196, Math.max(startY, 54));

    // Client info
    const clientY = Math.max(startY, 54) + 6;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Thong tin khach hang:', 14, clientY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(client?.name || '', 14, clientY + 6);
    if (client?.company) doc.text(client.company, 14, clientY + 12);
    if (client?.address) doc.text(client.address, 14, clientY + 18);
    if (client?.phone) doc.text(`DT: ${client.phone}`, 14, clientY + 24);
    if (client?.email) doc.text(`Email: ${client.email}`, 14, clientY + 30);

    if (project) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Du an:', 140, clientY);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(project.name, 140, clientY + 6);
    }

    // Items table
    const tableStartY = clientY + 38;
    autoTable(doc, {
      startY: tableStartY,
      head: [['#', 'Mo ta', 'SL', 'Don gia', 'Thanh tien']],
      body: inv.items.map((item, i) => [
        i + 1,
        item.description,
        item.quantity,
        formatCurrency(item.unitPrice),
        formatCurrency(item.total),
      ]),
      styles: { fontSize: 10, cellPadding: 3 },
      headStyles: { fillColor: [51, 51, 51], textColor: 255 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        2: { halign: 'center', cellWidth: 18 },
        3: { halign: 'right', cellWidth: 35 },
        4: { halign: 'right', cellWidth: 38 },
      },
      theme: 'grid',
    });

    // Totals
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const finalY = (doc as any).lastAutoTable.finalY + 6;
    doc.setFontSize(10);
    doc.text('Tam tinh:', 130, finalY);
    doc.text(formatCurrency(inv.subtotal), 196, finalY, { align: 'right' });
    doc.text(`Thue (${inv.taxRate}%):`, 130, finalY + 7);
    doc.text(formatCurrency(inv.tax), 196, finalY + 7, { align: 'right' });
    doc.setDrawColor(200);
    doc.line(130, finalY + 10, 196, finalY + 10);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Tong cong:', 130, finalY + 17);
    doc.text(formatCurrency(inv.total), 196, finalY + 17, { align: 'right' });

    if (inv.depositAmount > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Dat coc:', 130, finalY + 25);
      doc.text(formatCurrency(inv.depositAmount), 196, finalY + 25, { align: 'right' });
      doc.text('Con lai:', 130, finalY + 32);
      doc.text(formatCurrency(inv.total - inv.depositAmount), 196, finalY + 32, {
        align: 'right',
      });
    }

    // Bank info
    const bankY = finalY + (inv.depositAmount > 0 ? 42 : 28);
    if (company.bankName || company.bankAccount) {
      doc.setDrawColor(200);
      doc.line(14, bankY, 196, bankY);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Thong tin chuyen khoan:', 14, bankY + 7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      if (company.bankName) doc.text(`Ngan hang: ${company.bankName}`, 14, bankY + 14);
      if (company.bankAccount)
        doc.text(`So tai khoan: ${company.bankAccount}`, 14, bankY + 21);
      if (company.bankAccountName)
        doc.text(`Chu tai khoan: ${company.bankAccountName}`, 14, bankY + 28);
    }

    // Notes
    if (inv.notes) {
      const notesY = bankY + (company.bankName ? 36 : 8);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text(`Ghi chu: ${inv.notes}`, 14, notesY, { maxWidth: 180 });
    }

    doc.save(`${inv.invoiceNumber}.pdf`);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Quản lý Invoice
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Tạo, quản lý và xuất hoá đơn cho dự án
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openCreateModal}>
          <Plus className="w-4 h-4" />
          Tạo Invoice mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={<FileText className="w-5 h-5 text-blue-600" />}
          label="Tổng invoice"
          value={stats.total}
          bg="bg-blue-50 dark:bg-blue-900/20"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
          label="Đã thanh toán"
          value={stats.paid}
          bg="bg-emerald-50 dark:bg-emerald-900/20"
        />
        <StatCard
          icon={<AlertCircle className="w-5 h-5 text-red-600" />}
          label="Chưa thanh toán"
          value={stats.unpaid}
          bg="bg-red-50 dark:bg-red-900/20"
        />
        <StatCard
          icon={<Clock className="w-5 h-5 text-amber-600" />}
          label="Thanh toán 1 phần"
          value={stats.partial}
          bg="bg-amber-50 dark:bg-amber-900/20"
        />
        <StatCard
          icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
          label="Doanh thu"
          value={formatCurrency(stats.revenue)}
          bg="bg-emerald-50 dark:bg-emerald-900/20"
          highlight
        />
      </div>

      {/* Search & filters */}
      <div className="card p-4 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-10 w-full"
            placeholder="Tìm theo số hoá đơn, dự án, khách hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="select w-full sm:w-48"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'All')}
        >
          <option value="All">Tất cả trạng thái</option>
          {paymentStatusOptions.map((s) => (
            <option key={s} value={s}>
              {paymentStatusLabels[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filteredInvoices.length === 0 ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <Receipt className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Chưa có invoice nào
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
            Tạo invoice đầu tiên để bắt đầu theo dõi thanh toán
          </p>
          <button className="btn-primary flex items-center gap-2" onClick={openCreateModal}>
            <Plus className="w-4 h-4" />
            Tạo Invoice mới
          </button>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr>
                <th className="table-header">Số Invoice</th>
                <th className="table-header">Dự án</th>
                <th className="table-header">Khách hàng</th>
                <th className="table-header">Ngày tạo</th>
                <th className="table-header">Hạn thanh toán</th>
                <th className="table-header text-right">Tổng tiền</th>
                <th className="table-header">Trạng thái</th>
                <th className="table-header text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((inv) => {
                const project = getProject(inv.projectId);
                const client = getClient(inv.clientId);
                return (
                  <tr
                    key={inv.id}
                    className="hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors"
                  >
                    <td className="table-cell font-medium text-gray-900 dark:text-gray-100">
                      {inv.invoiceNumber}
                    </td>
                    <td className="table-cell text-gray-700 dark:text-gray-300">
                      {project?.name || '—'}
                    </td>
                    <td className="table-cell text-gray-700 dark:text-gray-300">
                      {client?.name || '—'}
                    </td>
                    <td className="table-cell text-gray-500 dark:text-gray-400">
                      {formatDate(inv.createdAt)}
                    </td>
                    <td className="table-cell text-gray-500 dark:text-gray-400">
                      {formatDate(inv.dueDate)}
                    </td>
                    <td className="table-cell text-right font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="table-cell">
                      <span
                        className={`badge ${getPaymentStatusColor(inv.paymentStatus)}`}
                      >
                        {paymentStatusLabels[inv.paymentStatus]}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="btn-ghost p-1.5"
                          title="Xem"
                          onClick={() => {
                            setPreviewInvoice(inv);
                            setShowPreviewModal(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          className="btn-ghost p-1.5"
                          title="Sửa"
                          onClick={() => openEditModal(inv)}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          className="btn-ghost p-1.5"
                          title="Xuất PDF"
                          onClick={() => exportPDF(inv)}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          className="btn-ghost p-1.5 text-red-500 hover:text-red-700"
                          title="Xoá"
                          onClick={() => {
                            setDeleteTarget(inv);
                            setShowDeleteConfirm(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ────── Create / Edit Modal ────── */}
      <Modal
        isOpen={showFormModal}
        onClose={() => {
          setShowFormModal(false);
          resetForm();
        }}
        title={editingInvoice ? 'Chỉnh sửa Invoice' : 'Tạo Invoice mới'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
          {/* Top grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Invoice number */}
            <div>
              <label className="label">Số Invoice</label>
              <input className="input w-full" value={formInvoiceNumber} readOnly />
            </div>
            {/* Project */}
            <div>
              <label className="label">Dự án *</label>
              <select
                className="select w-full"
                value={formProjectId}
                onChange={(e) => handleProjectChange(e.target.value)}
                required
              >
                <option value="">-- Chọn dự án --</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Client info (auto-filled) */}
          {formClientId && (
            <div className="rounded-lg bg-gray-50 dark:bg-dark-800 p-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Khách hàng
              </p>
              {(() => {
                const c = getClient(formClientId);
                return c ? (
                  <div className="text-sm text-gray-700 dark:text-gray-300 space-y-0.5">
                    <p className="font-semibold">{c.name}</p>
                    {c.company && <p>{c.company}</p>}
                    {c.address && <p>{c.address}</p>}
                    {c.phone && <p>ĐT: {c.phone}</p>}
                    {c.email && <p>Email: {c.email}</p>}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Không tìm thấy khách hàng</p>
                );
              })()}
            </div>
          )}

          {/* Invoice Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Hạng mục</label>
              <button
                type="button"
                className="btn-ghost flex items-center gap-1 text-sm text-blue-600"
                onClick={addItem}
              >
                <PlusCircle className="w-4 h-4" />
                Thêm dòng
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead>
                  <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-dark-700">
                    <th className="py-2 pr-2 w-8">#</th>
                    <th className="py-2 pr-2">Mô tả</th>
                    <th className="py-2 pr-2 w-20 text-center">SL</th>
                    <th className="py-2 pr-2 w-32 text-right">Đơn giá</th>
                    <th className="py-2 pr-2 w-32 text-right">Thành tiền</th>
                    <th className="py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {formItems.map((item, idx) => (
                    <tr key={item.id} className="border-b border-gray-100 dark:border-dark-700">
                      <td className="py-2 pr-2 text-gray-400">{idx + 1}</td>
                      <td className="py-2 pr-2">
                        <input
                          className="input w-full"
                          placeholder="Mô tả hạng mục..."
                          value={item.description}
                          onChange={(e) => updateItem(idx, 'description', e.target.value)}
                          required
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          className="input w-full text-center"
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                          required
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <input
                          className="input w-full text-right"
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)}
                          required
                        />
                      </td>
                      <td className="py-2 pr-2 text-right font-medium text-gray-700 dark:text-gray-300">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </td>
                      <td className="py-2 text-center">
                        {formItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                          >
                            <MinusCircle className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="mt-4 flex justify-end">
              <div className="w-72 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>Tạm tính:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center gap-2 text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    Thuế (
                    <input
                      className="input w-14 text-center text-xs py-0.5"
                      type="number"
                      min="0"
                      max="100"
                      value={formTaxRate}
                      onChange={(e) => setFormTaxRate(Number(e.target.value))}
                    />
                    %):
                  </span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-gray-900 dark:text-gray-100 border-t border-gray-200 dark:border-dark-700 pt-2">
                  <span>Tổng cộng:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Deposit / Due Date / Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Hạn thanh toán *</label>
              <input
                className="input w-full"
                type="date"
                value={formDueDate}
                onChange={(e) => setFormDueDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Trạng thái</label>
              <select
                className="select w-full"
                value={formPaymentStatus}
                onChange={(e) => setFormPaymentStatus(e.target.value as PaymentStatus)}
              >
                {paymentStatusOptions.map((s) => (
                  <option key={s} value={s}>
                    {paymentStatusLabels[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tiền đặt cọc</label>
              <input
                className="input w-full"
                type="number"
                min="0"
                value={formDepositAmount}
                onChange={(e) => setFormDepositAmount(Number(e.target.value))}
              />
            </div>
          </div>

          {formDepositAmount > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Ngày đặt cọc</label>
                <input
                  className="input w-full"
                  type="date"
                  value={formDepositPaidDate}
                  onChange={(e) => setFormDepositPaidDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="label">Ghi chú</label>
            <textarea
              className="textarea w-full"
              rows={3}
              placeholder="Ghi chú thêm cho hoá đơn..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setShowFormModal(false);
                resetForm();
              }}
            >
              Huỷ
            </button>
            <button type="submit" className="btn-primary">
              {editingInvoice ? 'Cập nhật' : 'Tạo Invoice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ────── Preview Modal ────── */}
      <Modal
        isOpen={showPreviewModal}
        onClose={() => {
          setShowPreviewModal(false);
          setPreviewInvoice(null);
        }}
        title="Xem trước Invoice"
        size="xl"
      >
        {previewInvoice && (
          <InvoicePreview
            invoice={previewInvoice}
            project={getProject(previewInvoice.projectId)}
            client={getClient(previewInvoice.clientId)}
            onExport={() => exportPDF(previewInvoice)}
          />
        )}
      </Modal>

      {/* ────── Delete Confirmation Modal ────── */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
        title="Xác nhận xoá"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Bạn có chắc muốn xoá invoice{' '}
            <span className="font-semibold">{deleteTarget?.invoiceNumber}</span>? Hành động
            này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3">
            <button
              className="btn-secondary"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteTarget(null);
              }}
            >
              Huỷ
            </button>
            <button className="btn-danger" onClick={handleDelete}>
              Xoá
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  bg,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  bg: string;
  highlight?: boolean;
}) {
  return (
    <div className={`card p-4 flex items-center gap-4`}>
      <div className={`p-2.5 rounded-lg ${bg}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p
          className={`text-lg font-bold ${
            highlight
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-gray-900 dark:text-gray-100'
          }`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function InvoicePreview({
  invoice,
  project,
  client,
  onExport,
}: {
  invoice: Invoice;
  project?: ReturnType<typeof useStore.getState>['projects'][number];
  client?: ReturnType<typeof useStore.getState>['clients'][number];
  onExport: () => void;
}) {
  const company = invoice.companyInfo;

  return (
    <div className="space-y-4">
      {/* Export button */}
      <div className="flex justify-end">
        <button className="btn-primary flex items-center gap-2" onClick={onExport}>
          <Download className="w-4 h-4" />
          Xuất PDF
        </button>
      </div>

      {/* Invoice preview card */}
      <div className="border border-gray-200 dark:border-dark-700 rounded-xl p-8 bg-white dark:bg-dark-900 space-y-6 max-h-[60vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {company.name || 'Company Name'}
            </h2>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 space-y-0.5">
              {company.address && <p>{company.address}</p>}
              {company.phone && <p>ĐT: {company.phone}</p>}
              {company.email && <p>Email: {company.email}</p>}
              {company.website && <p>{company.website}</p>}
              {company.taxId && <p>MST: {company.taxId}</p>}
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              HÓA ĐƠN
            </h1>
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-0.5">
              <p>
                <span className="font-medium">Số:</span> {invoice.invoiceNumber}
              </p>
              <p>
                <span className="font-medium">Ngày:</span> {formatDate(invoice.createdAt)}
              </p>
              <p>
                <span className="font-medium">Hạn TT:</span> {formatDate(invoice.dueDate)}
              </p>
            </div>
            <span
              className={`badge mt-2 inline-block ${getPaymentStatusColor(
                invoice.paymentStatus
              )}`}
            >
              {paymentStatusLabels[invoice.paymentStatus]}
            </span>
          </div>
        </div>

        <hr className="border-gray-200 dark:border-dark-700" />

        {/* Client & project info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              Khách hàng
            </p>
            {client ? (
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-0.5">
                <p className="font-semibold text-gray-900 dark:text-gray-100">{client.name}</p>
                {client.company && <p>{client.company}</p>}
                {client.address && <p>{client.address}</p>}
                {client.phone && <p>ĐT: {client.phone}</p>}
                {client.email && <p>Email: {client.email}</p>}
              </div>
            ) : (
              <p className="text-sm text-gray-400">—</p>
            )}
          </div>
          {project && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Dự án
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {project.name}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{project.type}</p>
            </div>
          )}
        </div>

        {/* Items table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800 dark:bg-gray-700 text-white">
                <th className="py-2.5 px-3 text-left font-medium w-10">#</th>
                <th className="py-2.5 px-3 text-left font-medium">Mô tả</th>
                <th className="py-2.5 px-3 text-center font-medium w-16">SL</th>
                <th className="py-2.5 px-3 text-right font-medium w-32">Đơn giá</th>
                <th className="py-2.5 px-3 text-right font-medium w-36">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr
                  key={item.id}
                  className="border-b border-gray-100 dark:border-dark-700"
                >
                  <td className="py-2.5 px-3 text-gray-500">{i + 1}</td>
                  <td className="py-2.5 px-3 text-gray-800 dark:text-gray-200">
                    {item.description}
                  </td>
                  <td className="py-2.5 px-3 text-center text-gray-600 dark:text-gray-400">
                    {item.quantity}
                  </td>
                  <td className="py-2.5 px-3 text-right text-gray-600 dark:text-gray-400">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-gray-800 dark:text-gray-200">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-72 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Tạm tính:</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Thuế ({invoice.taxRate}%):</span>
              <span>{formatCurrency(invoice.tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-gray-900 dark:text-gray-100 border-t border-gray-300 dark:border-dark-600 pt-2 mt-1">
              <span>Tổng cộng:</span>
              <span>{formatCurrency(invoice.total)}</span>
            </div>
            {invoice.depositAmount > 0 && (
              <>
                <div className="flex justify-between text-gray-600 dark:text-gray-400 pt-1">
                  <span>Đặt cọc:</span>
                  <span>{formatCurrency(invoice.depositAmount)}</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-800 dark:text-gray-200">
                  <span>Còn lại:</span>
                  <span>{formatCurrency(invoice.total - invoice.depositAmount)}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Bank info */}
        {(company.bankName || company.bankAccount) && (
          <>
            <hr className="border-gray-200 dark:border-dark-700" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Thông tin chuyển khoản
              </p>
              <div className="text-sm text-gray-700 dark:text-gray-300 space-y-0.5">
                {company.bankName && <p>Ngân hàng: {company.bankName}</p>}
                {company.bankAccount && <p>Số tài khoản: {company.bankAccount}</p>}
                {company.bankAccountName && (
                  <p>Chủ tài khoản: {company.bankAccountName}</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* Notes */}
        {invoice.notes && (
          <>
            <hr className="border-gray-200 dark:border-dark-700" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Ghi chú
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 italic whitespace-pre-line">
                {invoice.notes}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
