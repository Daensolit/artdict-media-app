// ============================================
// Media Team Management App - Type Definitions
// ============================================

// === Enums & Constants ===

export type ProjectType = 
  | 'Wedding' | 'Event' | 'TVC' | 'MV' | 'Corporate' 
  | 'Social Media' | 'Documentary' | 'Short Film' | 'Live Stream' | 'Other';

export type ProjectStatus = 
  | 'Draft' | 'Confirmed' | 'In Production' | 'Post-production' 
  | 'Review' | 'Delivered' | 'Archived';

export type PostProductionStep = 
  | 'Ingest' | 'Rough Cut' | 'Color Grading' | 'Sound Design' 
  | 'VFX' | 'Final Cut' | 'Export' | 'Done';

export type PaymentStatus = 
  | 'Unpaid' | 'Deposit' | 'Partial' | 'Paid';

export type EquipmentStatus = 
  | 'Available' | 'In Use' | 'Maintenance' | 'Lost';

export type EquipmentCategory = 
  | 'Camera' | 'Lens' | 'Gimbal' | 'Light' | 'Microphone' 
  | 'Battery' | 'Memory Card' | 'Drone' | 'Monitor' | 'Tripod' 
  | 'Audio Recorder' | 'Cable' | 'Filter' | 'Other';

export type TeamRole = 
  | 'Director' | 'DOP' | 'Camera Operator' | 'Editor' 
  | 'Colorist' | 'Sound Engineer' | 'Drone Pilot' | 'Gaffer' 
  | 'Production Assistant' | 'Producer' | 'Photographer' | 'Other';

export type RevisionStatus = 
  | 'Pending Review' | 'Changes Requested' | 'Approved';

export type Priority = 'Low' | 'Medium' | 'High' | 'Urgent';

// === Core Interfaces ===

export interface Project {
  id: string;
  name: string;
  clientId: string;
  clientCustomName?: string; // Tên khách hàng nhập tay nếu chưa có trong danh sách
  clientCustomPhone?: string; // Số điện thoại khách hàng tùy chỉnh
  managerId?: string; // Người quản lý job (Job Lead / Project Manager)
  salesPersonId?: string; // Người mang job về (Job Hunter)
  type: ProjectType;
  status: ProjectStatus;
  priority: Priority;
  brief: string; // Client requirements
  shootDates: string[]; // ISO date strings
  deadline: string; // ISO date string
  location: string;
  teamMemberIds: string[];
  equipmentChecklistIds: string[];
  budget: number;
  notes: string;
  moodboardLinks: string[];
  driveLink: string; // Link to Google Drive/Dropbox folder
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  projectIds: string[];
  createdAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: TeamRole;
  email: string;
  phone: string;
  avatar: string; // Initials or color
  skills: string[];
  projectRate: number; // Thù lao theo từng dự án (VND / project)
  hourlyRate?: number; // Tùy chọn tương thích ngược
  isActive: boolean;
  createdAt: string;
}

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  brand: string;
  model: string;
  serialNumber: string;
  status: EquipmentStatus;
  assignedToId: string | null; // TeamMember id
  currentProjectId: string | null;
  purchaseDate: string;
  notes: string;
  maintenanceDueDate: string | null;
  createdAt: string;
}

export interface EquipmentChecklist {
  id: string;
  projectId: string;
  shootDate: string;
  items: EquipmentChecklistItem[];
  responsiblePersonId: string;
  notes: string;
  createdAt: string;
}

export interface EquipmentChecklistItem {
  equipmentId: string;
  checked: boolean;
  assignedToId: string;
  returnedChecked: boolean;
}

export interface CalendarEvent {
  id: string;
  projectId: string;
  title: string;
  date: string; // ISO date string
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  type: 'shoot' | 'meeting' | 'deadline' | 'delivery' | 'other';
  location: string;
  reminder: number; // minutes before event
  notes: string;
  color: string;
}

export interface PostProductionTask {
  id: string;
  projectId: string;
  step: PostProductionStep;
  assignedToId: string;
  status: 'pending' | 'in_progress' | 'completed';
  deadline: string;
  completedAt: string | null;
  notes: string;
  progress: number; // 0-100
}

export interface Revision {
  id: string;
  projectId: string;
  revisionNumber: number;
  previewLink: string;
  status: RevisionStatus;
  feedback: string;
  timestamps: RevisionTimestamp[];
  maxRevisions: number; // Contract limit
  submittedAt: string;
  respondedAt: string | null;
}

export interface RevisionTimestamp {
  id: string;
  time: string; // Video timestamp like "01:23:45"
  comment: string;
  resolved: boolean;
}

export interface Expense {
  id: string;
  projectId: string;
  category: 'Personnel' | 'Equipment Rental' | 'Transport' | 'Food' | 'Props' | 'Location' | 'Software' | 'Other';
  description: string;
  amount: number;
  date: string;
  paidById: string;
  receipt: string; // file path or note
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  projectId: string;
  clientId: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  paymentStatus: PaymentStatus;
  depositAmount: number;
  depositPaidDate: string | null;
  dueDate: string;
  paidDate: string | null;
  notes: string;
  companyInfo: CompanyInfo;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CompanyInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  bankName: string;
  bankAccount: string;
  bankAccountName: string;
  logo: string; // base64 or URL
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'reminder' | 'deadline' | 'equipment' | 'payment' | 'revision' | 'announcement';
  relatedProjectId: string | null;
  isRead: boolean;
  scheduledAt: string;
  createdAt: string;
  senderName?: string; // Tên người gửi (VD: Admin Daensolit)
}

export interface ShotListItem {
  id: string;
  projectId: string;
  sceneNumber: string;
  shotNumber: string;
  description: string;
  shotType: string; // Wide, Medium, Close-up, etc.
  equipment: string;
  notes: string;
  completed: boolean;
  order: number;
}

export type UserRole = 'admin' | 'manager' | 'employee';

export interface UserPermissions {
  canManageProjects: boolean;
  canManageTeam: boolean;
  canManageEquipment: boolean;
  canManageFinance: boolean; // Quản lý chi phí & hóa đơn
  canManageClients: boolean;
  canManageUsers: boolean;   // Chỉ admin có quyền này
}

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: UserRole;
  permissions: UserPermissions;
  isProtected?: boolean; // Riêng tài khoản daensolit không thể bị xóa hoặc sửa phân quyền
  isActive: boolean;
  teamMemberId?: string; // Liên kết tới thành viên trong team
  createdAt: string;
}

export interface AppSettings {
  darkMode: boolean;
  companyInfo: CompanyInfo;
  defaultTaxRate: number;
  defaultMaxRevisions: number;
  reminderDefaults: number[]; // minutes before event
  currency: string;
  language: string;
}

// === Store State ===

export interface AppState {
  // Authentication & Users
  users: User[];
  currentUser: User | null;
  login: (username: string, password: string) => { success: boolean; message?: string };
  logout: () => void;
  addUser: (user: User) => { success: boolean; message?: string };
  updateUser: (id: string, updates: Partial<User>) => { success: boolean; message?: string };
  deleteUser: (id: string) => { success: boolean; message?: string };

  // Data
  projects: Project[];
  clients: Client[];
  teamMembers: TeamMember[];
  equipment: Equipment[];
  equipmentChecklists: EquipmentChecklist[];
  calendarEvents: CalendarEvent[];
  postProductionTasks: PostProductionTask[];
  revisions: Revision[];
  expenses: Expense[];
  invoices: Invoice[];
  notifications: Notification[];
  shotListItems: ShotListItem[];
  settings: AppSettings;

  // Actions - Projects
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // Actions - Clients
  addClient: (client: Client) => void;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  // Actions - Team Members
  addTeamMember: (member: TeamMember) => void;
  updateTeamMember: (id: string, updates: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;

  // Actions - Equipment
  addEquipment: (equipment: Equipment) => void;
  updateEquipment: (id: string, updates: Partial<Equipment>) => void;
  deleteEquipment: (id: string) => void;

  // Actions - Equipment Checklists
  addEquipmentChecklist: (checklist: EquipmentChecklist) => void;
  updateEquipmentChecklist: (id: string, updates: Partial<EquipmentChecklist>) => void;
  deleteEquipmentChecklist: (id: string) => void;

  // Actions - Calendar Events
  addCalendarEvent: (event: CalendarEvent) => void;
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;

  // Actions - Post Production
  addPostProductionTask: (task: PostProductionTask) => void;
  updatePostProductionTask: (id: string, updates: Partial<PostProductionTask>) => void;
  deletePostProductionTask: (id: string) => void;

  // Actions - Revisions
  addRevision: (revision: Revision) => void;
  updateRevision: (id: string, updates: Partial<Revision>) => void;
  deleteRevision: (id: string) => void;

  // Actions - Expenses
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  // Actions - Invoices
  addInvoice: (invoice: Invoice) => void;
  updateInvoice: (id: string, updates: Partial<Invoice>) => void;
  deleteInvoice: (id: string) => void;

  // Actions - Notifications
  addNotification: (notification: Notification) => void;
  sendBroadcastNotification: (title: string, message: string, type?: Notification['type'], projectId?: string | null) => void;
  deleteNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // Actions - Shot List
  addShotListItem: (item: ShotListItem) => void;
  updateShotListItem: (id: string, updates: Partial<ShotListItem>) => void;
  deleteShotListItem: (id: string) => void;

  // Actions - Settings
  updateSettings: (updates: Partial<AppSettings>) => void;
}
