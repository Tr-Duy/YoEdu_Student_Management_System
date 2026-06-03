// Enums mapping using String Literal Unions as requested (no TS enums)
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type StudentStatus = 'ACTIVE' | 'PAUSE' | 'PAUSED' | 'DROPPED';

export type TeacherRole = 'TEACHER' | 'ASSISTANT' | 'BOTH' | 'MAIN';

export type ClassStatus = 'OPEN' | 'ONGOING' | 'CLOSED' | 'FULL';

export type EnrollmentStatus = 'ACTIVE' | 'PAUSE' | 'PAUSED' | 'DROPPED' | 'COMPLETED';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER';

export type DiscountType = 'PERCENTAGE' | 'FIXED' | 'PERCENT' | 'AMOUNT' | 'FIXED_AMOUNT';

export type InvoiceStatus = 'UNPAID' | 'PARTIAL' | 'PARTIALLY_PAID' | 'PAID' | 'OVERPAID';

export type LeaveRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

// Shared base interface for backend audited items
export interface Auditable {
  id: number;
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// AUTHENTICATION & USERS
// ==========================================
export interface CurrentUser {
  id: number;
  username: string;
  fullname: string;
  role: 'ADMIN' | 'ACADEMIC_STAFF' | 'CASHIER' | 'PARENT';
  parentId: number | null;
  teacherId: number | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: string;
  refeshExpiresAt: string;
  user: CurrentUser;
}

// ==========================================
// PARENT
// ==========================================
export interface ParentResponse extends Auditable {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  gender: Gender;
  relationship: string;
}

export interface ParentUpsertRequest {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  gender: Gender;
  relationship: string;
}

// ==========================================
// STUDENT
// ==========================================
export interface StudentResponse extends Auditable {
  studentCode: string;
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: Gender;
  gradeLevel: string;
  schoolName: string;
  phone: string;
  description: string;
  parent: ParentResponse | null;
  status: StudentStatus;
  latestScore: number;
  note: string;
  createdDate?: string;
  updatedDate?: string;
}

export interface StudentUpsertRequest {
  studentCode: string;
  fullName: string;
  dateOfBirth: string; // YYYY-MM-DD
  gender: Gender;
  gradeLevel: string;
  schoolName: string;
  phone: string;
  description: string;
  parentId: number | null;
  status: StudentStatus;
  latestScore: number;
  note: string;
}

export interface StudentWithParentUpsertRequest {
  // Student fields
  studentCode: string;
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  gradeLevel: string;
  schoolName: string;
  phone: string;
  description: string;
  status: StudentStatus;
  latestScore: number;
  studentNote: string;

  // Parent fields
  parentFullName: string;
  parentEmail: string;
  parentPhone: string;
  parentAddress: string;
  parentGender: Gender;
  parentRelationship: string;
}

// ==========================================
// TEACHER
// ==========================================
export interface TeacherResponse extends Auditable {
  teacherCode: string;
  fullName: string;
  phone: string;
  email: string;
  teacherRole: TeacherRole;
  status: string; // e.g., ACTIVE, RESIGNED
  isActive: boolean;
  dateOfBirth: string; // YYYY-MM-DD
  salary: number;
  weeklySlots: number;
  address: string;
  description: string;
  workUnit: string;
  experience: string;
  achievement: string;
  cccdImageUrl: string;
}

export interface TeacherUpsertRequest {
  teacherCode: string;
  fullName: string;
  phone: string;
  email: string;
  teacherRole: TeacherRole;
  status: string;
  isActive: boolean;
  dateOfBirth: string;
  salary: number;
  weeklySlots: number;
  address: string;
  description: string;
  workUnit: string;
  experience: string;
  achievement: string;
  cccdImageUrl: string;
}

// ==========================================
// COURSE (MÔN HỌC)
// ==========================================
export interface CourseResponse extends Auditable {
  courseCode: string;
  name: string;
  description: string;
  durationMonths: number;
  basePrice: number;
}

export interface CourseUpsertRequest {
  courseCode: string;
  name: string;
  description: string;
  durationMonths: number;
  basePrice: number;
}

// ==========================================
// COURSE CLASS (LỚP HỌC)
// ==========================================
export interface CourseClassResponse extends Auditable {
  classCode: string;
  name: string;
  courseId: number;
  courseName: string;
  roomId: number;
  roomName: string;
  scheduleSlotId: number;
  scheduleLabel: string;
  mainTeacherId: number;
  mainTeacherName: string;
  assistantTeacherId: number | null;
  assistantTeacherName: string | null;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  maxStudents: number;
  tuitionFee: number;
  status: ClassStatus;
}

export interface CourseClassCreateRequest {
  classCode: string;
  name: string;
  courseId: number;
  roomId: number;
  scheduleSlotId: number;
  mainTeacherId: number;
  assistantTeacherId: number | null;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  maxStudents: number;
  tuitionFee: number;
  status: ClassStatus;
}

// ==========================================
// ENROLLMENT (ĐĂNG KÝ HỌC)
// ==========================================
export interface EnrollmentResponse extends Auditable {
  studentId: number;
  studentName: string;
  courseClassId: number;
  className: string;
  enrolledAt: string; // YYYY-MM-DD
  status: EnrollmentStatus;
  note: string;
}

export interface EnrollmentCreateRequest {
  studentId: number;
  courseClassId: number;
  enrolledAt: string; // YYYY-MM-DD
  status?: EnrollmentStatus;
  note?: string;
}

export interface TransferRequest {
  studentId: number;
  fromClassId: number;
  toClassId: number;
  note?: string;
}

// ==========================================
// ATTENDANCE (ĐIỂM DANH)
// ==========================================
export interface AttendanceResponse extends Auditable {
  courseClassId: number;
  className: string;
  studentId: number;
  studentName: string;
  attendanceDate: string; // YYYY-MM-DD
  status: AttendanceStatus;
  note: string;
  recordedByUserId: number;
  recordedByUsername: string;
}

export interface AttendanceCreateRequest {
  courseClassId: number;
  studentId: number;
  attendanceDate: string;
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceBatchItem {
  studentId: number;
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceBatchRequest {
  courseClassId: number;
  attendanceDate: string; // YYYY-MM-DD
  items: AttendanceBatchItem[];
}

export interface StudentAttendanceRowDto {
  studentId: number;
  studentName: string;
  attendanceByDate: Record<string, AttendanceStatus>;
}

// ==========================================
// BILLING & INVOICES (HÓA ĐƠN & TUITION)
// ==========================================
export interface InvoiceResponse extends Auditable {
  invoiceCode: string;
  studentId: number;
  studentName: string;
  courseClassId: number;
  className: string;
  billingMonth: string; // YYYY-MM-DD
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  amountPaid: number;
  balanceAmount: number;
  status: InvoiceStatus;
  promotionId: number | null;
  promotionName: string | null;
  dueDate: string; // YYYY-MM-DD
  note: string;
}

export interface InvoiceCreateRequest {
  studentId: number;
  courseClassId: number;
  billingMonth: string; // YYYY-MM-DD
  originalAmount: number;
  discountAmount?: number;
  finalAmount?: number;
  promotionId?: number | null;
  dueDate?: string; // YYYY-MM-DD
  note?: string;
}

export interface BulkInvoiceRequest {
  studentIds: number[];
  courseClassId: number;
  billingMonth: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  promotionId?: number | null;
  note?: string;
}

export interface OverdueWarningResponse {
  invoiceId: number;
  invoiceCode: string;
  studentId: number;
  studentName: string;
  parentName: string;
  parentPhone: string;
  balanceAmount: number;
  dueDate: string;
  monthsOverdue: number;
}

// ==========================================
// PAYMENTS (THANH TOÁN HỌC PHÍ)
// ==========================================
export interface PaymentResponse extends Auditable {
  invoiceId: number;
  invoiceCode: string;
  paymentCode?: string;
  studentId?: number;
  studentName?: string;
  studentCode?: string;
  amountPaid: number;
  paidAmount?: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  paidAt?: string;
  recordedByUserId: number;
  recordedByUsername: string;
  note: string;
}

export interface PaymentCreateRequest {
  invoiceId: number;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  note?: string;
}

// ==========================================
// PROMOTIONS (KHUYẾN MÃI)
// ==========================================
export interface PromotionResponse extends Auditable {
  promoCode: string;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isActive: boolean;
  note?: string;
}

export interface PromotionUpsertRequest {
  promoCode: string;
  name: string;
  discountType: DiscountType;
  discountValue: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  isActive: boolean;
  note?: string;
}

// ==========================================
// ROOMS (PHÒNG HỌC)
// ==========================================
export interface RoomResponse extends Auditable {
  roomCode: string;
  name: string;
  capacity: number;
  description: string;
}

export interface RoomUpsertRequest {
  roomCode: string;
  name: string;
  capacity: number;
  description: string;
}

// ==========================================
// SCHEDULE SLOTS (CA HỌC)
// ==========================================
export interface ScheduleSlotResponse extends Auditable {
  slotCode: string;
  weekday: number; // e.g. 2 to 8
  startTime: string; // HH:mm:ss
  endTime: string; // HH:mm:ss
  note?: string;
}

export interface ScheduleSlotUpsertRequest {
  slotCode: string;
  weekday: number;
  startTime: string; // HH:mm:ss
  endTime: string; // HH:mm:ss
  note?: string;
}

// ==========================================
// LEARNING RESULTS (ĐIỂM SỐ & HỌC LỰC)
// ==========================================
export interface LearningResultResponse extends Auditable {
  studentId: number;
  studentName: string;
  courseClassId: number;
  className: string;
  resultMonth: string; // YYYY-MM-DD
  score: number;
  teacherComment: string;
  createdByUserId: number;
  createdByUsername: string;
}

export interface LearningResultCreateRequest {
  studentId: number;
  courseClassId: number;
  resultMonth: string; // YYYY-MM-DD
  score: number;
  teacherComment: string;
}

// ==========================================
// LEAVE REQUESTS (ĐƠN XIN NGHỈ HỌC)
// ==========================================
export interface LeaveRequestResponse extends Auditable {
  studentId: number;
  studentName: string;
  courseClassId: number;
  className: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
  status: LeaveRequestStatus;
}

export interface LeaveRequestCreateRequest {
  studentId: number;
  courseClassId: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  reason: string;
}

// ==========================================
// STATS & REPORTS
// ==========================================
export interface DashboardStatsResponse {
  totalStudents: number;
  activeStudents: number;
  pausedStudents: number;
  droppedStudents: number;
  totalTeachers: number;
  activeTeachers: number;
  totalClasses: number;
  ongoingClasses: number;
  totalRevenue: number;
  monthlyRevenue: number;
  studentsCount?: number;
  coursesCount?: number;
  classesCount?: number;
  currentMonthRevenue?: number;
  unpaidInvoicesCount?: number;
}

export interface MonthlyRevenueDto {
  year: number;
  month: number;
  totalFinalAmount: number;
  totalAmountPaid: number;
  totalBalance: number;
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
}

export interface CourseRevenueDto {
  courseClassId: number;
  className: string;
  totalFinalAmount: number;
  totalAmountPaid: number;
  totalBalance: number;
  totalInvoices: number;
}

// Map endpoints DTOs to requested names to avoid discrepancies
export type RevenueByMonthDto = MonthlyRevenueDto;
export type RevenueByClassDto = CourseRevenueDto;

// ==========================================
// PARENT PORTAL
// ==========================================
export interface StudentCard {
  id: number;
  studentCode: string;
  fullName: string;
  status: StudentStatus;
  latestScore: number;
}

export interface InvoiceCard {
  id: number;
  invoiceCode: string;
  studentName: string;
  className: string;
  billingMonth: string;
  finalAmount: number;
  amountPaid: number;
  balanceAmount: number;
  status: InvoiceStatus;
  dueDate: string;
}

export interface NotificationCard {
  id: number;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface ParentDashboardResponse {
  parentId: number;
  parentName: string;
  username: string;
  students: StudentCard[];
  invoices: InvoiceCard[];
  notifications: NotificationCard[];
}
