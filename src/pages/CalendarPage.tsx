import React, { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  addWeeks,
  subWeeks,
  parseISO,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  MapPin,
  Edit2,
  Trash2,
  CalendarCheck,
  X,
  Camera,
  Users,
  Flag,
  Truck,
  Circle,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { generateId, getProjectTypeColor } from '../utils/helpers';
import type { CalendarEvent } from '../types';
import Modal from '../components/Modal';
import GlassSelect from '../components/GlassSelect';

// ── Constants ──────────────────────────────────────────────────────────
const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const EVENT_TYPES: { value: CalendarEvent['type']; label: string }[] = [
  { value: 'shoot', label: 'Quay phim' },
  { value: 'meeting', label: 'Họp' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'delivery', label: 'Giao hàng' },
  { value: 'other', label: 'Khác' },
];
const REMINDER_OPTIONS = [
  { value: 30, label: '30 phút trước' },
  { value: 60, label: '1 giờ trước' },
  { value: 120, label: '2 giờ trước' },
  { value: 1440, label: '1 ngày trước' },
];
const EVENT_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#06b6d4',
];

type ViewMode = 'month' | 'week';

// ── Helpers ────────────────────────────────────────────────────────────
function getEventTypeIcon(type: CalendarEvent['type']) {
  switch (type) {
    case 'shoot': return <Camera className="w-3.5 h-3.5" />;
    case 'meeting': return <Users className="w-3.5 h-3.5" />;
    case 'deadline': return <Flag className="w-3.5 h-3.5" />;
    case 'delivery': return <Truck className="w-3.5 h-3.5" />;
    default: return <Circle className="w-3.5 h-3.5" />;
  }
}

function getEventTypeLabel(type: CalendarEvent['type']): string {
  return EVENT_TYPES.find((t) => t.value === type)?.label ?? type;
}

// ── Empty form ─────────────────────────────────────────────────────────
function emptyForm(date?: string): Omit<CalendarEvent, 'id'> {
  return {
    title: '',
    projectId: '',
    date: date ?? format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endTime: '10:00',
    type: 'other',
    location: '',
    reminder: 60,
    notes: '',
    color: EVENT_COLORS[0],
  };
}

// ════════════════════════════════════════════════════════════════════════
// Calendar Page
// ════════════════════════════════════════════════════════════════════════
export default function CalendarPage() {
  const {
    calendarEvents,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    projects,
  } = useStore();

  // ── State ────────────────────────────────────────────────────────────
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState<Omit<CalendarEvent, 'id'>>(emptyForm());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // ── Derived data ─────────────────────────────────────────────────────
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // Build the array of day cells for the month grid
  const calendarDays = useMemo(() => {
    const days: Date[] = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [calendarStart.toISOString(), calendarEnd.toISOString()]);

  // Week view days
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart.toISOString()]);

  // Events lookup by date string
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    calendarEvents.forEach((ev) => {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    // Sort each date's events by startTime
    Object.values(map).forEach((arr) => arr.sort((a, b) => a.startTime.localeCompare(b.startTime)));
    return map;
  }, [calendarEvents]);

  // Upcoming events (next 7 days from today)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = addDays(today, 7);
    return calendarEvents
      .filter((ev) => {
        const d = parseISO(ev.date);
        return d >= today && d <= end;
      })
      .sort((a, b) => {
        const cmp = a.date.localeCompare(b.date);
        return cmp !== 0 ? cmp : a.startTime.localeCompare(b.startTime);
      });
  }, [calendarEvents]);

  // Selected day events
  const selectedDayEvents = useMemo(() => {
    if (!selectedDay) return [];
    const key = format(selectedDay, 'yyyy-MM-dd');
    return eventsByDate[key] ?? [];
  }, [selectedDay, eventsByDate]);

  // ── Navigation ───────────────────────────────────────────────────────
  const goToday = () => {
    setCurrentDate(new Date());
    setSelectedDay(new Date());
  };
  const goPrev = () =>
    setCurrentDate(viewMode === 'month' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1));
  const goNext = () =>
    setCurrentDate(viewMode === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1));

  // ── Modal helpers ────────────────────────────────────────────────────
  const openCreateModal = (date?: Date) => {
    setEditingEvent(null);
    setForm(emptyForm(date ? format(date, 'yyyy-MM-dd') : undefined));
    setShowModal(true);
  };

  const openEditModal = (ev: CalendarEvent) => {
    setEditingEvent(ev);
    setForm({ ...ev });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingEvent(null);
  };

  const handleSave = () => {
    if (!form.title.trim()) return;
    if (editingEvent) {
      updateCalendarEvent(editingEvent.id, form);
    } else {
      addCalendarEvent({ ...form, id: generateId() });
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    deleteCalendarEvent(id);
    setShowDeleteConfirm(null);
    // Remove from selected day if necessary
  };

  const updateForm = <K extends keyof Omit<CalendarEvent, 'id'>>(
    key: K,
    value: Omit<CalendarEvent, 'id'>[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  // ── Project lookup helper ────────────────────────────────────────────
  const getProjectName = (id: string) => projects.find((p) => p.id === id)?.name ?? '';
  const getProjectColor = (id: string) => {
    const p = projects.find((pr) => pr.id === id);
    return p ? getProjectTypeColor(p.type) : '#6b7280';
  };

  // ── Render helpers ───────────────────────────────────────────────────
  const eventsForDay = (day: Date) => eventsByDate[format(day, 'yyyy-MM-dd')] ?? [];

  // ════════════════════════════════════════════════════════════════════
  // JSX
  // ════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Lịch</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quản lý lịch quay, họp và deadline của đội ngũ
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Tháng
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                viewMode === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Tuần
            </button>
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={() => openCreateModal()}>
            <Plus className="w-4 h-4" />
            Thêm sự kiện
          </button>
        </div>
      </div>

      {/* ── Main grid: Calendar + Upcoming sidebar ──────────────────── */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* LEFT: Calendar */}
        <div className="flex-1 min-w-0">
          {/* Nav bar */}
          <div className="card p-4 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={goNext}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={goToday}
                className="btn-ghost text-sm"
              >
                Hôm nay
              </button>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
              {viewMode === 'month'
                ? format(currentDate, 'MMMM yyyy', { locale: vi })
                : `${format(weekDays[0], 'dd/MM')} – ${format(weekDays[6], 'dd/MM/yyyy')}`}
            </h2>
            <div className="w-24" /> {/* spacer for centering */}
          </div>

          {/* Calendar grid */}
          <div className="card overflow-hidden">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700">
              {WEEKDAY_LABELS.map((label) => (
                <div
                  key={label}
                  className="py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Day cells */}
            {viewMode === 'month' ? (
              <div className="grid grid-cols-7">
                {calendarDays.map((day, i) => {
                  const dayEvents = eventsForDay(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isSelected = selectedDay && isSameDay(day, selectedDay);
                  const today = isToday(day);

                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDay(day)}
                      onDoubleClick={() => openCreateModal(day)}
                      className={`relative min-h-[90px] p-1.5 border-b border-r border-gray-100 dark:border-gray-700/50 text-left transition-colors
                        ${!isCurrentMonth ? 'bg-gray-50/50 dark:bg-gray-800/30' : 'bg-white dark:bg-gray-900'}
                        ${isSelected ? 'ring-2 ring-blue-500 ring-inset z-10' : ''}
                        hover:bg-blue-50/50 dark:hover:bg-blue-900/10
                      `}
                    >
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 text-sm rounded-full
                          ${today ? 'bg-blue-600 text-white font-bold' : ''}
                          ${!today && isCurrentMonth ? 'text-gray-900 dark:text-gray-100 font-medium' : ''}
                          ${!today && !isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : ''}
                        `}
                      >
                        {format(day, 'd')}
                      </span>
                      {/* Event dots / bars */}
                      <div className="mt-0.5 space-y-0.5 overflow-hidden">
                        {dayEvents.slice(0, 3).map((ev) => (
                          <div
                            key={ev.id}
                            className="flex items-center gap-1 text-[10px] leading-tight truncate rounded px-1 py-0.5"
                            style={{ backgroundColor: `${ev.color || getProjectColor(ev.projectId)}20`, color: ev.color || getProjectColor(ev.projectId) }}
                            title={`${ev.startTime} ${ev.title}`}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: ev.color || getProjectColor(ev.projectId) }}
                            />
                            <span className="truncate font-medium">{ev.title}</span>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[10px] text-gray-400 dark:text-gray-500 pl-1">
                            +{dayEvents.length - 3} khác
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* ── Week view ──────────────────────────────────────── */
              <div className="grid grid-cols-7">
                {weekDays.map((day, i) => {
                  const dayEvents = eventsForDay(day);
                  const isSelected = selectedDay && isSameDay(day, selectedDay);
                  const today = isToday(day);

                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDay(day)}
                      onDoubleClick={() => openCreateModal(day)}
                      className={`relative min-h-[220px] p-2 border-r border-gray-100 dark:border-gray-700/50 text-left transition-colors
                        bg-white dark:bg-gray-900
                        ${isSelected ? 'ring-2 ring-blue-500 ring-inset z-10' : ''}
                        hover:bg-blue-50/50 dark:hover:bg-blue-900/10
                      `}
                    >
                      <div className="text-center mb-2">
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                          {format(day, 'EEE', { locale: vi })}
                        </div>
                        <span
                          className={`inline-flex items-center justify-center w-8 h-8 text-sm rounded-full mt-1
                            ${today ? 'bg-blue-600 text-white font-bold' : 'text-gray-900 dark:text-gray-100 font-medium'}
                          `}
                        >
                          {format(day, 'd')}
                        </span>
                      </div>
                      <div className="space-y-1 overflow-hidden">
                        {dayEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className="text-[11px] leading-tight rounded px-1.5 py-1 truncate"
                            style={{ backgroundColor: `${ev.color || getProjectColor(ev.projectId)}20`, color: ev.color || getProjectColor(ev.projectId) }}
                            title={`${ev.startTime} – ${ev.endTime} ${ev.title}`}
                          >
                            <div className="font-semibold truncate">{ev.title}</div>
                            <div className="opacity-70">{ev.startTime} – {ev.endTime}</div>
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
          {/* Selected day panel */}
          {selectedDay && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {format(selectedDay, 'EEEE, dd/MM/yyyy', { locale: vi })}
                </h3>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {selectedDayEvents.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarDays className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-400 dark:text-gray-500">Không có sự kiện</p>
                  <button
                    className="btn-ghost text-sm mt-2 text-blue-600"
                    onClick={() => openCreateModal(selectedDay)}
                  >
                    + Thêm sự kiện
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="group rounded-lg p-3 border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-colors"
                      style={{ borderLeftWidth: '3px', borderLeftColor: ev.color || getProjectColor(ev.projectId) }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span style={{ color: ev.color || getProjectColor(ev.projectId) }}>
                              {getEventTypeIcon(ev.type)}
                            </span>
                            <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                              {ev.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="w-3 h-3" />
                            {ev.startTime} – {ev.endTime}
                          </div>
                          {ev.location && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{ev.location}</span>
                            </div>
                          )}
                          {ev.projectId && (
                            <div className="mt-1">
                              <span
                                className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                                style={{
                                  backgroundColor: `${getProjectColor(ev.projectId)}20`,
                                  color: getProjectColor(ev.projectId),
                                }}
                              >
                                {getProjectName(ev.projectId)}
                              </span>
                            </div>
                          )}
                          <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                            {getEventTypeLabel(ev.type)}
                          </span>
                        </div>
                        {/* Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(ev)}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Sửa"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(ev.id)}
                            className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Xoá"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>

                      {/* Delete confirmation */}
                      {showDeleteConfirm === ev.id && (
                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                          <span className="text-xs text-red-500">Xoá sự kiện này?</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => setShowDeleteConfirm(null)}
                              className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                            >
                              Huỷ
                            </button>
                            <button
                              onClick={() => handleDelete(ev.id)}
                              className="text-xs px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                            >
                              Xoá
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  <button
                    className="w-full btn-ghost text-sm text-blue-600 mt-1"
                    onClick={() => openCreateModal(selectedDay)}
                  >
                    + Thêm sự kiện
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Upcoming events */}
          <div className="card p-4">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-blue-500" />
              Sắp diễn ra
            </h3>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-6">
                <CalendarDays className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Không có sự kiện trong 7 ngày tới
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {upcomingEvents.map((ev) => {
                  const evDate = parseISO(ev.date);
                  const today = isToday(evDate);
                  return (
                    <button
                      key={ev.id}
                      onClick={() => {
                        setSelectedDay(evDate);
                        setCurrentDate(evDate);
                      }}
                      className="w-full text-left rounded-lg p-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: ev.color || getProjectColor(ev.projectId) }}
                        />
                        <span className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate flex-1">
                          {ev.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 ml-4 text-xs text-gray-500 dark:text-gray-400">
                        <span className={today ? 'text-blue-600 font-semibold' : ''}>
                          {today ? 'Hôm nay' : format(evDate, 'EEE, dd/MM', { locale: vi })}
                        </span>
                        <span>{ev.startTime} – {ev.endTime}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* Create / Edit Event Modal                                     */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingEvent ? 'Chỉnh sửa sự kiện' : 'Thêm sự kiện mới'}
        size="lg"
      >
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="label">Tiêu đề *</label>
            <input
              className="input w-full"
              value={form.title}
              onChange={(e) => updateForm('title', e.target.value)}
              placeholder="Nhập tiêu đề sự kiện"
            />
          </div>

          {/* Project + Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Dự án</label>
              <GlassSelect
                value={form.projectId}
                onChange={(val) => updateForm('projectId', val)}
                placeholder="-- Chọn dự án --"
                options={[
                  { value: '', label: '-- Chọn dự án --' },
                  ...projects.map((p) => ({ value: p.id, label: p.name })),
                ]}
              />
            </div>
            <div>
              <label className="label">Loại sự kiện</label>
              <GlassSelect
                value={form.type}
                onChange={(val) => updateForm('type', val as CalendarEvent['type'])}
                options={EVENT_TYPES}
              />
            </div>
          </div>

          {/* Date + Times */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="label">Ngày</label>
              <input
                type="date"
                className="input w-full"
                value={form.date}
                onChange={(e) => updateForm('date', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Bắt đầu</label>
              <input
                type="time"
                className="input w-full"
                value={form.startTime}
                onChange={(e) => updateForm('startTime', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Kết thúc</label>
              <input
                type="time"
                className="input w-full"
                value={form.endTime}
                onChange={(e) => updateForm('endTime', e.target.value)}
              />
            </div>
          </div>

          {/* Location + Reminder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Địa điểm</label>
              <input
                className="input w-full"
                value={form.location}
                onChange={(e) => updateForm('location', e.target.value)}
                placeholder="Nhập địa điểm"
              />
            </div>
            <div>
              <label className="label">Nhắc nhở</label>
              <GlassSelect
                value={String(form.reminder)}
                onChange={(val) => updateForm('reminder', Number(val))}
                options={REMINDER_OPTIONS.map((r) => ({
                  value: String(r.value),
                  label: r.label,
                }))}
              />
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label className="label">Màu sắc</label>
            <div className="flex items-center gap-2 flex-wrap">
              {EVENT_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => updateForm('color', c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                    form.color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
              <input
                type="color"
                className="w-7 h-7 rounded-full cursor-pointer border-0 p-0"
                value={form.color}
                onChange={(e) => updateForm('color', e.target.value)}
                title="Chọn màu tuỳ chỉnh"
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
              onChange={(e) => updateForm('notes', e.target.value)}
              placeholder="Ghi chú thêm..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button className="btn-secondary" onClick={closeModal}>
              Huỷ
            </button>
            <button className="btn-primary" onClick={handleSave}>
              {editingEvent ? 'Cập nhật' : 'Tạo sự kiện'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
