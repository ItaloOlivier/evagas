'use client';

import { useQuery } from '@tanstack/react-query';
import { ordersApi, inventoryApi, reportsApi } from '@/lib/api';

export interface DashboardStats {
  todayOrders: number;
  ordersChange: number;
  todayDeliveries: number;
  deliveriesInProgress: number;
  deliveriesCompleted: number;
  fullCylinders: number;
  cylindersBySize: { size: string; count: number }[];
  todayRevenue: number;
  revenueChange: number;
}

export interface WeeklyOverview {
  date: string;
  orders: number;
  deliveries: number;
}

export interface Alert {
  id: string;
  type: 'low_stock' | 'pending_batch' | 'compliance' | 'payment_overdue' | 'license_expiry';
  severity: 'warning' | 'error' | 'info';
  title: string;
  description: string;
  entityId?: string;
  entityType?: string;
  createdAt: string;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customer: string;
  status: string;
  total: number;
  createdAt: string;
}

export interface CylinderInventory {
  size: string;
  full: number;
  empty: number;
  issued: number;
  atCustomer: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const [ordersRes, inventoryRes] = await Promise.all([
        ordersApi.list({ limit: 1000 }),
        inventoryApi.summary(),
      ]);

      const orders = (ordersRes.data as { data: any[] }).data;
      const inventory = inventoryRes.data as any[];

      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      const todayOrders = orders.filter(
        (o) => new Date(o.createdAt).toDateString() === today
      );
      const yesterdayOrders = orders.filter(
        (o) => new Date(o.createdAt).toDateString() === yesterday
      );

      const todayDeliveries = todayOrders.filter((o) =>
        ['delivered', 'partial_delivery'].includes(o.status)
      ).length;
      const deliveriesInProgress = orders.filter((o) =>
        ['dispatched', 'in_transit', 'arrived'].includes(o.status)
      ).length;

      const fullCylinders = inventory.reduce(
        (sum, item) => sum + (item.full || 0),
        0
      );

      const todayRevenue = todayOrders.reduce(
        (sum, o) => sum + (o.totalAmount || 0),
        0
      );
      const yesterdayRevenue = yesterdayOrders.reduce(
        (sum, o) => sum + (o.totalAmount || 0),
        0
      );

      return {
        todayOrders: todayOrders.length,
        ordersChange: yesterdayOrders.length
          ? Math.round(
              ((todayOrders.length - yesterdayOrders.length) /
                yesterdayOrders.length) *
                100
            )
          : 0,
        todayDeliveries,
        deliveriesInProgress,
        deliveriesCompleted: todayDeliveries,
        fullCylinders,
        cylindersBySize: inventory.map((item) => ({
          size: item.size,
          count: item.full || 0,
        })),
        todayRevenue,
        revenueChange: yesterdayRevenue
          ? Math.round(
              ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
            )
          : 0,
      } as DashboardStats;
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
}

export function useWeeklyOverview() {
  return useQuery({
    queryKey: ['dashboard', 'weekly'],
    queryFn: async () => {
      const { data } = await ordersApi.list({ limit: 1000 });
      const orders = (data as { data: any[] }).data;

      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + 1);

      return days.map((day, index) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + index);
        const dateStr = date.toDateString();

        const dayOrders = orders.filter(
          (o) => new Date(o.createdAt).toDateString() === dateStr
        );
        const dayDeliveries = orders.filter(
          (o) =>
            o.deliveredAt &&
            new Date(o.deliveredAt).toDateString() === dateStr
        );

        return {
          date: day,
          orders: dayOrders.length,
          deliveries: dayDeliveries.length,
        };
      }) as WeeklyOverview[];
    },
    staleTime: 60000, // 1 minute
  });
}

export function useAlerts() {
  return useQuery({
    queryKey: ['dashboard', 'alerts'],
    queryFn: async () => {
      const inventoryRes = await inventoryApi.summary();
      const inventory = inventoryRes.data as any[];

      const alerts: Alert[] = [];

      // Low stock alerts
      const minStock: Record<string, number> = {
        kg_9: 200,
        kg_14: 150,
        kg_19: 100,
        kg_48: 50,
      };

      inventory.forEach((item) => {
        const min = minStock[item.size] || 100;
        if (item.full < min) {
          alerts.push({
            id: `low-stock-${item.size}`,
            type: 'low_stock',
            severity: item.full < min / 2 ? 'error' : 'warning',
            title: 'Low Stock Alert',
            description: `${item.size.replace('kg_', '')}kg cylinders below minimum (${item.full} remaining)`,
            entityType: 'inventory',
            entityId: item.size,
            createdAt: new Date().toISOString(),
          });
        }
      });

      return alerts;
    },
    staleTime: 60000,
  });
}

export function useRecentOrders() {
  return useQuery({
    queryKey: ['dashboard', 'recent-orders'],
    queryFn: async () => {
      const { data } = await ordersApi.list({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' });
      const orders = (data as { data: any[] }).data;

      return orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.customer?.name || 'Unknown',
        status: order.status,
        total: order.totalAmount,
        createdAt: order.createdAt,
      })) as RecentOrder[];
    },
    staleTime: 30000,
  });
}

export function useCylinderInventory() {
  return useQuery({
    queryKey: ['dashboard', 'cylinder-inventory'],
    queryFn: async () => {
      const { data } = await inventoryApi.summary();
      const inventory = data as any[];

      return inventory.map((item) => ({
        size: item.size.replace('kg_', '') + 'kg',
        full: item.full || 0,
        empty: item.empty || 0,
        issued: item.issued || 0,
        atCustomer: item.atCustomer || 0,
      })) as CylinderInventory[];
    },
    staleTime: 60000,
  });
}
