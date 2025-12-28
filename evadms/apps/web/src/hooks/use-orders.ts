'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api';

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
  | 'closed'
  | 'cancelled';

export interface OrderItem {
  id: string;
  productId: string;
  product: { id: string; name: string; sku: string; cylinderSize?: number };
  quantity: number;
  deliveredQuantity?: number;
  returnedQuantity?: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customer: { id: string; name: string };
  siteId: string;
  site: { id: string; name: string; address: string };
  status: OrderStatus;
  paymentStatus: 'pending' | 'paid' | 'partial' | 'overdue';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  subtotal: number;
  deliveryFee: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  items: OrderItem[];
  scheduleRunId?: string;
  scheduleRun?: { id: string; runNumber: string };
  driverId?: string;
  driver?: { id: string; firstName: string; lastName: string };
  vehicleId?: string;
  vehicle?: { id: string; registrationNumber: string };
  requestedDate?: string;
  scheduledDate?: string;
  deliveredAt?: string;
  quoteId?: string;
  createdById: string;
  createdBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderDto {
  customerId: string;
  siteId: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  requestedDate?: string;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice?: number;
    notes?: string;
  }[];
}

export interface UpdateOrderDto extends Partial<Omit<CreateOrderDto, 'customerId'>> {}

// Queries
export function useOrders(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: async () => {
      const { data } = await ordersApi.list(params);
      return data as { data: Order[]; total: number; page: number; limit: number };
    },
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: async () => {
      const { data } = await ordersApi.get(id);
      return data as Order;
    },
    enabled: !!id,
  });
}

export function useOrderStats() {
  return useQuery({
    queryKey: ['orders', 'stats'],
    queryFn: async () => {
      const { data } = await ordersApi.list({ limit: 1000 });
      const orders = (data as { data: Order[] }).data;
      const today = new Date().toDateString();
      const todayOrders = orders.filter(
        (o) => new Date(o.createdAt).toDateString() === today
      );

      return {
        total: orders.length,
        active: orders.filter((o) =>
          ['created', 'scheduled', 'prepared', 'loading', 'dispatched', 'in_transit', 'arrived'].includes(o.status)
        ).length,
        inTransit: orders.filter((o) => o.status === 'in_transit').length,
        delivered: orders.filter((o) => o.status === 'delivered').length,
        pending: orders.filter((o) => ['created', 'scheduled'].includes(o.status)).length,
        todayOrders: todayOrders.length,
        todayDeliveries: todayOrders.filter((o) => o.status === 'delivered').length,
      };
    },
  });
}

// Mutations
export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateOrderDto) => {
      const { data } = await ordersApi.create(dto);
      return data as Order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...dto }: UpdateOrderDto & { id: string }) => {
      const { data } = await ordersApi.update(id, dto);
      return data as Order;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', variables.id] });
    },
  });
}

export function useTransitionOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { data } = await ordersApi.transition(id, status);
      return data as Order;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
    },
  });
}
