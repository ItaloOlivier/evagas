'use client';

import { useQuery } from '@tanstack/react-query';
import { ordersApi, inventoryApi } from '@/lib/api';

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

interface InventoryResponse {
  bySize: Record<string, Record<string, number>>;
  totals: Record<string, number>;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const [ordersRes, inventoryRes] = await Promise.all([
        ordersApi.list({ limit: 1000 }),
        inventoryApi.summary(),
      ]);

      const orders = (ordersRes.data as { data: any[] }).data || [];
      const inventory = inventoryRes.data as InventoryResponse;

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

      // Calculate full cylinders from bySize structure
      let fullCylinders = 0;
      const cylindersBySize: { size: string; count: number }[] = [];

      if (inventory?.bySize) {
        for (const [size, statuses] of Object.entries(inventory.bySize)) {
          const fullCount = statuses.full || 0;
          fullCylinders += fullCount;
          cylindersBySize.push({
            size: size.replace('kg', '') + 'kg',
            count: fullCount,
          });
        }
      }

      const todayRevenue = todayOrders.reduce(
        (sum, o) => sum + (Number(o.total) || 0),
        0
      );
      const yesterdayRevenue = yesterdayOrders.reduce(
        (sum, o) => sum + (Number(o.total) || 0),
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
        cylindersBySize,
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
      const orders = (data as { data: any[] }).data || [];

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
            o.completedAt &&
            new Date(o.completedAt).toDateString() === dateStr
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
      try {
        const inventoryRes = await inventoryApi.alerts();
        const alertData = inventoryRes.data as { cylinders: any[]; tanks: any[] };

        const alerts: Alert[] = [];

        // Low cylinder stock alerts
        alertData.cylinders?.forEach((item) => {
          alerts.push({
            id: `low-stock-${item.size}`,
            type: 'low_stock',
            severity: item.current < item.threshold / 2 ? 'error' : 'warning',
            title: 'Low Cylinder Stock',
            description: `${item.size} cylinders below minimum (${item.current} remaining)`,
            entityType: 'inventory',
            entityId: item.size,
            createdAt: new Date().toISOString(),
          });
        });

        // Low tank alerts
        alertData.tanks?.forEach((item) => {
          alerts.push({
            id: `low-tank-${item.code}`,
            type: 'low_stock',
            severity: item.current < item.minimum / 2 ? 'error' : 'warning',
            title: 'Low Tank Level',
            description: `Tank ${item.code} below minimum level (${item.current}L)`,
            entityType: 'tank',
            entityId: item.code,
            createdAt: new Date().toISOString(),
          });
        });

        return alerts;
      } catch {
        return [];
      }
    },
    staleTime: 60000,
  });
}

export function useRecentOrders() {
  return useQuery({
    queryKey: ['dashboard', 'recent-orders'],
    queryFn: async () => {
      const { data } = await ordersApi.list({ limit: 5 });
      const orders = (data as { data: any[] }).data || [];

      return orders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.customer?.companyName || order.customer?.primaryContactName || 'Unknown',
        status: order.status,
        total: Number(order.total) || 0,
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
      const inventory = data as InventoryResponse;

      if (!inventory?.bySize) return [];

      return Object.entries(inventory.bySize).map(([size, statuses]) => ({
        size: size.replace('kg', '') + 'kg',
        full: statuses.full || 0,
        empty: statuses.empty || 0,
        issued: statuses.issued || 0,
        atCustomer: statuses.at_customer || 0,
      })) as CylinderInventory[];
    },
    staleTime: 60000,
  });
}
