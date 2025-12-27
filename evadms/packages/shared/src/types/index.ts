// ============================================
// EVADMS Shared Types
// ============================================

// Base Types
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditableEntity extends BaseEntity {
  createdBy?: string;
  updatedBy?: string;
}

// User & Auth Types
export interface User extends AuditableEntity {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  status: UserStatus;
  emailVerified: boolean;
  lastLoginAt?: Date;
  roles: Role[];
}

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface Role {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  isSystem: boolean;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  resource: string;
  action: PermissionAction;
  description?: string;
}

export type PermissionAction = 'create' | 'read' | 'update' | 'delete' | 'approve' | 'export';

// Customer Types
export interface Customer extends AuditableEntity {
  accountNumber: string;
  companyName?: string;
  customerType: CustomerType;
  primaryContactName?: string;
  primaryPhone?: string;
  primaryEmail?: string;
  vatNumber?: string;
  registrationNumber?: string;
  pricingTierId?: string;
  discountPercentage: number;
  creditLimit: number;
  paymentTermsDays: number;
  currentBalance: number;
  commEmail: boolean;
  commSms: boolean;
  commWhatsapp: boolean;
  preferredContactMethod: ContactMethod;
  status: CustomerStatus;
  notes?: string;
  sites: CustomerSite[];
  contacts: CustomerContact[];
}

export type CustomerType = 'retail' | 'b2b' | 'wholesale';
export type CustomerStatus = 'active' | 'inactive' | 'on_hold' | 'blacklisted';
export type ContactMethod = 'phone' | 'email' | 'sms' | 'whatsapp';

export interface CustomerSite extends BaseEntity {
  customerId: string;
  siteName?: string;
  isPrimary: boolean;
  streetAddress: string;
  suburb?: string;
  city: string;
  province: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  deliveryInstructions?: string;
  accessRequirements?: string;
  preferredDeliveryWindow?: DeliveryWindow;
  siteContactName?: string;
  siteContactPhone?: string;
  status: 'active' | 'inactive';
}

export interface DeliveryWindow {
  start: string; // HH:mm
  end: string;   // HH:mm
  days?: string[]; // ['Mon', 'Tue', ...]
}

export interface CustomerContact extends BaseEntity {
  customerId: string;
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  isPrimary: boolean;
  receivesInvoices: boolean;
  receivesDeliveryUpdates: boolean;
}

// Product Types
export interface Product extends BaseEntity {
  sku: string;
  name: string;
  description?: string;
  productType: ProductType;
  cylinderSizeKg?: number;
  unitPrice: number;
  unitOfMeasure: UnitOfMeasure;
  vatApplicable: boolean;
  isActive: boolean;
}

export type ProductType = 'bulk_lpg' | 'cylinder' | 'delivery_fee' | 'service';
export type UnitOfMeasure = 'litre' | 'kg' | 'each' | 'trip';

export interface PricingTier extends BaseEntity {
  name: string;
  description?: string;
  discountPercentage: number;
  isDefault: boolean;
}

// Quote Types
export interface Quote extends AuditableEntity {
  quoteNumber: string;
  customerId?: string;
  prospectName?: string;
  prospectPhone?: string;
  prospectEmail?: string;
  siteId?: string;
  deliveryAddressText?: string;
  subtotal: number;
  vatAmount: number;
  total: number;
  status: QuoteStatus;
  issuedDate?: Date;
  validUntil?: Date;
  convertedToOrderId?: string;
  rejectionReason?: string;
  notes?: string;
  internalNotes?: string;
  items: QuoteItem[];
}

export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';

export interface QuoteItem extends BaseEntity {
  quoteId: string;
  productId: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discountPercentage: number;
  lineTotal: number;
  sortOrder: number;
}

// Order Types
export interface Order extends AuditableEntity {
  orderNumber: string;
  customerId: string;
  siteId: string;
  quoteId?: string;
  orderType: OrderType;
  requestedDate?: Date;
  requestedWindow?: DeliveryWindow;
  scheduledDate?: Date;
  scheduledRouteId?: string;
  subtotal: number;
  vatAmount: number;
  deliveryFee: number;
  total: number;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  deliveryInstructions?: string;
  specialRequirements?: string;
  completedAt?: Date;
  completedBy?: string;
  exceptionType?: string;
  exceptionNotes?: string;
  notes?: string;
  internalNotes?: string;
  items: OrderItem[];
}

export type OrderType = 'cylinder_delivery' | 'bulk_delivery' | 'cylinder_pickup' | 'wholesale_pickup';
export type PaymentMethod = 'cod' | 'eft' | 'account' | 'card';
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'overdue';
export type OrderStatus =
  | 'created'
  | 'scheduled'
  | 'prepared'
  | 'loading'
  | 'dispatched'
  | 'in_transit'
  | 'arrived'
  | 'delivered'
  | 'partial_delivery'
  | 'failed'
  | 'cancelled'
  | 'closed';

export interface OrderItem extends BaseEntity {
  orderId: string;
  productId: string;
  quantityOrdered: number;
  quantityDelivered: number;
  unitPrice: number;
  lineTotal: number;
  emptiesExpected: number;
  emptiesCollected: number;
  sortOrder: number;
}

// Scheduling Types
export interface Vehicle extends BaseEntity {
  registrationNumber: string;
  vehicleType: VehicleType;
  make?: string;
  model?: string;
  year?: number;
  bulkCapacityLitres?: number;
  cylinderCapacityUnits?: number;
  licenseExpiry?: Date;
  roadworthyExpiry?: Date;
  insuranceExpiry?: Date;
  status: VehicleStatus;
  currentOdometer?: number;
  notes?: string;
}

export type VehicleType = 'bulk_tanker' | 'cylinder_truck' | 'van' | 'bakkie';
export type VehicleStatus = 'available' | 'in_use' | 'maintenance' | 'out_of_service';

export interface Driver extends BaseEntity {
  userId: string;
  employeeNumber?: string;
  licenseNumber: string;
  licenseCode: string;
  licenseExpiry: Date;
  pdpNumber?: string;
  pdpExpiry?: Date;
  hazmatCertified: boolean;
  hazmatCertExpiry?: Date;
  status: DriverStatus;
  preferredVehicleId?: string;
}

export type DriverStatus = 'active' | 'on_leave' | 'suspended' | 'inactive';

export interface ScheduleRun extends AuditableEntity {
  runDate: Date;
  runNumber: string;
  driverId?: string;
  vehicleId?: string;
  runType: RunType;
  status: RunStatus;
  plannedStartTime?: string;
  actualStartTime?: Date;
  actualEndTime?: Date;
  totalStops: number;
  completedStops: number;
  notes?: string;
  stops: RouteStop[];
}

export type RunType = 'delivery' | 'collection' | 'mixed';
export type RunStatus = 'planned' | 'ready' | 'in_progress' | 'completed' | 'cancelled';

export interface RouteStop extends BaseEntity {
  runId: string;
  orderId: string;
  sequenceNumber: number;
  estimatedArrival?: string;
  estimatedDurationMinutes: number;
  actualArrival?: Date;
  actualDeparture?: Date;
  status: RouteStopStatus;
  distanceKm?: number;
  notes?: string;
}

export type RouteStopStatus = 'pending' | 'en_route' | 'arrived' | 'completed' | 'skipped' | 'failed';

// Inventory Types
export type CylinderSize = '9kg' | '14kg' | '19kg' | '48kg';
export type CylinderStatus = 'full' | 'empty' | 'quarantine' | 'maintenance' | 'issued' | 'in_transit' | 'at_customer';

export interface CylinderStockSummary {
  id: string;
  cylinderSize: CylinderSize;
  status: CylinderStatus;
  quantity: number;
  lastUpdated: Date;
}

export interface CylinderMovement extends BaseEntity {
  movementRef: string;
  cylinderSize: CylinderSize;
  movementType: CylinderMovementType;
  fromStatus?: CylinderStatus;
  toStatus: CylinderStatus;
  quantity: number;
  orderId?: string;
  refillBatchId?: string;
  routeStopId?: string;
  reason?: string;
  varianceApproved?: boolean;
  varianceApprovedBy?: string;
  varianceApprovedAt?: Date;
  checklistResponseId?: string;
  notes?: string;
  recordedAt: Date;
  recordedBy: string;
}

export type CylinderMovementType =
  | 'receive_empty'
  | 'refill'
  | 'issue'
  | 'deliver'
  | 'collect_empty'
  | 'return_full'
  | 'quarantine'
  | 'release_quarantine'
  | 'maintenance'
  | 'release_maintenance'
  | 'scrap'
  | 'purchase'
  | 'adjustment'
  | 'transfer_in'
  | 'transfer_out';

export interface CylinderRefillBatch extends AuditableEntity {
  batchRef: string;
  cylinderSize: CylinderSize;
  quantity: number;
  status: RefillBatchStatus;
  preFillChecklistId?: string;
  inspectedAt?: Date;
  inspectedBy?: string;
  fillStationId?: string;
  fillStartedAt?: Date;
  fillCompletedAt?: Date;
  filledBy?: string;
  qcChecklistId?: string;
  qcAt?: Date;
  qcBy?: string;
  passedCount: number;
  failedCount: number;
  stockedAt?: Date;
  stockedBy?: string;
  issueMovementId?: string;
  stockMovementId?: string;
  notes?: string;
}

export type RefillBatchStatus = 'created' | 'inspecting' | 'filling' | 'qc' | 'passed' | 'failed' | 'stocked';

// Checklist Types
export interface ChecklistTemplate extends AuditableEntity {
  code: string;
  name: string;
  description?: string;
  templateType: ChecklistType;
  isMandatory: boolean;
  blocksOnFailure: boolean;
  version: number;
  status: 'draft' | 'active' | 'archived';
  approvedBy?: string;
  approvedAt?: Date;
  items: ChecklistItem[];
}

export type ChecklistType =
  | 'bulk_receiving'
  | 'loading'
  | 'delivery'
  | 'vehicle_check'
  | 'refill_pre'
  | 'refill_qc'
  | 'safety'
  | 'audit'
  | 'custom';

export interface ChecklistItem extends BaseEntity {
  templateId: string;
  sequenceNumber: number;
  questionText: string;
  helpText?: string;
  itemType: ChecklistItemType;
  options?: string[];
  isMandatory: boolean;
  isCritical: boolean;
  conditionalOnItemId?: string;
  conditionalValue?: string;
  expectedRangeMin?: number;
  expectedRangeMax?: number;
  unitOfMeasure?: string;
}

export type ChecklistItemType =
  | 'yes_no'
  | 'yes_no_na'
  | 'text'
  | 'number'
  | 'photo'
  | 'signature'
  | 'select'
  | 'multi_select'
  | 'date'
  | 'time'
  | 'reading';

export interface ChecklistResponse extends BaseEntity {
  responseRef: string;
  templateId: string;
  templateVersion: number;
  contextType: string;
  contextId?: string;
  startedAt?: Date;
  completedAt?: Date;
  completedBy: string;
  status: ChecklistResponseStatus;
  passed?: boolean;
  failedCriticalCount: number;
  failedNonCriticalCount: number;
  gpsLatitude?: number;
  gpsLongitude?: number;
  notes?: string;
  items: ChecklistResponseItem[];
}

export type ChecklistResponseStatus = 'in_progress' | 'completed' | 'failed' | 'abandoned';

export interface ChecklistResponseItem extends BaseEntity {
  responseId: string;
  itemId: string;
  answerValue?: string;
  answerPassed?: boolean;
  numericValue?: number;
  isInRange?: boolean;
  attachmentId?: string;
  issueNotes?: string;
  answeredAt: Date;
  answeredBy: string;
}

// POD Types
export interface PODData extends BaseEntity {
  orderId: string;
  routeStopId?: string;
  arrivalTime?: Date;
  completionTime: Date;
  gpsLatitude?: number;
  gpsLongitude?: number;
  gpsAccuracyMeters?: number;
  signatureCaptured: boolean;
  signatoryName?: string;
  signatoryDesignation?: string;
  signatureAttachmentId?: string;
  outcome: PODOutcome;
  outcomeNotes?: string;
  receivedByName?: string;
  receivedByPhone?: string;
  driverNotes?: string;
  deviceId?: string;
  appVersion?: string;
  capturedBy: string;
  photos: PODPhoto[];
}

export type PODOutcome = 'delivered' | 'partial' | 'refused' | 'no_access' | 'not_home' | 'other';

export interface PODPhoto extends BaseEntity {
  podId: string;
  photoType: PODPhotoType;
  attachmentId: string;
  caption?: string;
  sequenceNumber: number;
}

export type PODPhotoType = 'delivery_location' | 'product_placement' | 'damage' | 'signature' | 'other';

// Audit Types
export interface AuditEvent {
  id: string;
  eventType: string;
  eventSubtype?: string;
  action: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  entityType: string;
  entityId?: string;
  entityRef?: string;
  summary: string;
  details?: Record<string, unknown>;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  deviceId?: string;
  sessionId?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
  sequenceNumber: number;
  previousHash?: string;
  recordHash?: string;
  occurredAt: Date;
}

// Notification Types
export interface NotificationLog extends BaseEntity {
  recipientType: 'user' | 'customer' | 'external';
  recipientId?: string;
  recipientContact: string;
  channel: NotificationChannel;
  templateCode?: string;
  subject?: string;
  body: string;
  contextType?: string;
  contextId?: string;
  status: NotificationStatus;
  sentAt?: Date;
  deliveredAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  externalMessageId?: string;
}

export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'push' | 'in_app';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedRequest {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}
