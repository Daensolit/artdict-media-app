import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  AppState, Project, Client, TeamMember, Equipment, EquipmentChecklist,
  CalendarEvent, PostProductionTask, Revision, Expense, Invoice,
  Notification, ShotListItem, AppSettings, User
} from '../types';
import { generateId } from '../utils/helpers';

const defaultCompanyInfo = {
  name: 'Artdict Media',
  address: 'Tầng 4, Tòa nhà Sáng Tạo, 128 Nguyễn Đình Chiểu, Q.3, TP. Hồ Chí Minh',
  phone: '0908 160 707',
  email: 'contact@artdictmedia.vn',
  website: 'www.artdictmedia.vn',
  taxId: '0316070789',
  bankName: 'Techcombank',
  bankAccount: '19036789160707',
  bankAccountName: 'CONG TY TNHH ARTDICT MEDIA',
  logo: '/artdict-logo.jpg',
};

const defaultSettings: AppSettings = {
  darkMode: false,
  companyInfo: defaultCompanyInfo,
  defaultTaxRate: 10,
  defaultMaxRevisions: 3,
  reminderDefaults: [1440, 120, 30],
  currency: 'VND',
  language: 'vi',
};

// Initial admin & employees
export const initialUsers: User[] = [
  {
    id: 'user-admin-daensolit',
    username: 'daensolit',
    password: '160707',
    name: 'Daensolit (Master Admin)',
    role: 'admin',
    isProtected: true, // Tài khoản daensolit là bất khả xâm phạm
    isActive: true,
    teamMemberId: 'tm-daensolit',
    createdAt: '2026-01-01T00:00:00.000Z',
    permissions: {
      canManageProjects: true,
      canManageTeam: true,
      canManageEquipment: true,
      canManageFinance: true,
      canManageClients: true,
      canManageUsers: true,
    },
  },
  {
    id: 'user-emp-hoanganh',
    username: 'hoanganh',
    password: '123456',
    name: 'Hoàng Anh (DOP)',
    role: 'employee',
    isProtected: false,
    isActive: true,
    teamMemberId: 'tm-hoanganh',
    createdAt: '2026-01-02T00:00:00.000Z',
    permissions: {
      canManageProjects: true,
      canManageTeam: false,
      canManageEquipment: true,
      canManageFinance: false,
      canManageClients: false,
      canManageUsers: false,
    },
  },
  {
    id: 'user-mgr-lanphuong',
    username: 'lanphuong',
    password: '123456',
    name: 'Lan Phương (Producer / PM)',
    role: 'manager',
    isProtected: false,
    isActive: true,
    teamMemberId: 'tm-lanphuong',
    createdAt: '2026-01-03T00:00:00.000Z',
    permissions: {
      canManageProjects: true,
      canManageTeam: true,
      canManageEquipment: true,
      canManageFinance: true,
      canManageClients: true,
      canManageUsers: false,
    },
  },
];

// Initial synchronized team members
const initialTeamMembers: TeamMember[] = [
  {
    id: 'tm-daensolit',
    name: 'Daensolit',
    role: 'Director',
    email: 'daensolit@artdictmedia.vn',
    phone: '0908 160 707',
    avatar: 'DS',
    skills: ['Đạo diễn', 'Sáng tạo ý tưởng', 'Quản lý dự án', 'Showrunner'],
    projectRate: 20000000,
    hourlyRate: 1500000,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'tm-hoanganh',
    name: 'Hoàng Anh',
    role: 'DOP',
    email: 'hoanganh@artdictmedia.vn',
    phone: '0912 345 678',
    avatar: 'HA',
    skills: ['Cinematography', 'Ánh sáng nghệ thuật', 'Sony FX series', 'Ronin Stabilizer'],
    projectRate: 12000000,
    hourlyRate: 1000000,
    isActive: true,
    createdAt: '2026-01-02T00:00:00.000Z',
  },
  {
    id: 'tm-minhtu',
    name: 'Minh Tú',
    role: 'Editor',
    email: 'minhtu@artdictmedia.vn',
    phone: '0933 888 999',
    avatar: 'MT',
    skills: ['DaVinci Resolve', 'Color Grading', 'Premiere Pro', 'After Effects'],
    projectRate: 9000000,
    hourlyRate: 850000,
    isActive: true,
    createdAt: '2026-01-03T00:00:00.000Z',
  },
  {
    id: 'tm-lanphuong',
    name: 'Lan Phương',
    role: 'Producer',
    email: 'lanphuong@artdictmedia.vn',
    phone: '0977 112 233',
    avatar: 'LP',
    skills: ['Điều phối sản xuất', 'Khách hàng', 'Quản lý ngân sách', 'Casting'],
    projectRate: 10000000,
    hourlyRate: 750000,
    isActive: true,
    createdAt: '2026-01-04T00:00:00.000Z',
  },
  {
    id: 'tm-quocbao',
    name: 'Quốc Bảo',
    role: 'Drone Pilot',
    email: 'quocbao@artdictmedia.vn',
    phone: '0988 445 566',
    avatar: 'QB',
    skills: ['FPV Drone', 'Ghi âm hiện trường', 'DJI Mavic Cine', 'Sound Design'],
    projectRate: 8000000,
    hourlyRate: 900000,
    isActive: true,
    createdAt: '2026-01-05T00:00:00.000Z',
  },
];

// Initial synchronized clients
const initialClients: Client[] = [
  {
    id: 'client-vinfast',
    name: 'Trần Minh Đức',
    company: 'VinFast Vietnam',
    email: 'duc.tm@vinfast.vn',
    phone: '0903 111 222',
    address: 'Vinhomes Central Park, Q. Bình Thạnh, TP. HCM',
    notes: 'Khách hàng VIP mảng ô tô điện. Cần hình ảnh đậm chất tương lai, công nghệ cao.',
    projectIds: ['proj-1'],
    createdAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: 'client-sunlife',
    name: 'Nguyễn Bích Ngọc',
    company: 'Sun Life Media',
    email: 'ngoc.nb@sunlife.com',
    phone: '0909 333 444',
    address: 'Tòa nhà Sun Wah, Nguyễn Huệ, Q.1, TP. HCM',
    notes: 'Dự án MV âm nhạc & nghệ thuật tài trợ.',
    projectIds: ['proj-2'],
    createdAt: '2026-01-12T00:00:00.000Z',
  },
  {
    id: 'client-coffeehouse',
    name: 'Lê Hoàng Nam',
    company: 'The Coffee House',
    email: 'nam.lh@thecoffeehouse.vn',
    phone: '0908 555 666',
    address: '86-88 Cao Thắng, Q.3, TP. HCM',
    notes: 'Chiến dịch Tết, yêu cầu tone ấm áp, giàu cảm xúc gia đình.',
    projectIds: ['proj-3'],
    createdAt: '2026-01-15T00:00:00.000Z',
  },
];

// Initial synchronized projects with managerId
const initialProjects: Project[] = [
  {
    id: 'proj-1',
    name: 'TVC Ra Mắt Xe Điện VF7 - VinFast',
    clientId: 'client-vinfast',
    managerId: 'tm-daensolit', // Quản lý bởi Daensolit
    salesPersonId: 'tm-daensolit',
    type: 'TVC',
    status: 'In Production',
    priority: 'Urgent',
    brief: 'TVC 60s và cut-down 30s/15s quay bối cảnh đường phố Sài Gòn về đêm và đèo Bảo Lộc. Tone màu neon cyberpunk kết hợp phong cách điện ảnh cao cấp.',
    shootDates: ['2026-11-05', '2026-11-06'],
    deadline: '2026-11-20',
    location: 'Quận 2, TP.HCM & Đèo Bảo Lộc',
    teamMemberIds: ['tm-daensolit', 'tm-hoanganh', 'tm-minhtu', 'tm-quocbao'],
    equipmentChecklistIds: ['eq-1', 'eq-3', 'eq-5', 'eq-6', 'eq-8'],
    budget: 180000000,
    notes: 'Cần giấy phép bay flycam tại đèo Bảo Lộc. Daensolit trực tiếp đạo diễn.',
    moodboardLinks: ['https://pinterest.com/artdict/cyber-vf7'],
    driveLink: 'https://drive.google.com/drive/folders/artdict-vf7-tvc',
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: 'proj-2',
    name: "MV Âm Nhạc 'Mùa Thu Cho Em' - Sun Life",
    clientId: 'client-sunlife',
    managerId: 'tm-hoanganh', // Quản lý bởi Hoàng Anh
    salesPersonId: 'tm-hoanganh',
    type: 'MV',
    status: 'Post-production',
    priority: 'High',
    brief: 'MV Acoustic 4K quay tại Đà Lạt. Yêu cầu màu film vintage, ánh sáng tự nhiên vàng ấm.',
    shootDates: ['2026-10-20', '2026-10-21'],
    deadline: '2026-11-10',
    location: 'Hồ Tuyền Lâm & Rừng Thông, Đà Lạt',
    teamMemberIds: ['tm-hoanganh', 'tm-minhtu', 'tm-lanphuong'],
    equipmentChecklistIds: ['eq-1', 'eq-4', 'eq-7'],
    budget: 95000000,
    notes: 'Đã quay xong, đang trong giai đoạn dựng rough cut và chỉnh màu.',
    moodboardLinks: ['https://pinterest.com/artdict/vintage-autumn'],
    driveLink: 'https://drive.google.com/drive/folders/artdict-mv-sunlife',
    createdAt: '2026-01-12T00:00:00.000Z',
    updatedAt: '2026-01-12T00:00:00.000Z',
  },
  {
    id: 'proj-3',
    name: 'Viral Video Tết 2027 - The Coffee House',
    clientId: 'client-coffeehouse',
    managerId: 'tm-daensolit', // Quản lý bởi Daensolit
    salesPersonId: 'tm-daensolit',
    type: 'Social Media',
    status: 'Confirmed',
    priority: 'High',
    brief: 'Video thông điệp sum vầy 3 phút lan tỏa mạng xã hội. Bối cảnh tiệm cà phê phố cổ và gia đình sum họp.',
    shootDates: ['2026-11-15', '2026-11-16'],
    deadline: '2026-12-05',
    location: 'Cửa hàng The Coffee House & Phim trường Quận 9',
    teamMemberIds: ['tm-daensolit', 'tm-hoanganh', 'tm-minhtu', 'tm-lanphuong', 'tm-quocbao'],
    equipmentChecklistIds: ['eq-1', 'eq-2', 'eq-3', 'eq-6', 'eq-7'],
    budget: 120000000,
    notes: 'Cần diễn viên quần chúng và chuẩn bị props cành đào, bánh chưng.',
    moodboardLinks: ['https://pinterest.com/artdict/tet-coffeehouse'],
    driveLink: 'https://drive.google.com/drive/folders/artdict-tet-tch',
    createdAt: '2026-01-15T00:00:00.000Z',
    updatedAt: '2026-01-15T00:00:00.000Z',
  },
  {
    id: 'proj-4',
    name: 'Phim Doanh Nghiệp - Tech Horizon Global',
    clientId: 'client-vinfast',
    managerId: 'tm-lanphuong', // Quản lý bởi Lan Phương
    salesPersonId: 'tm-lanphuong',
    type: 'Corporate',
    status: 'Review',
    priority: 'Medium',
    brief: 'Giới thiệu năng lực công nghệ và đội ngũ R&D. Phỏng vấn ban lãnh đạo và footage văn phòng mở.',
    shootDates: ['2026-10-15'],
    deadline: '2026-11-02',
    location: 'Khu Công Nghệ Cao Quận 9, TP. HCM',
    teamMemberIds: ['tm-lanphuong', 'tm-hoanganh', 'tm-minhtu'],
    equipmentChecklistIds: ['eq-2', 'eq-3', 'eq-6', 'eq-7'],
    budget: 65000000,
    notes: 'Bản cut v2 đang gửi ban giám đốc duyệt feedback.',
    moodboardLinks: [],
    driveLink: 'https://drive.google.com/drive/folders/tech-horizon',
    createdAt: '2026-01-08T00:00:00.000Z',
    updatedAt: '2026-01-08T00:00:00.000Z',
  },
];

// Initial synchronized equipment
const initialEquipment: Equipment[] = [
  {
    id: 'eq-1',
    name: 'Sony FX6 Cinema Line',
    category: 'Camera',
    brand: 'Sony',
    model: 'ILME-FX6V',
    serialNumber: 'SN-FX6-889901',
    status: 'In Use',
    assignedToId: 'tm-hoanganh',
    currentProjectId: 'proj-1',
    purchaseDate: '2025-03-15',
    notes: 'Bao gồm 3 pin BP-U70 và 2 thẻ CFexpress Type A 160GB.',
    maintenanceDueDate: '2026-12-15',
    createdAt: '2025-03-15T00:00:00.000Z',
  },
  {
    id: 'eq-2',
    name: 'Sony A7S III',
    category: 'Camera',
    brand: 'Sony',
    model: 'ILCE-7SM3',
    serialNumber: 'SN-A7S3-442211',
    status: 'Available',
    assignedToId: null,
    currentProjectId: null,
    purchaseDate: '2025-01-10',
    notes: 'Máy backup hoặc quay B-roll góc 2.',
    maintenanceDueDate: null,
    createdAt: '2025-01-10T00:00:00.000Z',
  },
  {
    id: 'eq-3',
    name: 'Sony FE 24-70mm f/2.8 GM II',
    category: 'Lens',
    brand: 'Sony',
    model: 'SEL2470GM2',
    serialNumber: 'SN-LENS-2470-77',
    status: 'In Use',
    assignedToId: 'tm-hoanganh',
    currentProjectId: 'proj-1',
    purchaseDate: '2025-03-20',
    notes: 'Lens đa dụng chất lượng cao, giữ gìn kính trước cẩn thận.',
    maintenanceDueDate: null,
    createdAt: '2025-03-20T00:00:00.000Z',
  },
  {
    id: 'eq-4',
    name: 'Sony FE 70-200mm f/2.8 GM OSS II',
    category: 'Lens',
    brand: 'Sony',
    model: 'SEL70200GM2',
    serialNumber: 'SN-LENS-70200-99',
    status: 'Available',
    assignedToId: null,
    currentProjectId: null,
    purchaseDate: '2025-05-10',
    notes: 'Telezoom chân dung xóa phông cao cấp.',
    maintenanceDueDate: null,
    createdAt: '2025-05-10T00:00:00.000Z',
  },
  {
    id: 'eq-5',
    name: 'DJI RS3 Pro Gimbal Combo',
    category: 'Gimbal',
    brand: 'DJI',
    model: 'Ronin RS3 Pro',
    serialNumber: 'SN-DJI-RS3P-12',
    status: 'In Use',
    assignedToId: 'tm-hoanganh',
    currentProjectId: 'proj-1',
    purchaseDate: '2025-04-01',
    notes: 'Kèm RavenEye và động cơ Focus Motor.',
    maintenanceDueDate: null,
    createdAt: '2025-04-01T00:00:00.000Z',
  },
  {
    id: 'eq-6',
    name: 'Aputure LS 600d Pro Light Storm',
    category: 'Light',
    brand: 'Aputure',
    model: 'LS 600d Pro',
    serialNumber: 'SN-APUT-600D-01',
    status: 'In Use',
    assignedToId: 'tm-hoanganh',
    currentProjectId: 'proj-1',
    purchaseDate: '2025-06-15',
    notes: 'Kèm chân C-Stand và Light Dome 150cm.',
    maintenanceDueDate: '2026-11-30',
    createdAt: '2025-06-15T00:00:00.000Z',
  },
  {
    id: 'eq-7',
    name: 'DJI Mic 2 (2 TX + 1 RX)',
    category: 'Microphone',
    brand: 'DJI',
    model: 'Mic 2',
    serialNumber: 'SN-DJI-MIC2-55',
    status: 'Available',
    assignedToId: null,
    currentProjectId: null,
    purchaseDate: '2025-08-20',
    notes: 'Có tính năng ghi âm 32-bit float chống vỡ tiếng.',
    maintenanceDueDate: null,
    createdAt: '2025-08-20T00:00:00.000Z',
  },
  {
    id: 'eq-8',
    name: 'DJI Mavic 3 Pro Cine',
    category: 'Drone',
    brand: 'DJI',
    model: 'Mavic 3 Pro Cine',
    serialNumber: 'SN-DJI-M3PC-88',
    status: 'In Use',
    assignedToId: 'tm-quocbao',
    currentProjectId: 'proj-1',
    purchaseDate: '2025-09-01',
    notes: 'Hỗ trợ Apple ProRes 422 HQ, SSD 1TB tích hợp, 3 pin sạc.',
    maintenanceDueDate: '2026-12-01',
    createdAt: '2025-09-01T00:00:00.000Z',
  },
];

// Initial synchronized invoices
const initialInvoices: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-001',
    projectId: 'proj-1',
    clientId: 'client-vinfast',
    items: [
      { id: 'i-1', description: 'Gói quay TVC Quảng cáo 60s & 30s xe điện VF7', quantity: 1, unitPrice: 150000000, total: 150000000 },
      { id: 'i-2', description: 'Chi phí quay FPV Drone đèo Bảo Lộc', quantity: 1, unitPrice: 30000000, total: 30000000 },
    ],
    subtotal: 180000000,
    taxRate: 10,
    tax: 18000000,
    total: 198000000,
    paymentStatus: 'Partial',
    depositAmount: 99000000,
    depositPaidDate: '2026-01-11',
    dueDate: '2026-11-25',
    paidDate: null,
    notes: 'Khách đã thanh toán đợt 1 (50% cọc). Đợt 2 thanh toán sau khi bàn giao master file.',
    companyInfo: defaultCompanyInfo,
    createdAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2026-002',
    projectId: 'proj-2',
    clientId: 'client-sunlife',
    items: [
      { id: 'i-3', description: 'Sản xuất MV Acoustic trọn gói tại Đà Lạt', quantity: 1, unitPrice: 95000000, total: 95000000 },
    ],
    subtotal: 95000000,
    taxRate: 10,
    tax: 9500000,
    total: 104500000,
    paymentStatus: 'Paid',
    depositAmount: 104500000,
    depositPaidDate: '2026-01-13',
    dueDate: '2026-11-15',
    paidDate: '2026-10-25',
    notes: 'Đã thanh toán 100% trước khi off-line review.',
    companyInfo: defaultCompanyInfo,
    createdAt: '2026-01-12T00:00:00.000Z',
  },
];

// Initial synchronized expenses
const initialExpenses: Expense[] = [
  {
    id: 'exp-1',
    projectId: 'proj-1',
    category: 'Transport',
    description: 'Thuê xe Ford Transit 16 chỗ chở đoàn đi Bảo Lộc 2 ngày',
    amount: 5500000,
    date: '2026-11-04',
    paidById: 'tm-lanphuong',
    receipt: 'Hóa đơn nhà xe Thành Bưởi',
    createdAt: '2026-01-12T00:00:00.000Z',
  },
  {
    id: 'exp-2',
    projectId: 'proj-1',
    category: 'Food',
    description: 'Catering ăn trưa và ăn tối đoàn phim 18 người',
    amount: 3800000,
    date: '2026-11-05',
    paidById: 'tm-lanphuong',
    receipt: 'Phiếu thu nhà hàng Cơm Niêu Bảo Lộc',
    createdAt: '2026-01-12T00:00:00.000Z',
  },
  {
    id: 'exp-3',
    projectId: 'proj-2',
    category: 'Props',
    description: 'Mua đạo cụ hoa cỏ vintage & trang phục ca sĩ acoustic',
    amount: 4200000,
    date: '2026-10-18',
    paidById: 'tm-hoanganh',
    receipt: 'Chuyển khoản shop vintage Đà Lạt',
    createdAt: '2026-01-13T00:00:00.000Z',
  },
];

// Initial synchronized calendar events
const initialCalendarEvents: CalendarEvent[] = [
  {
    id: 'cal-1',
    projectId: 'proj-1',
    title: '🎬 Shoot Ngày 1: TVC VF7 - Cảnh Đêm Sài Gòn',
    date: '2026-11-05',
    startTime: '18:00',
    endTime: '23:30',
    type: 'shoot',
    location: 'Quận 2, Cầu Thủ Thiêm 2, TP.HCM',
    reminder: 120,
    notes: 'Tập trung lúc 16:30 kiểm tra gear Sony FX6 và gimbal.',
    color: '#f59e0b',
  },
  {
    id: 'cal-2',
    projectId: 'proj-1',
    title: '🎬 Shoot Ngày 2: FPV Drone Đèo Bảo Lộc',
    date: '2026-11-06',
    startTime: '05:00',
    endTime: '11:00',
    type: 'shoot',
    location: 'Đèo Bảo Lộc, Lâm Đồng',
    reminder: 1440,
    notes: 'Đón bình minh săn sương mù. Quốc Bảo phụ trách bay drone Cine.',
    color: '#f59e0b',
  },
  {
    id: 'cal-3',
    projectId: 'proj-2',
    title: '🎞️ Họp Client Review MV Bản Final Cut',
    date: '2026-11-08',
    startTime: '14:00',
    endTime: '15:30',
    type: 'meeting',
    location: 'Văn phòng Artdict Media',
    reminder: 60,
    notes: 'Chiếu demo bản color grading trên màn hình chuẩn màu.',
    color: '#ec4899',
  },
  {
    id: 'cal-4',
    projectId: 'proj-3',
    title: '📢 Họp Pre-production Viral Tết - The Coffee House',
    date: '2026-11-12',
    startTime: '09:30',
    endTime: '11:30',
    type: 'meeting',
    location: 'Trụ sở The Coffee House',
    reminder: 120,
    notes: 'Chốt kịch bản phân cảnh và danh sách diễn viên.',
    color: '#10b981',
  },
];

// Initial post-production tasks
const initialPostProductionTasks: PostProductionTask[] = [
  {
    id: 'post-1',
    projectId: 'proj-2',
    step: 'Color Grading',
    assignedToId: 'tm-minhtu',
    status: 'in_progress',
    deadline: '2026-11-06',
    completedAt: null,
    notes: 'Tạo look phim Kodak 2383 ấm áp vintage theo moodboard.',
    progress: 70,
  },
  {
    id: 'post-2',
    projectId: 'proj-2',
    step: 'Sound Design',
    assignedToId: 'tm-quocbao',
    status: 'pending',
    deadline: '2026-11-08',
    completedAt: null,
    notes: 'Lọc tiếng gió rừng thông, mix tiếng đàn guitar mộc sạch sẽ.',
    progress: 20,
  },
  {
    id: 'post-3',
    projectId: 'proj-1',
    step: 'Rough Cut',
    assignedToId: 'tm-minhtu',
    status: 'pending',
    deadline: '2026-11-12',
    completedAt: null,
    notes: 'Chuẩn bị thư mục ingest footage thẻ Sony FX6.',
    progress: 0,
  },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Authentication & Users
      users: initialUsers,
      currentUser: null, // Bắt đầu ở màn hình đăng nhập (không tự động đăng nhập admin)

      login: (username: string, password: string) => {
        const user = get().users.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());
        if (!user) {
          return { success: false, message: 'Tên đăng nhập không tồn tại!' };
        }
        if (!user.isActive) {
          return { success: false, message: 'Tài khoản này đang bị khóa!' };
        }
        if (user.password !== password) {
          return { success: false, message: 'Mật khẩu không chính xác!' };
        }
        set({ currentUser: user });
        return { success: true };
      },

      logout: () => {
        set({ currentUser: null });
      },

      addUser: (user: User) => {
        const exists = get().users.some((u) => u.username.toLowerCase() === user.username.trim().toLowerCase());
        if (exists) {
          return { success: false, message: 'Tên đăng nhập đã được sử dụng!' };
        }
        set((state) => ({ users: [...state.users, user] }));
        return { success: true };
      },

      updateUser: (id: string, updates: Partial<User>) => {
        const target = get().users.find((u) => u.id === id);
        if (!target) {
          return { success: false, message: 'Không tìm thấy tài khoản!' };
        }

        // BẢO VỆ TÀI KHOẢN DAENSOLIT: Không thể thay đổi username, role hay khóa tài khoản
        if (target.username === 'daensolit' || target.isProtected) {
          const safeUpdates = { ...updates };
          delete safeUpdates.username;
          delete safeUpdates.role;
          delete safeUpdates.isProtected;
          delete safeUpdates.isActive;
          
          set((state) => ({
            users: state.users.map((u) => (u.id === id ? { ...u, ...safeUpdates, isProtected: true, role: 'admin', isActive: true } : u)),
            currentUser: state.currentUser?.id === id ? { ...state.currentUser, ...safeUpdates, isProtected: true, role: 'admin', isActive: true } : state.currentUser,
          }));
          return { success: true, message: 'Đã cập nhật thông tin (Tài khoản daensolit được bảo vệ phân quyền admin tối cao)' };
        }

        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
          currentUser: state.currentUser?.id === id ? { ...state.currentUser, ...updates } : state.currentUser,
        }));
        return { success: true };
      },

      deleteUser: (id: string) => {
        const target = get().users.find((u) => u.id === id);
        if (!target) {
          return { success: false, message: 'Không tìm thấy tài khoản!' };
        }
        // BẢO VỆ TÀI KHOẢN DAENSOLIT: Tuyệt đối không thể xóa
        if (target.username === 'daensolit' || target.isProtected) {
          return { success: false, message: 'Tài khoản daensolit là tài khoản quản trị tối cao, không thể xóa!' };
        }
        set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
        return { success: true };
      },

      // Synchronized Data
      projects: initialProjects,
      clients: initialClients,
      teamMembers: initialTeamMembers,
      equipment: initialEquipment,
      equipmentChecklists: [],
      calendarEvents: initialCalendarEvents,
      postProductionTasks: initialPostProductionTasks,
      revisions: [],
      expenses: initialExpenses,
      invoices: initialInvoices,
      notifications: [
        {
          id: 'notif-1',
          title: 'Chào mừng đến với Artdict Media',
          message: 'Hệ thống đã đồng bộ toàn bộ dữ liệu dự án, thiết bị và bảng vinh danh.',
          type: 'reminder',
          relatedProjectId: null,
          isRead: false,
          scheduledAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ],
      shotListItems: [],
      settings: defaultSettings,

      // Projects
      addProject: (project: Project) =>
        set((state) => ({ projects: [...state.projects, project] })),
      updateProject: (id: string, updates: Partial<Project>) =>
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)),
        })),
      deleteProject: (id: string) =>
        set((state) => ({ projects: state.projects.filter((p) => p.id !== id) })),

      // Clients
      addClient: (client: Client) =>
        set((state) => ({ clients: [...state.clients, client] })),
      updateClient: (id: string, updates: Partial<Client>) =>
        set((state) => ({
          clients: state.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      deleteClient: (id: string) =>
        set((state) => ({ clients: state.clients.filter((c) => c.id !== id) })),

      // Team Members
      addTeamMember: (member: TeamMember) =>
        set((state) => ({ teamMembers: [...state.teamMembers, member] })),
      updateTeamMember: (id: string, updates: Partial<TeamMember>) =>
        set((state) => ({
          teamMembers: state.teamMembers.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        })),
      deleteTeamMember: (id: string) =>
        set((state) => ({ teamMembers: state.teamMembers.filter((m) => m.id !== id) })),

      // Equipment
      addEquipment: (equipment: Equipment) =>
        set((state) => ({ equipment: [...state.equipment, equipment] })),
      updateEquipment: (id: string, updates: Partial<Equipment>) =>
        set((state) => ({
          equipment: state.equipment.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),
      deleteEquipment: (id: string) =>
        set((state) => ({ equipment: state.equipment.filter((e) => e.id !== id) })),

      // Equipment Checklists
      addEquipmentChecklist: (checklist: EquipmentChecklist) =>
        set((state) => ({ equipmentChecklists: [...state.equipmentChecklists, checklist] })),
      updateEquipmentChecklist: (id: string, updates: Partial<EquipmentChecklist>) =>
        set((state) => ({
          equipmentChecklists: state.equipmentChecklists.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),
      deleteEquipmentChecklist: (id: string) =>
        set((state) => ({ equipmentChecklists: state.equipmentChecklists.filter((c) => c.id !== id) })),

      // Calendar Events
      addCalendarEvent: (event: CalendarEvent) =>
        set((state) => ({ calendarEvents: [...state.calendarEvents, event] })),
      updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) =>
        set((state) => ({
          calendarEvents: state.calendarEvents.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),
      deleteCalendarEvent: (id: string) =>
        set((state) => ({ calendarEvents: state.calendarEvents.filter((e) => e.id !== id) })),

      // Post Production Tasks
      addPostProductionTask: (task: PostProductionTask) =>
        set((state) => ({ postProductionTasks: [...state.postProductionTasks, task] })),
      updatePostProductionTask: (id: string, updates: Partial<PostProductionTask>) =>
        set((state) => ({
          postProductionTasks: state.postProductionTasks.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),
      deletePostProductionTask: (id: string) =>
        set((state) => ({ postProductionTasks: state.postProductionTasks.filter((t) => t.id !== id) })),

      // Revisions
      addRevision: (revision: Revision) =>
        set((state) => ({ revisions: [...state.revisions, revision] })),
      updateRevision: (id: string, updates: Partial<Revision>) =>
        set((state) => ({
          revisions: state.revisions.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        })),
      deleteRevision: (id: string) =>
        set((state) => ({ revisions: state.revisions.filter((r) => r.id !== id) })),

      // Expenses
      addExpense: (expense: Expense) =>
        set((state) => ({ expenses: [...state.expenses, expense] })),
      updateExpense: (id: string, updates: Partial<Expense>) =>
        set((state) => ({
          expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        })),
      deleteExpense: (id: string) =>
        set((state) => ({ expenses: state.expenses.filter((e) => e.id !== id) })),

      // Invoices
      addInvoice: (invoice: Invoice) =>
        set((state) => ({ invoices: [...state.invoices, invoice] })),
      updateInvoice: (id: string, updates: Partial<Invoice>) =>
        set((state) => ({
          invoices: state.invoices.map((i) => (i.id === id ? { ...i, ...updates } : i)),
        })),
      deleteInvoice: (id: string) =>
        set((state) => ({ invoices: state.invoices.filter((i) => i.id !== id) })),

      // Notifications
      addNotification: (notification: Notification) =>
        set((state) => ({ notifications: [notification, ...state.notifications] })),
      sendBroadcastNotification: (title: string, message: string, type: Notification['type'] = 'announcement', projectId: string | null = null) => {
        const sender = get().currentUser?.name || 'Ban Quản Trị (Admin)';
        const newNotif: Notification = {
          id: generateId(),
          title,
          message,
          type,
          relatedProjectId: projectId,
          isRead: false,
          scheduledAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          senderName: sender,
        };
        set((state) => ({ notifications: [newNotif, ...state.notifications] }));
      },
      deleteNotification: (id: string) =>
        set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),
      markNotificationRead: (id: string) =>
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        })),
      clearNotifications: () => set({ notifications: [] }),

      // Shot List
      addShotListItem: (item: ShotListItem) =>
        set((state) => ({ shotListItems: [...state.shotListItems, item] })),
      updateShotListItem: (id: string, updates: Partial<ShotListItem>) =>
        set((state) => ({
          shotListItems: state.shotListItems.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        })),
      deleteShotListItem: (id: string) =>
        set((state) => ({ shotListItems: state.shotListItems.filter((s) => s.id !== id) })),

      // Settings
      updateSettings: (updates: Partial<AppSettings>) =>
        set((state) => ({ settings: { ...state.settings, ...updates } })),
    }),
    {
      name: 'artdict-media-storage-v5',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const hasDaensolit = state.users?.some((u) => u.username === 'daensolit');
          if (!hasDaensolit) {
            state.users = [...(state.users || []), initialUsers[0]];
          }
          // Giữ nguyên currentUser từ storage hoặc null, TUYỆT ĐỐI KHÔNG tự động đăng nhập admin!
        }
      },
    }
  )
);
