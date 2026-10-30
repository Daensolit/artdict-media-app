import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import {
  LayoutDashboard,
  FolderOpen,
  Camera,
  Users,
  DollarSign,
  HardDrive,
  FileText,
  CalendarDays,
  AlertTriangle,
  Clock,
  CreditCard,
  MessageSquareWarning,
  Plus,
  UserPlus,
  PackagePlus,
  TrendingUp,
  ChevronRight,
  Calendar,
  MapPin,
  Film,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import Scoreboard from '../components/Scoreboard';
import Avatar from '../components/Avatar';
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  getProjectStatusColor,
  getProjectTypeColor,
  getInitials,
  getAvatarColor,
  daysUntil,
  getPaymentStatusColor,
} from '../utils/helpers';

// ─── Chart color palette ───
const CHART_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b',
  '#10b981', '#3b82f6', '#14b8a6', '#ef4444', '#6b7280',
];

// ─── Pro Studio Stat Card Component ───
interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  accent: 'orange' | 'amber' | 'rose' | 'emerald' | 'cyan' | 'indigo';
}

const ACCENT_STYLES = {
  orange: 'from-orange-500/20 to-amber-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.15)]',
  amber: 'from-amber-500/20 to-yellow-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]',
  rose: 'from-rose-500/20 to-pink-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.15)]',
  emerald: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
  cyan: 'from-cyan-500/20 to-blue-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)]',
  indigo: 'from-indigo-500/20 to-purple-500/10 text-indigo-400 border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]',
};

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, sub, accent }) => (
  <div className="card group relative flex items-center gap-3.5 p-3.5 sm:p-4 overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-all cursor-default">
    <div className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br border ${ACCENT_STYLES[accent]} transition-transform duration-300 group-hover:scale-110`}>
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">{label}</p>
      <p className="font-mono text-lg sm:text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 mt-0.5 truncate">{value}</p>
      {sub && <p className="truncate text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5 font-mono">{sub}</p>}
    </div>
  </div>
);

// ─── Empty state helper ───
const EmptyState: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({
  icon,
  title,
  description,
}) => (
  <div className="flex flex-col items-center justify-center py-10 text-center">
    <div className="mb-3 text-gray-300 dark:text-gray-600">{icon}</div>
    <p className="font-medium text-gray-500 dark:text-gray-400">{title}</p>
    <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">{description}</p>
  </div>
);

// ─── Dashboard Page ───
const Dashboard: React.FC = () => {
  const currentUser = useStore((s) => s.currentUser);
  const projects = useStore((s) => s.projects);
  const clients = useStore((s) => s.clients);
  const teamMembers = useStore((s) => s.teamMembers);
  const equipment = useStore((s) => s.equipment);
  const calendarEvents = useStore((s) => s.calendarEvents);
  const invoices = useStore((s) => s.invoices);
  const revisions = useStore((s) => s.revisions);
  const settings = useStore((s) => s.settings);

  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager';
  const canViewFinance = isAdmin || isManager || currentUser?.permissions?.canManageFinance;

  // ── Derived stats ──
  const now = new Date();

  const activeProjects = useMemo(
    () => projects.filter((p) => !['Delivered', 'Archived'].includes(p.status)),
    [projects],
  );

  const upcomingShoots = useMemo(() => {
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    return calendarEvents.filter((e) => {
      const d = new Date(e.date);
      return d >= startOfWeek && d <= endOfWeek && e.type === 'shoot';
    });
  }, [calendarEvents, now]);

  const activeTeamMembers = useMemo(
    () => teamMembers.filter((m) => m.isActive),
    [teamMembers],
  );

  const revenueThisMonth = useMemo(() => {
    const month = now.getMonth();
    const year = now.getFullYear();
    return invoices
      .filter((inv) => {
        if (!inv.paidDate) return false;
        const d = new Date(inv.paidDate);
        return d.getMonth() === month && d.getFullYear() === year;
      })
      .reduce((sum, inv) => sum + inv.total, 0);
  }, [invoices, now]);

  const equipmentInUse = useMemo(
    () => equipment.filter((e) => e.status === 'In Use'),
    [equipment],
  );

  const pendingInvoices = useMemo(
    () => invoices.filter((inv) => inv.paymentStatus !== 'Paid'),
    [invoices],
  );

  // ── Revenue by month (last 6 months) ──
  const revenueByMonth = useMemo(() => {
    const months: { name: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = d.toLocaleDateString('vi-VN', { month: 'short', year: '2-digit' });
      const revenue = invoices
        .filter((inv) => {
          if (!inv.paidDate) return false;
          const pd = new Date(inv.paidDate);
          return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
        })
        .reduce((sum, inv) => sum + inv.total, 0);
      months.push({ name: monthName, revenue });
    }
    return months;
  }, [invoices, now]);

  // ── Projects by type (pie) ──
  const projectsByType = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach((p) => {
      counts[p.type] = (counts[p.type] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [projects]);

  // ── Upcoming 5 events ──
  const upcomingEvents = useMemo(() => {
    const todayStr = now.toISOString().split('T')[0];
    return calendarEvents
      .filter((e) => e.date >= todayStr)
      .sort((a, b) => {
        const cmp = a.date.localeCompare(b.date);
        return cmp !== 0 ? cmp : a.startTime.localeCompare(b.startTime);
      })
      .slice(0, 5);
  }, [calendarEvents, now]);

  // ── Alerts ──
  const alerts = useMemo(() => {
    const items: { type: 'equipment' | 'deadline' | 'invoice' | 'revision'; message: string; severity: 'warning' | 'danger' }[] = [];

    // Equipment not returned – items assigned to a project but project is delivered/archived
    equipment.forEach((eq) => {
      if (eq.status === 'In Use' && eq.currentProjectId) {
        const proj = projects.find((p) => p.id === eq.currentProjectId);
        if (proj && ['Delivered', 'Archived'].includes(proj.status)) {
          items.push({
            type: 'equipment',
            message: `${eq.name} chưa được trả lại (dự án "${proj.name}")`,
            severity: 'danger',
          });
        }
      }
    });

    // Deadlines approaching within 3 days
    activeProjects.forEach((p) => {
      const d = daysUntil(p.deadline);
      if (d >= 0 && d <= 3) {
        items.push({
          type: 'deadline',
          message: `Dự án "${p.name}" sắp đến hạn (${d === 0 ? 'hôm nay' : `còn ${d} ngày`})`,
          severity: d <= 1 ? 'danger' : 'warning',
        });
      }
    });

    // Unpaid invoices past due
    invoices.forEach((inv) => {
      if (inv.paymentStatus === 'Unpaid' && daysUntil(inv.dueDate) < 0) {
        const proj = projects.find((p) => p.id === inv.projectId);
        items.push({
          type: 'invoice',
          message: `Hóa đơn #${inv.invoiceNumber} quá hạn${proj ? ` (${proj.name})` : ''}`,
          severity: 'danger',
        });
      } else if (inv.paymentStatus !== 'Paid') {
        const d = daysUntil(inv.dueDate);
        if (d >= 0 && d <= 3) {
          items.push({
            type: 'invoice',
            message: `Hóa đơn #${inv.invoiceNumber} sắp đến hạn (${d === 0 ? 'hôm nay' : `còn ${d} ngày`})`,
            severity: 'warning',
          });
        }
      }
    });

    // Revision requests pending
    revisions.forEach((r) => {
      if (r.status === 'Changes Requested') {
        const proj = projects.find((p) => p.id === r.projectId);
        items.push({
          type: 'revision',
          message: `Yêu cầu chỉnh sửa lần ${r.revisionNumber}${proj ? ` – "${proj.name}"` : ''}`,
          severity: 'warning',
        });
      }
    });

    return items;
  }, [equipment, projects, activeProjects, invoices, revisions]);

  // ── Alert icon by type ──
  const alertIcon = (type: string) => {
    switch (type) {
      case 'equipment': return <HardDrive size={16} />;
      case 'deadline': return <Clock size={16} />;
      case 'invoice': return <CreditCard size={16} />;
      case 'revision': return <MessageSquareWarning size={16} />;
      default: return <AlertTriangle size={16} />;
    }
  };

  // Custom tooltip for bar chart
  const RevenueTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className="font-semibold text-gray-900 dark:text-white">
          {formatCurrency(payload[0].value, settings.currency)}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* ═══ Header ═══ */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
            <LayoutDashboard size={28} className="text-indigo-500" />
            Tổng quan
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Chào mừng trở lại! Đây là tóm tắt hoạt động của đội ngũ.
          </p>
        </div>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ═══ Stats Cards ═══ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          icon={<FolderOpen size={20} />}
          label="Dự án đang thực hiện"
          value={activeProjects.length}
          sub={`${projects.length} tổng dự án`}
          accent="indigo"
        />
        <StatCard
          icon={<Camera size={20} />}
          label="Lịch quay tuần này"
          value={upcomingShoots.length}
          sub="Sắp tới trong 7 ngày"
          accent="rose"
        />
        <StatCard
          icon={<Users size={20} />}
          label="Thành viên"
          value={activeTeamMembers.length}
          sub={`${teamMembers.length} tổng thành viên`}
          accent="emerald"
        />
        {canViewFinance ? (
          <>
            <StatCard
              icon={<DollarSign size={20} />}
              label="Doanh thu tháng này"
              value={formatCurrency(revenueThisMonth, settings.currency)}
              accent="amber"
            />
            <StatCard
              icon={<HardDrive size={20} />}
              label="Thiết bị đang dùng"
              value={equipmentInUse.length}
              sub={`${equipment.length} tổng thiết bị`}
              accent="cyan"
            />
            <StatCard
              icon={<FileText size={20} />}
              label="Hóa đơn chờ"
              value={pendingInvoices.length}
              sub={pendingInvoices.length > 0 ? formatCurrency(pendingInvoices.reduce((s, i) => s + i.total, 0), settings.currency) : undefined}
              accent="orange"
            />
          </>
        ) : (
          <>
            <StatCard
              icon={<HardDrive size={20} />}
              label="Thiết bị đang dùng"
              value={equipmentInUse.length}
              sub={`${equipment.length} tổng thiết bị`}
              accent="cyan"
            />
            <StatCard
              icon={<Film size={20} />}
              label="Phản hồi cần sửa"
              value={revisions.filter((r) => r.status === 'Changes Requested').length}
              sub="Revision đang mở"
              accent="amber"
            />
          </>
        )}
      </div>

      {/* ═══ Artdict Media Scoreboard ═══ */}
      <Scoreboard />

      {/* ═══ Charts Row ═══ */}
      {canViewFinance ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Revenue Bar Chart */}
          <div className="card col-span-1 p-6 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                <TrendingUp size={18} className="text-indigo-500" />
                Doanh thu 6 tháng gần nhất
              </h2>
            </div>
            {revenueByMonth.every((m) => m.revenue === 0) ? (
              <EmptyState
                icon={<TrendingUp size={48} />}
                title="Chưa có dữ liệu doanh thu"
                description="Doanh thu sẽ hiển thị khi bạn tạo hóa đơn và ghi nhận thanh toán."
              />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={revenueByMonth} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="#9ca3af"
                    tickFormatter={(v) => {
                      if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(0)}M`;
                      if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
                      return v;
                    }}
                  />
                  <Tooltip content={<RevenueTooltip />} />
                  <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={48} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Projects by Type Pie Chart */}
          <div className="card p-6">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
              <FolderOpen size={18} className="text-indigo-500" />
              Dự án theo loại
            </h2>
            {projectsByType.length === 0 ? (
              <EmptyState
                icon={<FolderOpen size={48} />}
                title="Chưa có dự án"
                description="Hãy tạo dự án đầu tiên để thấy phân bổ theo loại."
              />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={projectsByType}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {projectsByType.map((entry, idx) => (
                        <Cell key={entry.name} fill={getProjectTypeColor(entry.name) || CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value} dự án`, name]}
                      contentStyle={{ borderRadius: '8px', fontSize: '13px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
                  {projectsByType.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: getProjectTypeColor(entry.name) }}
                      />
                      {entry.name} ({entry.value})
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Projects by Type Pie Chart */}
          <div className="card p-6">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
              <FolderOpen size={18} className="text-indigo-500" />
              Phân loại dự án
            </h2>
            {projectsByType.length === 0 ? (
              <EmptyState
                icon={<FolderOpen size={48} />}
                title="Chưa có dự án"
                description="Hãy tạo dự án đầu tiên để thấy phân bổ theo loại."
              />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={projectsByType}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {projectsByType.map((entry, idx) => (
                        <Cell key={entry.name} fill={getProjectTypeColor(entry.name) || CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [`${value} dự án`, name]}
                      contentStyle={{ borderRadius: '8px', fontSize: '13px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
                  {projectsByType.map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: getProjectTypeColor(entry.name) }}
                      />
                      {entry.name} ({entry.value})
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Project Status Progress */}
          <div className="card p-6">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
              <Film size={18} className="text-indigo-500" />
              Tiến độ các giai đoạn sản xuất
            </h2>
            <div className="space-y-4 pt-2">
              {[
                { status: 'In Production', label: 'Đang bấm máy (Production)', color: 'bg-indigo-500' },
                { status: 'Post-production', label: 'Đang làm hậu kỳ (Post-prod)', color: 'bg-purple-500' },
                { status: 'Review', label: 'Đang duyệt & sửa (Review)', color: 'bg-amber-500' },
                { status: 'Confirmed', label: 'Đã chốt lịch (Confirmed)', color: 'bg-emerald-500' },
              ].map((item) => {
                const count = projects.filter((p) => p.status === item.status).length;
                const pct = projects.length ? Math.round((count / projects.length) * 100) : 0;
                return (
                  <div key={item.status} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-700 dark:text-gray-300">{item.label}</span>
                      <span className="text-gray-500">{count} dự án ({pct}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-dark-800 rounded-full h-2.5 overflow-hidden">
                      <div className={`${item.color} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Middle Row: Schedule + Active Projects ═══ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Schedule */}
        <div className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
            <CalendarDays size={18} className="text-indigo-500" />
            Lịch sắp tới
          </h2>
          {upcomingEvents.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={48} />}
              title="Chưa có sự kiện nào"
              description="Thêm lịch quay, cuộc họp hoặc deadline vào lịch để theo dõi."
            />
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((ev) => {
                const project = projects.find((p) => p.id === ev.projectId);
                const isToday = ev.date === now.toISOString().split('T')[0];
                return (
                  <div
                    key={ev.id}
                    className="flex items-start gap-3 rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
                  >
                    <div
                      className="mt-0.5 h-10 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: ev.color || '#6366f1' }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900 dark:text-white">{ev.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          {isToday ? (
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">Hôm nay</span>
                          ) : (
                            formatDateShort(ev.date)
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {ev.startTime} – {ev.endTime}
                        </span>
                        {ev.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} />
                            <span className="truncate">{ev.location}</span>
                          </span>
                        )}
                      </div>
                      {project && (
                        <p className="mt-1 truncate text-xs text-gray-400 dark:text-gray-500">
                          Dự án: {project.name}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                        ev.type === 'shoot'
                          ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
                          : ev.type === 'deadline'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : ev.type === 'meeting'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                              : ev.type === 'delivery'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {ev.type}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Projects */}
        <div className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
            <FolderOpen size={18} className="text-indigo-500" />
            Dự án đang thực hiện
          </h2>
          {activeProjects.length === 0 ? (
            <EmptyState
              icon={<FolderOpen size={48} />}
              title="Chưa có dự án nào"
              description="Tạo dự án mới để bắt đầu quản lý sản xuất của bạn."
            />
          ) : (
            <div className="space-y-3">
              {activeProjects.slice(0, 5).map((proj) => {
                const client = clients.find((c) => c.id === proj.clientId);
                const members = teamMembers.filter((m) => proj.teamMemberIds.includes(m.id));
                const deadline = daysUntil(proj.deadline);
                return (
                  <div
                    key={proj.id}
                    className="group flex items-center gap-3 rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-gray-900 dark:text-white">{proj.name}</p>
                        <span className={`badge text-[10px] ${getProjectStatusColor(proj.status)}`}>
                          {proj.status}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                        {client && <span>{client.name}</span>}
                        <span className={`flex items-center gap-1 ${deadline <= 3 && deadline >= 0 ? 'font-semibold text-red-500' : ''}`}>
                          <Clock size={12} />
                          {deadline < 0
                            ? `Quá hạn ${Math.abs(deadline)} ngày`
                            : deadline === 0
                              ? 'Hôm nay'
                              : `Còn ${deadline} ngày`}
                        </span>
                      </div>
                    </div>
                    {/* Team member avatars */}
                    <div className="flex -space-x-2">
                      {members.slice(0, 4).map((m) => (
                        <div key={m.id} title={m.name} className="border-2 border-white dark:border-gray-800 rounded-full">
                          <Avatar name={m.name} avatar={m.avatar} size="xs" />
                        </div>
                      ))}
                      {members.length > 4 && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-gray-200 text-[10px] font-bold text-gray-600 dark:border-gray-800 dark:bg-gray-700 dark:text-gray-300">
                          +{members.length - 4}
                        </div>
                      )}
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-gray-300 transition-colors group-hover:text-indigo-500 dark:text-gray-600" />
                  </div>
                );
              })}
              {activeProjects.length > 5 && (
                <p className="pt-1 text-center text-xs text-gray-400 dark:text-gray-500">
                  và {activeProjects.length - 5} dự án khác…
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ═══ Bottom Row: Alerts + Quick Actions ═══ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Alerts */}
        <div className="card col-span-1 p-6 lg:col-span-2">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
            <AlertTriangle size={18} className="text-amber-500" />
            Cảnh báo
            {alerts.length > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                {alerts.length}
              </span>
            )}
          </h2>
          {alerts.length === 0 ? (
            <EmptyState
              icon={<AlertTriangle size={48} />}
              title="Không có cảnh báo"
              description="Mọi thứ đều ổn! Các cảnh báo sẽ xuất hiện khi có vấn đề cần chú ý."
            />
          ) : (
            <div className="space-y-2">
              {alerts.map((alert, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 rounded-lg border p-3 ${
                    alert.severity === 'danger'
                      ? 'border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-900/10'
                      : 'border-amber-200 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-900/10'
                  }`}
                >
                  <span
                    className={`mt-0.5 shrink-0 ${
                      alert.severity === 'danger'
                        ? 'text-red-500 dark:text-red-400'
                        : 'text-amber-500 dark:text-amber-400'
                    }`}
                  >
                    {alertIcon(alert.type)}
                  </span>
                  <p
                    className={`text-sm ${
                      alert.severity === 'danger'
                        ? 'text-red-700 dark:text-red-300'
                        : 'text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {alert.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="mb-4 flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
            <Plus size={18} className="text-indigo-500" />
            Thao tác nhanh
          </h2>
          <div className="space-y-3">
            <button
              className="btn-primary flex w-full items-center justify-center gap-2"
              onClick={() => {
                // Navigate to projects page – relies on router context from parent
                window.dispatchEvent(new CustomEvent('navigate', { detail: 'projects' }));
              }}
            >
              <FolderOpen size={18} />
              Tạo dự án mới
            </button>
            <button
              className="btn-secondary flex w-full items-center justify-center gap-2"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('navigate', { detail: 'team' }));
              }}
            >
              <UserPlus size={18} />
              Thêm thành viên
            </button>
            <button
              className="btn-secondary flex w-full items-center justify-center gap-2"
              onClick={() => {
                window.dispatchEvent(new CustomEvent('navigate', { detail: 'equipment' }));
              }}
            >
              <PackagePlus size={18} />
              Thêm thiết bị
            </button>
          </div>

          {/* Mini summary */}
          <div className="mt-6 space-y-2 border-t border-gray-100 pt-4 dark:border-gray-700">
            <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Tóm tắt nhanh
            </p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Tổng khách hàng</span>
              <span className="font-semibold text-gray-900 dark:text-white">{clients.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Thiết bị tổng</span>
              <span className="font-semibold text-gray-900 dark:text-white">{equipment.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Hóa đơn đã thanh toán</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {invoices.filter((i) => i.paymentStatus === 'Paid').length}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Dự án hoàn thành</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {projects.filter((p) => p.status === 'Delivered' || p.status === 'Archived').length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
