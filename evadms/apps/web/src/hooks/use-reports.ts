'use client';

import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';

export interface SalesReport {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    revenueChange: number;
    ordersChange: number;
  };
  byCustomerType: {
    type: string;
    revenue: number;
    orders: number;
    percentage: number;
  }[];
  byProduct: {
    productId: string;
    productName: string;
    quantity: number;
    revenue: number;
    percentage: number;
  }[];
  dailyRevenue: {
    date: string;
    revenue: number;
    orders: number;
  }[];
}

export interface DeliveryReport {
  summary: {
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    onTimeDeliveries: number;
    successRate: number;
    onTimeRate: number;
  };
  byDriver: {
    driverId: string;
    driverName: string;
    deliveries: number;
    successful: number;
    failed: number;
    onTime: number;
    successRate: number;
  }[];
  byVehicle: {
    vehicleId: string;
    registrationNumber: string;
    deliveries: number;
    distance: number;
  }[];
  dailyDeliveries: {
    date: string;
    deliveries: number;
    successful: number;
    failed: number;
  }[];
}

export interface InventoryReport {
  cylinderStock: {
    size: string;
    full: number;
    empty: number;
    issued: number;
    atCustomer: number;
    damaged: number;
    total: number;
  }[];
  bulkTanks: {
    tankId: string;
    name: string;
    capacity: number;
    currentLevel: number;
    percentage: number;
    status: string;
  }[];
  recentMovements: {
    id: string;
    cylinderSize: string;
    movementType: string;
    quantity: number;
    createdAt: string;
  }[];
  lowStockAlerts: {
    size: string;
    current: number;
    minimum: number;
    shortage: number;
  }[];
}

export interface CustomerReport {
  summary: {
    totalCustomers: number;
    activeCustomers: number;
    newCustomers: number;
    churnedCustomers: number;
  };
  topCustomers: {
    customerId: string;
    customerName: string;
    type: string;
    orders: number;
    revenue: number;
  }[];
  byType: {
    type: string;
    count: number;
    revenue: number;
    percentage: number;
  }[];
  retention: {
    period: string;
    retained: number;
    total: number;
    rate: number;
  }[];
}

export interface ComplianceReport {
  summary: {
    totalChecklists: number;
    completedChecklists: number;
    passedChecklists: number;
    failedChecklists: number;
    blockedItems: number;
    passRate: number;
  };
  byType: {
    type: string;
    total: number;
    passed: number;
    failed: number;
    passRate: number;
  }[];
  criticalFailures: {
    id: string;
    checklistName: string;
    item: string;
    respondent: string;
    entity: string;
    failedAt: string;
  }[];
  upcomingExpiries: {
    type: string;
    entity: string;
    expiryDate: string;
    daysRemaining: number;
  }[];
}

// Queries
export function useSalesReport(params: { startDate: string; endDate: string }) {
  return useQuery({
    queryKey: ['reports', 'sales', params],
    queryFn: async () => {
      const { data } = await reportsApi.sales(params);
      return data as SalesReport;
    },
    enabled: !!params.startDate && !!params.endDate,
  });
}

export function useDeliveryReport(params: { startDate: string; endDate: string }) {
  return useQuery({
    queryKey: ['reports', 'delivery', params],
    queryFn: async () => {
      const { data } = await reportsApi.delivery(params);
      return data as DeliveryReport;
    },
    enabled: !!params.startDate && !!params.endDate,
  });
}

export function useInventoryReport() {
  return useQuery({
    queryKey: ['reports', 'inventory'],
    queryFn: async () => {
      const { data } = await reportsApi.inventory();
      return data as InventoryReport;
    },
  });
}

export function useCustomerReport(params: { startDate: string; endDate: string }) {
  return useQuery({
    queryKey: ['reports', 'customer', params],
    queryFn: async () => {
      const { data } = await reportsApi.customer(params);
      return data as CustomerReport;
    },
    enabled: !!params.startDate && !!params.endDate,
  });
}

export function useComplianceReport(params?: { startDate: string; endDate: string }) {
  // Default to last 30 days if no params provided
  const defaultParams = {
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  };
  const effectiveParams = params || defaultParams;

  return useQuery({
    queryKey: ['reports', 'compliance', effectiveParams],
    queryFn: async () => {
      const { data } = await reportsApi.compliance(effectiveParams);
      return data as ComplianceReport;
    },
  });
}
