// ============================================
// EVADMS Utility Functions
// ============================================

import { REF_PREFIXES, VAT_RATE } from '../constants/index.js';

/**
 * Generate a reference number with prefix and year
 */
export function generateRefNumber(prefix: keyof typeof REF_PREFIXES, sequence: number): string {
  const year = new Date().getFullYear();
  const paddedSequence = sequence.toString().padStart(5, '0');
  return `${REF_PREFIXES[prefix]}-${year}-${paddedSequence}`;
}

/**
 * Calculate VAT amount
 */
export function calculateVAT(amount: number): number {
  return Math.round(amount * VAT_RATE * 100) / 100;
}

/**
 * Calculate total with VAT
 */
export function calculateTotalWithVAT(subtotal: number): { vat: number; total: number } {
  const vat = calculateVAT(subtotal);
  return {
    vat,
    total: Math.round((subtotal + vat) * 100) / 100,
  };
}

/**
 * Format currency for display (South African Rand)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
}

/**
 * Format phone number to E.164 format (South Africa)
 */
export function normalizePhone(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Handle South African numbers
  if (digits.startsWith('27')) {
    return `+${digits}`;
  }
  if (digits.startsWith('0')) {
    return `+27${digits.slice(1)}`;
  }
  if (digits.length === 9) {
    return `+27${digits}`;
  }

  return phone;
}

/**
 * Validate South African phone number
 */
export function isValidSAPhone(phone: string): boolean {
  const normalized = normalizePhone(phone);
  return /^\+27[1-9]\d{8}$/.test(normalized);
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Calculate distance between two GPS coordinates (Haversine formula)
 * Returns distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Check if a point is within radius of another point
 */
export function isWithinRadius(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  radiusKm: number
): boolean {
  return calculateDistance(lat1, lon1, lat2, lon2) <= radiusKm;
}

/**
 * Generate a secure random string
 */
export function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

/**
 * Parse delivery window string to object
 */
export function parseDeliveryWindow(window: string): { start: string; end: string } | null {
  const match = window.match(/^(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/);
  if (match) {
    return { start: match[1], end: match[2] };
  }
  return null;
}

/**
 * Format delivery window for display
 */
export function formatDeliveryWindow(window: { start: string; end: string }): string {
  return `${window.start} - ${window.end}`;
}

/**
 * Check if current time is within delivery window
 */
export function isWithinDeliveryWindow(window: { start: string; end: string }): boolean {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  return currentTime >= window.start && currentTime <= window.end;
}

/**
 * Calculate variance percentage
 */
export function calculateVariancePercent(expected: number, actual: number): number {
  if (expected === 0) return actual === 0 ? 0 : 100;
  return Math.round(((actual - expected) / expected) * 10000) / 100;
}

/**
 * Slug-ify a string for use in URLs
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if an object is empty
 */
export function isEmpty(obj: Record<string, unknown>): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Group array by key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}

/**
 * Sort array by key
 */
export function sortBy<T>(array: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Create hash for audit chain
 */
export async function createHash(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitive(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars) return '*'.repeat(data.length);
  return data.slice(0, visibleChars) + '*'.repeat(data.length - visibleChars);
}
