'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleApi, inventoryApi } from '@/lib/api';

// Schedule/Loading hooks
export function useScheduleRuns(params?: { status?: string; date?: string }) {
  return useQuery({
    queryKey: ['schedule-runs', params],
    queryFn: async () => {
      const { data } = await scheduleApi.getRuns(params);
      return data;
    },
  });
}

export function useScheduleRun(id: string) {
  return useQuery({
    queryKey: ['schedule-run', id],
    queryFn: async () => {
      const { data } = await scheduleApi.getRun(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useUpdateRunStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      scheduleApi.updateRunStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-runs'] });
    },
  });
}

export function useCompleteLoading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, loadedQuantities }: { id: string; loadedQuantities: Record<string, number> }) =>
      scheduleApi.completeLoading(id, loadedQuantities),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule-runs'] });
    },
  });
}

// Inventory hooks
export function useStockSummary() {
  return useQuery({
    queryKey: ['stock-summary'],
    queryFn: async () => {
      const { data } = await inventoryApi.getStockSummary();
      return data;
    },
  });
}

export function useLowStockAlerts() {
  return useQuery({
    queryKey: ['low-stock-alerts'],
    queryFn: async () => {
      const { data } = await inventoryApi.getLowStockAlerts();
      return data;
    },
  });
}

export function useCreateMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      cylinderSize: string;
      movementType: string;
      quantity: number;
      reason?: string;
      notes?: string;
    }) => inventoryApi.createMovement(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-summary'] });
    },
  });
}

// Refill batch hooks
export function useRefillBatches(params?: { status?: string; cylinderSize?: string }) {
  return useQuery({
    queryKey: ['refill-batches', params],
    queryFn: async () => {
      const { data } = await inventoryApi.getRefillBatches(params);
      return data;
    },
  });
}

export function useRefillBatch(id: string) {
  return useQuery({
    queryKey: ['refill-batch', id],
    queryFn: async () => {
      const { data } = await inventoryApi.getRefillBatch(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateRefillBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { cylinderSize: string; quantity: number; notes?: string }) =>
      inventoryApi.createRefillBatch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refill-batches'] });
    },
  });
}

export function useStartInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, preFillChecklistId }: { id: string; preFillChecklistId?: string }) =>
      inventoryApi.startInspection(id, preFillChecklistId),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['refill-batch', id] });
      queryClient.invalidateQueries({ queryKey: ['refill-batches'] });
    },
  });
}

export function useCompleteInspection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { passedCount: number; failedCount: number; notes?: string } }) =>
      inventoryApi.completeInspection(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['refill-batch', id] });
      queryClient.invalidateQueries({ queryKey: ['refill-batches'] });
    },
  });
}

export function useStartFilling() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fillStationId }: { id: string; fillStationId?: string }) =>
      inventoryApi.startFilling(id, fillStationId),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['refill-batch', id] });
      queryClient.invalidateQueries({ queryKey: ['refill-batches'] });
    },
  });
}

export function useCompleteFilling() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryApi.completeFilling(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['refill-batch', id] });
      queryClient.invalidateQueries({ queryKey: ['refill-batches'] });
    },
  });
}

export function useCompleteQC() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { passedCount: number; failedCount: number; qcChecklistId?: string } }) =>
      inventoryApi.completeQC(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['refill-batch', id] });
      queryClient.invalidateQueries({ queryKey: ['refill-batches'] });
    },
  });
}

export function useStockBatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => inventoryApi.stockBatch(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['refill-batch', id] });
      queryClient.invalidateQueries({ queryKey: ['refill-batches'] });
      queryClient.invalidateQueries({ queryKey: ['stock-summary'] });
    },
  });
}

// Daily count hooks
export function useDailyCounts(params?: { fromDate?: string; toDate?: string; hasVariance?: boolean }) {
  return useQuery({
    queryKey: ['daily-counts', params],
    queryFn: async () => {
      const { data } = await inventoryApi.getDailyCounts(params);
      return data;
    },
  });
}

export function useSubmitDailyCount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      countDate: string;
      items: Array<{ cylinderSize: string; status: string; physicalQuantity: number }>;
    }) => inventoryApi.submitDailyCount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-counts'] });
      queryClient.invalidateQueries({ queryKey: ['stock-summary'] });
    },
  });
}

// Tanks hooks
export function useTanks() {
  return useQuery({
    queryKey: ['tanks'],
    queryFn: async () => {
      const { data } = await inventoryApi.getTanks();
      return data;
    },
  });
}

export function useRecordTankReading() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { tankId: string; levelLitres: number; temperatureCelsius?: number; pressureKpa?: number; notes?: string }) =>
      inventoryApi.recordTankReading(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tanks'] });
    },
  });
}
