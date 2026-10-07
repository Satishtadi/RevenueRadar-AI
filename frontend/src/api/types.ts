export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: boolean;
  errorCode: string;
  message: string;
  errors?: { field: string; message: string }[];
  timestamp: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type Role = "SUPER_ADMIN" | "OWNER" | "MANAGER" | "EMPLOYEE";

export interface User {
  id: string;
  fullName: string;
  email: string;
  roles: Role[];
  organizationId: string | null;
}

export interface Organization {
  id: string;
  name: string;
  businessType: string;
  currency: string;
  timezone: string;
  onboarded: boolean;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
  organization: Organization | null;
}

export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "INTERESTED"
  | "APPOINTMENT_BOOKED"
  | "APPOINTMENT_COMPLETED"
  | "NEGOTIATION"
  | "CONVERTED"
  | "LOST"
  | "RECOVERY";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Customer {
  id: string;
  organizationId: string;
  name: string;
  phone?: string;
  email?: string;
  location?: string;
  source?: string;
  tags: string[];
  totalRevenue: number;
  lastInteractionAt?: string;
  aiSummary?: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  organizationId: string;
  customerId: string;
  customerName: string;
  source?: string;
  service?: string;
  status: LeadStatus;
  priority: Priority;
  estimatedValue?: number;
  actualValue?: number;
  assignedUserId?: string;
  assignedUserName?: string;
  lastContactAt?: string;
  nextFollowUpAt?: string;
  lostReasonCode?: string;
  notes?: string;
  recoveryScore?: RecoveryScore;
  createdAt: string;
  updatedAt: string;
}

export interface RecoveryScore {
  score: number;
  intentScore: number;
  engagementScore: number;
  valueScore: number;
  recencyScore: number;
  followupRiskScore: number;
  appointmentSignalScore: number;
  factors: string[];
  computedAt: string;
}

export type RadarCategory =
  | "HIGH_PRIORITY"
  | "FOLLOWUP_OVERDUE"
  | "SILENT_CUSTOMER"
  | "MISSED_APPOINTMENT"
  | "HIGH_VALUE_CUSTOMER"
  | "LOST_CUSTOMER"
  | "RECOVERY_OPPORTUNITY";

export interface RecoveryAction {
  id: string;
  leadId: string;
  customerId: string;
  customerName: string;
  category: RadarCategory;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "EXPIRED";
  potentialValue: number;
  recoveryScore: number;
  reason: string;
  recommendedAction: string;
  openedAt: string;
}

export type FollowUpStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "SKIPPED"
  | "OVERDUE"
  | "CANCELLED";

export interface FollowUp {
  id: string;
  leadId: string;
  customerId: string;
  customerName: string;
  assignedUserId?: string;
  assignedUserName?: string;
  dueAt: string;
  priority: Priority;
  status: FollowUpStatus;
  reason?: string;
  completedAt?: string;
}

export interface Appointment {
  id: string;
  customerId: string;
  customerName: string;
  leadId?: string;
  service?: string;
  scheduledAt: string;
  status: "SCHEDULED" | "CONFIRMED" | "COMPLETED" | "MISSED" | "CANCELLED";
}

export interface ActionPlanItem {
  id: string;
  leadId: string;
  customerName: string;
  type: RadarCategory;
  recoveryScore: number;
  potentialValue: number;
  reason: string;
}

export interface RevenueSummary {
  atRisk: number;
  potential: number;
  recovered: number;
  roiMultiple: number;
  currency: string;
  recoveredVerified: boolean;
}

export interface RadarSummary {
  categories: { category: RadarCategory; count: number; potentialValue: number }[];
}

export interface DashboardPulse {
  highPriority: number;
  dueToday: number;
  overdue: number;
  silentCustomers: number;
  missedAppointments: number;
}

export interface GeneratedMessage {
  id: string;
  leadId: string;
  channel: "WHATSAPP" | "EMAIL" | "SMS";
  language: "EN" | "TE";
  content: string;
  status: "DRAFT" | "APPROVED" | "REJECTED" | "SENT";
}

export interface LostReason {
  code: string;
  label: string;
  isCustom: boolean;
}

export interface ImportJob {
  id: string;
  filename: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";
  totalRows: number;
  importedCount: number;
  duplicateCount: number;
  errorCount: number;
}

export interface LeadReportRow {
  label: string;
  value: number;
  amount?: number;
}

export interface TeamMember {
  userId: string;
  name: string;
  assignedLeads: number;
  contacted: number;
  followUps: number;
  conversions: number;
  lost: number;
  recoveryActions: number;
  revenue: number;
}
