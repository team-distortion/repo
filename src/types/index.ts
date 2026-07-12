/**
 * Global type definitions for AssetFlow API
 * Based on API Specification v2.1
 */

// ==================== User & Authentication ====================

export type UserRole = 'Admin' | 'AssetManager' | 'DepartmentHead' | 'Employee';

export interface User {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId: string | null;
  status: 'Active' | 'Inactive' | 'Suspended';
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  departmentId: string | null;
  iat: number;
  exp: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceId?: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  departmentId?: string;
}

// ==================== Organization & Master Data ====================

export interface Department {
  departmentId: string;
  name: string;
  headId: string | null;
  parentDepartmentId: string | null;
  status: 'Active' | 'Inactive';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface AssetCategory {
  categoryId: string;
  name: string;
  description?: string;
  customFields: CustomField[];
  status: 'Active' | 'Inactive';
  assetCount?: number;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface CustomField {
  fieldName: string;
  fieldType: 'string' | 'integer' | 'date' | 'boolean';
  label: string;
  required: boolean;
  defaultValue?: any;
}

// ==================== Asset Management ====================

export type AssetStatus =
  | 'Available'
  | 'Allocated'
  | 'Reserved'
  | 'Under Maintenance'
  | 'Lost'
  | 'Retired'
  | 'Disposed';

export type AssetCondition = 'New' | 'Good' | 'Fair' | 'Poor' | 'Damaged';

export interface Asset {
  assetId: string;
  assetTag: string; // AF-XXXX format, auto-generated
  name: string;
  categoryId: string;
  serialNumber: string;
  acquisitionDate: Date;
  acquisitionCost: number;
  condition: AssetCondition;
  location: string;
  status: AssetStatus;
  isShared: boolean;
  photoIds?: string[];
  documentIds?: string[];
  customFields?: Record<string, any>;
  description?: string;
  qrCodeValue?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface Allocation {
  allocationId: string;
  assetId: string;
  allocatedToType: 'Employee' | 'Department';
  allocatedToId: string;
  departmentId: string;
  allocatedDate: Date;
  expectedReturnDate?: Date;
  returnedDate?: Date;
  isPausedForMaintenance: boolean;
  returnStatus?: 'PendingApproval' | 'Approved' | 'Rejected';
  returnRequestedAt?: Date;
  conditionCheckInNotes?: string;
  approvedReturnBy?: string;
  status: 'Active' | 'Completed' | 'Transferred' | 'Paused';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Transfer {
  transferId: string;
  assetId: string;
  requestedByType: 'Employee' | 'Department' | 'Admin';
  requestedById: string;
  requestedToType: 'Employee' | 'Department';
  requestedToId: string;
  currentlyHeldBy: string;
  reason?: string;
  status: 'Requested' | 'Approved' | 'Rejected' | 'Cancelled' | 'Re-allocated';
  requestedDate: Date;
  approvalDate?: Date;
  approvedBy?: string;
  notes?: string;
  newAllocationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Resource Bookings ====================

export type BookingStatus = 'Upcoming' | 'Ongoing' | 'Completed' | 'Cancelled';

export interface Booking {
  bookingId: string;
  assetId: string;
  bookedByType: 'Self' | 'Department';
  bookedById: string;
  bookedForType: 'Self' | 'Department';
  bookedForId: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  status: BookingStatus;
  purpose?: string;
  attendeeCount?: number;
  notificationBefore?: number; // minutes
  bookedDate: Date;
  cancelledDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Maintenance ====================

export type MaintenancePriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type MaintenanceStatus =
  | 'Pending'
  | 'Approved'
  | 'Rejected'
  | 'TechnicianAssigned'
  | 'InProgress'
  | 'Resolved'
  | 'Cancelled';

export interface MaintenanceRequest {
  maintenanceId: string;
  assetId: string;
  reportedById: string;
  issueDescription: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  estimatedCost?: number;
  actualCost?: number;
  photoIds?: string[];
  desiredResolutionDate?: Date;
  requestedDate: Date;
  approvedDate?: Date;
  approvedBy?: string;
  assignedTechnicianId?: string;
  workStartedDate?: Date;
  resolvedDate?: Date;
  resolutionNotes?: string;
  assetStatusWhenRequested: AssetStatus;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== Audits ====================

export type AuditStatus = 'Open' | 'Closed';

export type AuditItemStatus = 'Pending' | 'Verified' | 'Missing' | 'Damaged';

export interface AuditCycle {
  auditId: string;
  title: string;
  scopeType: 'Department' | 'Location';
  scopeId: string;
  status: AuditStatus;
  dateRangeStart: Date;
  dateRangeEnd: Date;
  auditorIds: string[];
  createdBy: string;
  createdDate: Date;
  closedDate?: Date;
  description?: string;
  assetScope: {
    totalAssets: number;
    verifiedCount: number;
    missingCount: number;
    damagedCount: number;
  };
}

export interface AuditItem {
  itemId: string;
  auditId: string;
  assetId: string;
  assetTag: string;
  assetName: string;
  status: AuditItemStatus;
  verifiedBy?: string;
  verifiedDate?: Date;
  verificationNotes?: string;
  conditionConfirmed?: AssetCondition;
}

export interface AuditDiscrepancyReport {
  reportId: string;
  auditId: string;
  generatedDate: Date;
  summary: {
    totalAssets: number;
    verifiedCount: number;
    missingCount: number;
    damagedCount: number;
    discrepancyCount: number;
  };
  discrepancies: Discrepancy[];
}

export interface Discrepancy {
  discrepancyId: string;
  assetTag: string;
  assetName: string;
  discrepancyType: 'Missing' | 'Damaged';
  lastAllocatedTo?: string;
  lastAllocatedDepartment?: string;
  auditFinding: string;
  maintenanceRequestCreated?: string;
  suggestedAction: string;
}

// ==================== Notifications ====================

export type NotificationType =
  | 'AssetAssigned'
  | 'AssetReturned'
  | 'MaintenanceApproved'
  | 'MaintenanceRejected'
  | 'BookingConfirmed'
  | 'BookingCancelled'
  | 'BookingReminder'
  | 'TransferApproved'
  | 'TransferRejected'
  | 'OverdueReturnAlert'
  | 'AuditDiscrepancyFlagged'
  | 'Announcement';

export interface Notification {
  notificationId: string;
  userId: string;
  type: NotificationType;
  message: string;
  details?: Record<string, any>;
  relatedEntityId?: string;
  relatedEntityType?: string;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
}

export interface SSEEvent {
  type: string; // e.g., 'asset.assigned', 'maintenance.approved'
  data: Record<string, any>;
  timestamp: Date;
}

// ==================== Activity Logging ====================

export type ActivityAction =
  | 'AssetCreated'
  | 'AssetUpdated'
  | 'AssetDisposed'
  | 'AllocationCreated'
  | 'AllocationReturned'
  | 'AllocationTransferred'
  | 'TransferCreated'
  | 'TransferApproved'
  | 'TransferRejected'
  | 'MaintenanceCreated'
  | 'MaintenanceApproved'
  | 'MaintenanceInProgress'
  | 'MaintenanceResolved'
  | 'BookingCreated'
  | 'BookingCancelled'
  | 'BookingRescheduled'
  | 'AuditCreated'
  | 'AuditClosed'
  | 'UserCreated'
  | 'RoleChanged'
  | 'UserStatusChanged'
  | 'DepartmentCreated'
  | 'DepartmentUpdated'
  | 'CategoryCreated'
  | 'CategoryUpdated';

export interface ActivityLog {
  logId: string;
  actor: {
    userId: string;
    name: string;
    role: UserRole;
  };
  action: ActivityAction;
  entityType: string;
  entityId: string;
  changes: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

// ==================== API Response Types ====================

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  pagination?: PaginationMeta;
}

export interface ErrorDetail {
  field?: string;
  value?: any;
  constraint?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ErrorDetail;
}

export interface ErrorResponse {
  error: ApiError;
}

export interface ListQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ==================== Dashboard & Reports ====================

export interface DashboardSummary {
  assetsAvailable: number;
  assetsAllocated: number;
  assetsUnderMaintenance: number;
  maintenanceToday: number;
  activeBookings: number;
  pendingTransfers: number;
  upcomingReturns: AssetReturn[];
  overdueReturns: AssetReturn[];
}

export interface AssetReturn {
  assetId: string;
  assetTag: string;
  holderName: string;
  expectedReturnDate: Date;
  overdueBy?: number; // days
}

export interface UtilizationReport {
  summary: {
    totalAssets: number;
    allocatedCount: number;
    utilizationRate: number;
    avgHoldingPeriod: number;
  };
  byCategory: CategoryUtilization[];
  topUtilized: AssetUtilization[];
}

export interface CategoryUtilization {
  category: string;
  count: number;
  allocated: number;
  utilizationRate: number;
}

export interface AssetUtilization {
  assetTag: string;
  name: string;
  holdingDays: number;
}

export interface MaintenanceFrequencyReport {
  byCategory: CategoryMaintenance[];
  byAsset: AssetMaintenance[];
}

export interface CategoryMaintenance {
  category: string;
  count: number;
  frequency: number;
  commonIssues: string[];
}

export interface AssetMaintenance {
  assetTag: string;
  count: number;
  lastDate: Date;
  avgResolutionTime: number;
}
