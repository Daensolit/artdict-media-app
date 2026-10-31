import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Receipt,
  BarChart3,
  Wallet,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import Modal from '../components/Modal';
import GlassSelect from '../components/GlassSelect';
import {
  formatCurrency,
  formatDate,
  generateId,
  getPaymentStatusColor,
  matchesSearch,
} from '../utils/helpers';
import type { Expense } from '../types';

// ── Constants ──────────────────────────────────────────────────────────
const EXPENSE_CATEGORIES = [
  'Personnel',
  'Equipment Rental',
  'Transport',
  'Food',
  'Props',
  'Location',
  'Software',
  'Other',
] as const;

type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

const CATEGORY_COLORS: Record<ExpenseCategory, { bg: string; text: string; bar: string }> = {
  Personnel:          { bg: 'bg-blue-100 dark:bg-blue-900/30',    text: 'text-blue-700 dark:text-blue-400',    bar: 'bg-blue-500' },
  'Equipment Rental': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', bar: 'bg-purple-500' },
  Transport:          { bg: 'bg-amber-100 dark:bg-amber-900/30',   text: 'text-amber-700 dark:text-amber-400',   bar: 'bg-amber-500' },
  Food:               { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', bar: 'bg-emerald-500' },
  Props:              { bg: 'bg-pink-100 dark:bg-pink-900/30',     text: 'text-pink-700 dark:text-pink-400',     bar: 'bg-pink-500' },
  Location:           { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400', bar: 'bg-indigo-500' },
  Software:           { bg: 'bg-teal-100 dark:bg-teal-900/30',     text: 'text-teal-700 dark:text-teal-400',     bar: 'bg-teal-500' },
  Other:              { bg: 'bg-gray-100 dark:bg-gray-800',        text: 'text-gray-700 dark:text-gray-400',     bar: 'bg-gray-500' },
};

// ── Empty form state ───────────────────────────────────────────────────
interface ExpenseForm {
  projectId: string;
  category: ExpenseCategory;
  description: string;
  amount: string;
  date: string;
  paidById: string;
  receipt: string;
}

const emptyForm: ExpenseForm = {
  projectId: '',
  category: 'Other',
  description: '',
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  paidById: '',
  receipt: '',
};

// ── Tabs ───────────────────────────────────────────────────────────────
type Tab = 'projects' | 'expenses' | 'categories';

// ====================================================================
// Component
// ====================================================================
export default function Budget() {
  const {
    currentUser,
    projects,
    invoices,
    expenses,
    teamMembers,
    addExpense,
    updateExpense,
    deleteExpense,
  } = useStore();

  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const canFinance = isAdmin || isManager || currentUser?.permissions?.canManageFinance;

  // --- modal state ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // --- filters ---
  const [activeTab, setActiveTab] = useState<Tab>('projects');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProject, setFilterProject] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // --- project budget expand ---
  const [expandedProject, setExpandedProject] = useState<string | null>(null);

  // ── Derived Data ────────────────────────────────────────────────────
  const totalRevenue = useMemo(
    () => invoices.reduce((sum, inv) => sum + inv.total, 0),
    [invoices],
  );

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, exp) => sum + exp.amount, 0),
    [expenses],
  );

  const profitLoss = totalRevenue - totalExpenses;

  const pendingPayments = useMemo(
    () =>
      invoices
        .filter((inv) => inv.paymentStatus !== 'Paid')
        .reduce((sum, inv) => {
          const paid = inv.paymentStatus === 'Deposit' ? inv.depositAmount : 0;
          return sum + (inv.total - paid);
        }, 0),
    [invoices],
  );

  // ── Per-project budget data ─────────────────────────────────────────
  const projectBudgetData = useMemo(() => {
    return projects.map((project) => {
      const projectExpenses = expenses
        .filter((e) => e.projectId === project.id)
        .reduce((sum, e) => sum + e.amount, 0);

      const projectInvoices = invoices.filter((inv) => inv.projectId === project.id);
      const totalInvoiced = projectInvoices.reduce((sum, inv) => sum + inv.total, 0);
      const depositPaid = projectInvoices.reduce((sum, inv) => sum + (inv.depositAmount || 0), 0);

      const paidAmount = projectInvoices.reduce((sum, inv) => {
        if (inv.paymentStatus === 'Paid') return sum + inv.total;
        if (inv.paymentStatus === 'Deposit') return sum + inv.depositAmount;
        if (inv.paymentStatus === 'Partial') return sum + inv.depositAmount;
        return sum;
      }, 0);

      const remaining = totalInvoiced - paidAmount;

      const bestPaymentStatus = projectInvoices.length
        ? projectInvoices.reduce((best, inv) => {
            const order = { Paid: 3, Partial: 2, Deposit: 1, Unpaid: 0 } as const;
            return order[inv.paymentStatus] > order[best] ? inv.paymentStatus : best;
          }, projectInvoices[0].paymentStatus)
        : null;

      const budgetUsedPct = project.budget > 0 ? (projectExpenses / project.budget) * 100 : 0;
      const projectProfit = totalInvoiced - projectExpenses;

      return {
        project,
        projectExpenses,
        totalInvoiced,
        depositPaid,
        paidAmount,
        remaining,
        bestPaymentStatus,
        budgetUsedPct,
        projectProfit,
      };
    });
  }, [projects, expenses, invoices]);

  // ── Expense list (filtered) ─────────────────────────────────────────
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((exp) => {
        const proj = projects.find((p) => p.id === exp.projectId);
        const member = teamMembers.find((m) => m.id === exp.paidById);
        const textMatch = matchesSearch(
          `${exp.description} ${proj?.name || ''} ${member?.name || ''} ${exp.category}`,
          searchQuery,
        );
        const projectMatch = !filterProject || exp.projectId === filterProject;
        const categoryMatch = !filterCategory || exp.category === filterCategory;
        const dateFromMatch = !filterDateFrom || exp.date >= filterDateFrom;
        const dateToMatch = !filterDateTo || exp.date <= filterDateTo;
        return textMatch && projectMatch && categoryMatch && dateFromMatch && dateToMatch;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [expenses, projects, teamMembers, searchQuery, filterProject, filterCategory, filterDateFrom, filterDateTo]);

  // ── Expense by category ─────────────────────────────────────────────
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((exp) => {
      map[exp.category] = (map[exp.category] || 0) + exp.amount;
    });
    const items = Object.entries(map)
      .map(([category, amount]) => ({ category: category as ExpenseCategory, amount }))
      .sort((a, b) => b.amount - a.amount);
    const max = items.length > 0 ? items[0].amount : 1;
    return { items, max };
  }, [expenses]);

  // ── Handlers ────────────────────────────────────────────────────────
  const openAddModal = () => {
    setEditingExpense(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (expense: Expense) => {
    setEditingExpense(expense);
    setForm({
      projectId: expense.projectId,
      category: expense.category as ExpenseCategory,
      description: expense.description,
      amount: String(expense.amount),
      date: expense.date,
      paidById: expense.paidById,
      receipt: expense.receipt,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.projectId || !form.description || !form.amount) return;

    if (editingExpense) {
      updateExpense(editingExpense.id, {
        projectId: form.projectId,
        category: form.category,
        description: form.description,
        amount: parseFloat(form.amount),
        date: form.date,
        paidById: form.paidById,
        receipt: form.receipt,
      });
    } else {
      addExpense({
        id: generateId(),
        projectId: form.projectId,
        category: form.category,
        description: form.description,
        amount: parseFloat(form.amount),
        date: form.date,
        paidById: form.paidById,
        receipt: form.receipt,
        createdAt: new Date().toISOString(),
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    deleteExpense(id);
    setDeleteConfirm(null);
  };

  const clearFilters = () => {
    setFilterProject('');
    setFilterCategory('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSearchQuery('');
  };

  // ── Helpers ─────────────────────────────────────────────────────────
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name || '—';
  const memberName = (id: string) => teamMembers.find((m) => m.id === id)?.name || '—';

  const budgetBarColor = (pct: number) => {
    if (pct >= 100) return 'bg-red-500';
    if (pct >= 80) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  // ====================================================================
  // RENDER
  // ====================================================================
  if (!canFinance) {
    return (
      <div className="card p-8 text-center max-w-lg mx-auto mt-12">
        <div className="w-14 h-14 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Giới Hạn Quyền Truy Cập</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Khu vực Quản lý Tài chính & Chi phí chỉ dành cho Quản lý và Quản trị viên (Admin).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Tài chính & Chi phí
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Quản lý ngân sách, chi phí và thanh toán dự án
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openAddModal}>
          <Plus className="w-4 h-4" />
          Thêm chi phí
        </button>
      </div>

      {/* ── Overview Stats ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
              <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">Tổng doanh thu</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {formatCurrency(totalRevenue)}
              </p>
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-900/30">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">Tổng chi phí</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
          </div>
        </div>

        {/* Profit / Loss */}
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl ${
                profitLoss >= 0
                  ? 'bg-emerald-100 dark:bg-emerald-900/30'
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}
            >
              {profitLoss >= 0 ? (
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">Lợi nhuận</p>
              <p
                className={`text-xl font-bold truncate ${
                  profitLoss >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatCurrency(profitLoss)}
              </p>
            </div>
          </div>
        </div>

        {/* Pending Payments */}
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 dark:bg-amber-900/30">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">Chờ thanh toán</p>
              <p className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {formatCurrency(pendingPayments)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {([
          { key: 'projects' as Tab, label: 'Ngân sách dự án', icon: Wallet },
          { key: 'expenses' as Tab, label: 'Danh sách chi phí', icon: Receipt },
          { key: 'categories' as Tab, label: 'Phân loại chi phí', icon: BarChart3 },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === key
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ── TAB: Project Budgets ────────────────────────────────────── */}
      {activeTab === 'projects' && (
        <div className="card overflow-hidden">
          {projectBudgetData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
              <Wallet className="w-12 h-12 mb-3" />
              <p className="font-medium">Chưa có dự án nào</p>
              <p className="text-sm mt-1">Tạo dự án để bắt đầu theo dõi ngân sách</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header text-left">Dự án</th>
                    <th className="table-header text-right">Ngân sách</th>
                    <th className="table-header text-right">Chi phí</th>
                    <th className="table-header text-right">Hóa đơn</th>
                    <th className="table-header text-center">Thanh toán</th>
                    <th className="table-header text-right">Lợi nhuận</th>
                    <th className="table-header text-left" style={{ minWidth: 140 }}>
                      Tiến độ chi phí
                    </th>
                    <th className="table-header text-center w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {projectBudgetData.map(
                    ({
                      project,
                      projectExpenses: pExp,
                      totalInvoiced,
                      bestPaymentStatus,
                      budgetUsedPct,
                      projectProfit,
                      depositPaid,
                      paidAmount,
                      remaining,
                    }) => (
                      <React.Fragment key={project.id}>
                        <tr
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                          onClick={() =>
                            setExpandedProject(
                              expandedProject === project.id ? null : project.id,
                            )
                          }
                        >
                          <td className="table-cell font-medium text-gray-900 dark:text-gray-100">
                            {project.name}
                          </td>
                          <td className="table-cell text-right">
                            {formatCurrency(project.budget)}
                          </td>
                          <td className="table-cell text-right">{formatCurrency(pExp)}</td>
                          <td className="table-cell text-right">
                            {formatCurrency(totalInvoiced)}
                          </td>
                          <td className="table-cell text-center">
                            {bestPaymentStatus ? (
                              <span
                                className={`badge ${getPaymentStatusColor(bestPaymentStatus)}`}
                              >
                                {bestPaymentStatus}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td
                            className={`table-cell text-right font-semibold ${
                              projectProfit >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {formatCurrency(projectProfit)}
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${budgetBarColor(budgetUsedPct)}`}
                                  style={{ width: `${Math.min(budgetUsedPct, 100)}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 w-10 text-right">
                                {budgetUsedPct.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className="table-cell text-center">
                            {expandedProject === project.id ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </td>
                        </tr>

                        {/* Expanded: Payment Tracking */}
                        {expandedProject === project.id && (
                          <tr>
                            <td
                              colSpan={8}
                              className="bg-gray-50 dark:bg-gray-800/30 px-6 py-4"
                            >
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-1">
                                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium tracking-wide">
                                    Đặt cọc
                                  </p>
                                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    {formatCurrency(depositPaid)}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium tracking-wide">
                                    Đã thanh toán
                                  </p>
                                  <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(paidAmount)}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium tracking-wide">
                                    Còn lại
                                  </p>
                                  <p
                                    className={`text-lg font-semibold ${
                                      remaining > 0
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-gray-900 dark:text-gray-100'
                                    }`}
                                  >
                                    {formatCurrency(remaining)}
                                  </p>
                                </div>
                              </div>

                              {/* Expense breakdown for this project */}
                              {expenses.filter((e) => e.projectId === project.id).length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium tracking-wide mb-2">
                                    Chi phí theo hạng mục
                                  </p>
                                  <div className="flex flex-wrap gap-2">
                                    {(() => {
                                      const catMap: Record<string, number> = {};
                                      expenses
                                        .filter((e) => e.projectId === project.id)
                                        .forEach((e) => {
                                          catMap[e.category] = (catMap[e.category] || 0) + e.amount;
                                        });
                                      return Object.entries(catMap).map(([cat, amt]) => {
                                        const colors =
                                          CATEGORY_COLORS[cat as ExpenseCategory] ||
                                          CATEGORY_COLORS.Other;
                                        return (
                                          <span
                                            key={cat}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${colors.bg} ${colors.text}`}
                                          >
                                            {cat}: {formatCurrency(amt)}
                                          </span>
                                        );
                                      });
                                    })()}
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: Expense List ──────────────────────────────────────── */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="card p-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  className="input pl-9 w-full"
                  placeholder="Tìm chi phí..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button
                className="btn-ghost flex items-center gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4" />
                Bộ lọc
                {(filterProject || filterCategory || filterDateFrom || filterDateTo) && (
                  <span className="ml-1 w-2 h-2 rounded-full bg-blue-500" />
                )}
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <label className="label">Dự án</label>
                  <GlassSelect
                    value={filterProject}
                    onChange={setFilterProject}
                    placeholder="Tất cả"
                    options={[
                      { value: '', label: 'Tất cả' },
                      ...projects.map((p) => ({ value: p.id, label: p.name })),
                    ]}
                  />
                </div>
                <div>
                  <label className="label">Hạng mục</label>
                  <GlassSelect
                    value={filterCategory}
                    onChange={setFilterCategory}
                    placeholder="Tất cả"
                    options={[
                      { value: '', label: 'Tất cả' },
                      ...EXPENSE_CATEGORIES.map((cat) => ({ value: cat, label: cat })),
                    ]}
                  />
                </div>
                <div>
                  <label className="label">Từ ngày</label>
                  <input
                    type="date"
                    className="input w-full"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Đến ngày</label>
                  <input
                    type="date"
                    className="input w-full"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                  />
                </div>
                {(filterProject || filterCategory || filterDateFrom || filterDateTo) && (
                  <div className="sm:col-span-2 lg:col-span-4">
                    <button
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      onClick={clearFilters}
                    >
                      Xóa bộ lọc
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Expense Table */}
          <div className="card overflow-hidden">
            {filteredExpenses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
                <Receipt className="w-12 h-12 mb-3" />
                <p className="font-medium">Không có chi phí nào</p>
                <p className="text-sm mt-1">
                  {expenses.length === 0
                    ? 'Thêm chi phí đầu tiên để bắt đầu'
                    : 'Thay đổi bộ lọc để xem kết quả'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="table-header text-left">Ngày</th>
                      <th className="table-header text-left">Dự án</th>
                      <th className="table-header text-left">Hạng mục</th>
                      <th className="table-header text-left">Mô tả</th>
                      <th className="table-header text-right">Số tiền</th>
                      <th className="table-header text-left">Người thanh toán</th>
                      <th className="table-header text-center w-24">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((exp) => {
                      const colors =
                        CATEGORY_COLORS[exp.category as ExpenseCategory] || CATEGORY_COLORS.Other;
                      return (
                        <tr
                          key={exp.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="table-cell text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {formatDate(exp.date)}
                          </td>
                          <td className="table-cell font-medium text-gray-900 dark:text-gray-100">
                            {projectName(exp.projectId)}
                          </td>
                          <td className="table-cell">
                            <span
                              className={`badge ${colors.bg} ${colors.text}`}
                            >
                              {exp.category}
                            </span>
                          </td>
                          <td className="table-cell text-gray-700 dark:text-gray-300 max-w-xs truncate">
                            {exp.description}
                          </td>
                          <td className="table-cell text-right font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            {formatCurrency(exp.amount)}
                          </td>
                          <td className="table-cell text-gray-600 dark:text-gray-400">
                            {memberName(exp.paidById)}
                          </td>
                          <td className="table-cell text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openEditModal(exp)}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 hover:text-blue-600"
                                title="Sửa"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              {deleteConfirm === exp.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDelete(exp.id)}
                                    className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium"
                                  >
                                    Xóa
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 text-xs"
                                  >
                                    Hủy
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirm(exp.id)}
                                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-500 hover:text-red-600"
                                  title="Xóa"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {filteredExpenses.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>
                  Hiển thị {filteredExpenses.length} / {expenses.length} chi phí
                </span>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  Tổng: {formatCurrency(filteredExpenses.reduce((s, e) => s + e.amount, 0))}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: Category Breakdown ────────────────────────────────── */}
      {activeTab === 'categories' && (
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
            Chi phí theo hạng mục
          </h3>
          {categoryBreakdown.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
              <BarChart3 className="w-12 h-12 mb-3" />
              <p className="font-medium">Chưa có dữ liệu chi phí</p>
              <p className="text-sm mt-1">Thêm chi phí để xem biểu đồ phân loại</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categoryBreakdown.items.map(({ category, amount }) => {
                const colors = CATEGORY_COLORS[category] || CATEGORY_COLORS.Other;
                const pct = (amount / categoryBreakdown.max) * 100;
                const totalPct = totalExpenses > 0 ? ((amount / totalExpenses) * 100).toFixed(1) : '0';
                return (
                  <div key={category} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`badge ${colors.bg} ${colors.text}`}>{category}</span>
                        <span className="text-xs text-gray-400">({totalPct}%)</span>
                      </div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatCurrency(amount)}
                      </span>
                    </div>
                    <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <span className="font-medium text-gray-500 dark:text-gray-400">Tổng chi phí</span>
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {formatCurrency(totalExpenses)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Add/Edit Expense Modal ─────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExpense ? 'Sửa chi phí' : 'Thêm chi phí mới'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Project */}
            <div>
              <label className="label">
                Dự án <span className="text-red-500">*</span>
              </label>
              <GlassSelect
                value={form.projectId}
                onChange={(val) => setForm({ ...form, projectId: val })}
                placeholder="Chọn dự án"
                options={[
                  { value: '', label: 'Chọn dự án' },
                  ...projects.map((p) => ({ value: p.id, label: p.name })),
                ]}
              />
            </div>

            {/* Category */}
            <div>
              <label className="label">
                Hạng mục <span className="text-red-500">*</span>
              </label>
              <GlassSelect
                value={form.category}
                onChange={(val) =>
                  setForm({ ...form, category: val as ExpenseCategory })
                }
                options={EXPENSE_CATEGORIES}
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="label">
                Mô tả <span className="text-red-500">*</span>
              </label>
              <input
                className="input w-full"
                placeholder="Mô tả chi phí..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>

            {/* Amount */}
            <div>
              <label className="label">
                Số tiền (VNĐ) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                className="input w-full"
                placeholder="0"
                min="0"
                step="1000"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                required
              />
            </div>

            {/* Date */}
            <div>
              <label className="label">
                Ngày <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="input w-full"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>

            {/* Paid By */}
            <div>
              <label className="label">Người thanh toán</label>
              <GlassSelect
                value={form.paidById}
                onChange={(val) => setForm({ ...form, paidById: val })}
                placeholder="Chọn thành viên"
                options={[
                  { value: '', label: 'Chọn thành viên' },
                  ...teamMembers
                    .filter((m) => m.isActive)
                    .map((m) => ({
                      value: m.id,
                      label: `${m.name} — ${m.role}`,
                    })),
                ]}
              />
            </div>

            {/* Receipt */}
            <div>
              <label className="label">Ghi chú hóa đơn</label>
              <input
                className="input w-full"
                placeholder="Số hóa đơn, ghi chú..."
                value={form.receipt}
                onChange={(e) => setForm({ ...form, receipt: e.target.value })}
              />
            </div>
          </div>

          {/* Validation hint */}
          {(!form.projectId || !form.description || !form.amount) && (
            <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-4 h-4" />
              Vui lòng điền đầy đủ các trường bắt buộc (*)
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setIsModalOpen(false)}
            >
              Hủy
            </button>
            <button type="submit" className="btn-primary">
              {editingExpense ? 'Cập nhật' : 'Thêm chi phí'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
