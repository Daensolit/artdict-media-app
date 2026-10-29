import type { ProjectStatus, PaymentStatus, EquipmentStatus, RevisionStatus, Priority, PostProductionStep } from '../types';

// Format currency
export function formatCurrency(amount: number, currency: string = 'VND'): string {
  if (currency === 'VND') {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

// Format date
export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(date);
}

export function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(date);
}

// Status colors
export function getProjectStatusColor(status: ProjectStatus): string {
  const colors: Record<ProjectStatus, string> = {
    'Draft': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    'Confirmed': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'In Production': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'Post-production': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    'Review': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'Delivered': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'Archived': 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function getPaymentStatusColor(status: PaymentStatus): string {
  const colors: Record<PaymentStatus, string> = {
    'Unpaid': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'Deposit': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'Partial': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Paid': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function getEquipmentStatusColor(status: EquipmentStatus): string {
  const colors: Record<EquipmentStatus, string> = {
    'Available': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'In Use': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'Maintenance': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'Lost': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function getRevisionStatusColor(status: RevisionStatus): string {
  const colors: Record<RevisionStatus, string> = {
    'Pending Review': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    'Changes Requested': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    'Approved': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function getPriorityColor(priority: Priority): string {
  const colors: Record<Priority, string> = {
    'Low': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    'Medium': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'High': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'Urgent': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return colors[priority] || 'bg-gray-100 text-gray-700';
}

export function getPostProductionStepColor(step: PostProductionStep): string {
  const colors: Record<PostProductionStep, string> = {
    'Ingest': 'bg-gray-500',
    'Rough Cut': 'bg-blue-500',
    'Color Grading': 'bg-purple-500',
    'Sound Design': 'bg-amber-500',
    'VFX': 'bg-pink-500',
    'Final Cut': 'bg-emerald-500',
    'Export': 'bg-indigo-500',
    'Done': 'bg-green-500',
  };
  return colors[step] || 'bg-gray-500';
}

// Project type colors for calendar
export function getProjectTypeColor(type: string): string {
  const colors: Record<string, string> = {
    'Wedding': '#f43f5e',
    'Event': '#8b5cf6',
    'TVC': '#f59e0b',
    'MV': '#ec4899',
    'Corporate': '#3b82f6',
    'Social Media': '#10b981',
    'Documentary': '#6366f1',
    'Short Film': '#14b8a6',
    'Live Stream': '#ef4444',
    'Other': '#6b7280',
  };
  return colors[type] || '#6b7280';
}

// Generate initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Avatar colors
const avatarColors = [
  'bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500',
  'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-rose-500',
  'bg-cyan-500', 'bg-orange-500',
];

export function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

// Days until date
export function daysUntil(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// Generate a simple UUID
export function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
}

// Search filter helper
export function matchesSearch(text: string, query: string): boolean {
  if (!query) return true;
  return text.toLowerCase().includes(query.toLowerCase());
}
