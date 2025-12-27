// ============================================
// EVADMS Constants
// ============================================

// Cylinder Sizes
export const CYLINDER_SIZES = ['9kg', '14kg', '19kg', '48kg'] as const;

// Cylinder Target Weights (kg)
export const CYLINDER_WEIGHTS = {
  '9kg': { tare: 8.5, fill: 9.0, total: 17.5, tolerance: 0.5 },
  '14kg': { tare: 14.0, fill: 14.0, total: 28.0, tolerance: 0.5 },
  '19kg': { tare: 18.0, fill: 19.0, total: 37.0, tolerance: 0.5 },
  '48kg': { tare: 33.0, fill: 48.0, total: 81.0, tolerance: 1.0 },
} as const;

// Cylinder Statuses
export const CYLINDER_STATUSES = [
  'full',
  'empty',
  'quarantine',
  'maintenance',
  'issued',
  'in_transit',
  'at_customer',
] as const;

// Quote Status Flow
export const QUOTE_STATUS_FLOW = {
  draft: ['sent'],
  sent: ['accepted', 'rejected', 'expired'],
  accepted: ['converted'],
  rejected: [],
  expired: [],
  converted: [],
} as const;

// Order Status Flow
export const ORDER_STATUS_FLOW = {
  created: ['scheduled', 'cancelled'],
  scheduled: ['prepared', 'cancelled'],
  prepared: ['loading', 'cancelled'],
  loading: ['dispatched', 'prepared'],
  dispatched: ['in_transit'],
  in_transit: ['arrived'],
  arrived: ['delivered', 'partial_delivery', 'failed'],
  delivered: ['closed'],
  partial_delivery: ['closed'],
  failed: ['closed'],
  cancelled: [],
  closed: [],
} as const;

// Bulk Receiving Status Flow
export const BULK_RECEIVING_STATUS_FLOW = {
  booked: ['arrived', 'cancelled'],
  arrived: ['inspecting', 'cancelled'],
  inspecting: ['transferring', 'rejected'],
  transferring: ['completed'],
  completed: ['reconciled'],
  rejected: [],
  cancelled: [],
  reconciled: [],
} as const;

// Refill Batch Status Flow
export const REFILL_BATCH_STATUS_FLOW = {
  created: ['inspecting'],
  inspecting: ['filling'],
  filling: ['qc'],
  qc: ['passed', 'failed'],
  passed: ['stocked'],
  failed: [],
  stocked: [],
} as const;

// Incident Status Flow
export const INCIDENT_STATUS_FLOW = {
  reported: ['investigating'],
  investigating: ['capa_required', 'closed', 'cancelled'],
  capa_required: ['capa_in_progress'],
  capa_in_progress: ['closed'],
  closed: [],
  cancelled: [],
} as const;

// CAPA Status Flow
export const CAPA_STATUS_FLOW = {
  open: ['planning'],
  planning: ['in_progress'],
  in_progress: ['verification'],
  verification: ['in_progress', 'closed'],
  closed: [],
  cancelled: [],
} as const;

// Default Thresholds
export const THRESHOLDS = {
  stockVarianceWarning: 1.0, // 1%
  stockVarianceCritical: 5.0, // 5%
  bulkVarianceWarning: 1.0, // 1%
  bulkVarianceCritical: 2.0, // 2%
  lowStockWarning: {
    '9kg': 20,
    '14kg': 15,
    '19kg': 15,
    '48kg': 10,
  },
  gpsAccuracyMax: 50, // meters
  quoteValidityDays: 7,
  orderAutoCancel: 30, // days
} as const;

// User Roles
export const SYSTEM_ROLES = [
  'admin',
  'owner',
  'compliance',
  'supervisor',
  'dispatcher',
  'sales',
  'operator',
  'driver',
] as const;

// Resources (for permissions)
export const RESOURCES = [
  'users',
  'customers',
  'products',
  'quotes',
  'orders',
  'schedule',
  'vehicles',
  'drivers',
  'inventory_cylinders',
  'inventory_bulk',
  'checklists',
  'pod',
  'documents',
  'incidents',
  'ncrs',
  'capas',
  'training',
  'audits',
  'assets',
  'reports',
  'audit_log',
] as const;

// Permission Actions
export const ACTIONS = ['create', 'read', 'update', 'delete', 'approve', 'export'] as const;

// Notification Templates
export const NOTIFICATION_TEMPLATES = {
  QUOTE_CREATED: 'quote_created',
  QUOTE_FOLLOWUP: 'quote_followup',
  QUOTE_EXPIRING: 'quote_expiring',
  ORDER_CONFIRMED: 'order_confirmed',
  DELIVERY_SCHEDULED: 'delivery_scheduled',
  DRIVER_ENROUTE: 'driver_enroute',
  DELIVERY_COMPLETE: 'delivery_complete',
  DELIVERY_FAILED: 'delivery_failed',
  PAYMENT_REMINDER: 'payment_reminder',
} as const;

// Provinces
export const SA_PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'Northern Cape',
  'North West',
  'Western Cape',
] as const;

// EVA Gas Service Areas
export const SERVICE_AREAS = {
  primary: ['Gauteng', 'North West'],
  cities: [
    'Johannesburg',
    'Pretoria',
    'Centurion',
    'Midrand',
    'Sandton',
    'Hartbeespoort',
    'Rustenburg',
    'Brits',
    'Mogale City',
    'Roodepoort',
  ],
} as const;

// Date/Time Formats
export const DATE_FORMATS = {
  display: 'dd MMM yyyy',
  displayWithTime: 'dd MMM yyyy HH:mm',
  iso: "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'",
  dateOnly: 'yyyy-MM-dd',
  timeOnly: 'HH:mm',
} as const;

// Reference Number Prefixes
export const REF_PREFIXES = {
  customer: 'EVA-C',
  quote: 'QUO',
  order: 'ORD',
  run: 'RUN',
  cylinderMovement: 'CYL',
  bulkMovement: 'BLK',
  refillBatch: 'REF',
  bulkReceiving: 'RCV',
  checklist: 'CHK',
  incident: 'INC',
  ncr: 'NCR',
  capa: 'CAPA',
  audit: 'AUD',
  workOrder: 'WO',
  document: 'DOC',
} as const;

// VAT Rate
export const VAT_RATE = 0.15; // 15% South Africa

// File Upload Limits
export const FILE_LIMITS = {
  maxSizeMB: 10,
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf'],
} as const;
