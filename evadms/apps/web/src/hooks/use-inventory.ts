'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '@/lib/api';

export type CylinderSize = 'kg_9' | 'kg_14' | 'kg_19' | 'kg_48';
export type CylinderStatus = 'full' | 'empty' | 'issued' | 'at_customer' | 'damaged' | 'scrapped';
export type MovementType =
  | 'received'
  | 'filled'
  | 'issued_to_delivery'
  | 'delivered'
  | 'returned_full'
  | 'returned_empty'
  | 'collected_empty'
  | 'damaged'
  | 'scrapped'
  | 'adjustment'
  | 'transfer_in'
  | 'transfer_out'
  | 'stock_count'
  | 'variance_approved'
  | 'variance_rejected'
  | 'deposit_paid'
  | 'deposit_refunded'
  | 'initial_stock';

export type RefillBatchStatus = 'created' | 'inspecting' | 'filling' | 'qc' | 'passed' | 'failed' | 'stocked';

export interface StockSummary {
  size: CylinderSize;
  full: number;
  empty: number;
  issued: number;
  atCustomer: number;
  damaged: number;
  total: number;
}

export interface CylinderMovement {
  id: string;
  cylinderSize: CylinderSize;
  movementType: MovementType;
  quantity: number;
  previousStatus?: CylinderStatus;
  newStatus?: CylinderStatus;
  orderId?: string;
  refillBatchId?: string;
  notes?: string;
  createdById: string;
  createdBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
}

export interface RefillBatch {
  id: string;
  batchNumber: string;
  cylinderSize: CylinderSize;
  status: RefillBatchStatus;
  plannedCount: number;
  inspectedCount?: number;
  passedInspectionCount?: number;
  filledCount?: number;
  qcPassedCount?: number;
  actualFilledCount?: number;
  notes?: string;
  startedAt?: string;
  completedAt?: string;
  createdById: string;
  createdBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface BulkTank {
  id: string;
  name: string;
  capacity: number;
  currentLevel: number;
  unit: string;
  lowLevelAlert: number;
  criticalLevelAlert: number;
  lastReadingAt?: string;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: string;
  updatedAt: string;
}

export interface TankReading {
  id: string;
  tankId: string;
  level: number;
  temperature?: number;
  pressure?: number;
  readingType: 'scheduled' | 'pre_transfer' | 'post_transfer' | 'spot_check';
  notes?: string;
  createdById: string;
  createdBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
}

interface InventoryApiResponse {
  bySize: Record<string, Record<string, number>>;
  totals: Record<string, number>;
}

// Queries
export function useInventorySummary() {
  return useQuery({
    queryKey: ['inventory', 'summary'],
    queryFn: async () => {
      const { data } = await inventoryApi.summary();
      const response = data as InventoryApiResponse;

      if (!response?.bySize) return [];

      // Transform API response to StockSummary format
      return Object.entries(response.bySize).map(([size, statuses]) => ({
        size: size as CylinderSize,
        full: statuses.full || 0,
        empty: statuses.empty || 0,
        issued: statuses.issued || 0,
        atCustomer: statuses.at_customer || 0,
        damaged: statuses.damaged || 0,
        total: Object.values(statuses).reduce((sum, val) => sum + (val || 0), 0),
      })) as StockSummary[];
    },
  });
}

export function useCylinderMovements(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['inventory', 'movements', params],
    queryFn: async () => {
      const { data } = await inventoryApi.movements(params);
      return data as { data: CylinderMovement[]; total: number; page: number; limit: number };
    },
  });
}

export function useRefillBatches(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['inventory', 'refill-batches', params],
    queryFn: async () => {
      const { data } = await inventoryApi.refillBatches.list(params);
      return data as { data: RefillBatch[]; total: number; page: number; limit: number };
    },
  });
}

export function useRefillBatch(id: string) {
  return useQuery({
    queryKey: ['inventory', 'refill-batches', id],
    queryFn: async () => {
      const { data } = await inventoryApi.refillBatches.get(id);
      return data as RefillBatch;
    },
    enabled: !!id,
  });
}

export function useBulkTanks() {
  return useQuery({
    queryKey: ['inventory', 'tanks'],
    queryFn: async () => {
      const { data } = await inventoryApi.tanks.list();
      return data as BulkTank[];
    },
  });
}

export function useBulkTank(id: string) {
  return useQuery({
    queryKey: ['inventory', 'tanks', id],
    queryFn: async () => {
      const { data } = await inventoryApi.tanks.get(id);
      return data as BulkTank;
    },
    enabled: !!id,
  });
}

// Mutations
export function useRecordMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: {
      cylinderSize: CylinderSize;
      movementType: MovementType;
      quantity: number;
      notes?: string;
      orderId?: string;
    }) => {
      const { data } = await inventoryApi.recordMovement(dto);
      return data as CylinderMovement;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    },
  });
}

export function useCreateRefillBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: { cylinderSize: CylinderSize; plannedCount: number; notes?: string }) => {
      const { data } = await inventoryApi.refillBatches.create(dto);
      return data as RefillBatch;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'refill-batches'] });
    },
  });
}

export function useTransitionRefillBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RefillBatchStatus }) => {
      const { data } = await inventoryApi.refillBatches.transition(id, status);
      return data as RefillBatch;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'refill-batches'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'refill-batches', id] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'summary'] });
    },
  });
}

export function useCompleteRefillBatch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, actualCount }: { id: string; actualCount: number }) => {
      const { data } = await inventoryApi.refillBatches.complete(id, actualCount);
      return data as RefillBatch;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'refill-batches'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'refill-batches', id] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'summary'] });
    },
  });
}

export function useRecordTankReading() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tankId,
      ...dto
    }: {
      tankId: string;
      level: number;
      temperature?: number;
      pressure?: number;
      readingType: 'scheduled' | 'pre_transfer' | 'post_transfer' | 'spot_check';
      notes?: string;
    }) => {
      const { data } = await inventoryApi.tanks.recordReading(tankId, dto);
      return data as TankReading;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'tanks'] });
    },
  });
}
