'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scheduleApi } from '@/lib/api';

export type VehicleType = 'bulk_tanker' | 'cylinder_truck' | 'van' | 'bakkie';
export type VehicleStatus = 'available' | 'in_use' | 'maintenance' | 'out_of_service';
export type RunStatus = 'planned' | 'ready' | 'in_progress' | 'completed' | 'cancelled';
export type StopStatus = 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';

export interface Vehicle {
  id: string;
  registrationNumber: string;
  vehicleType: VehicleType;
  make?: string;
  model?: string;
  year?: number;
  cylinderCapacityUnits?: number;
  bulkCapacityLitres?: number;
  status: VehicleStatus;
  licenseExpiry?: string;
  roadworthyExpiry?: string;
  insuranceExpiry?: string;
  currentOdometer?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  id: string;
  userId: string;
  user: { id: string; firstName: string; lastName: string; email: string; phone?: string };
  licenseNumber: string;
  licenseExpiry: string;
  pdpNumber?: string;
  pdpExpiry?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleStop {
  id: string;
  runId: string;
  orderId: string;
  order: {
    id: string;
    orderNumber: string;
    customer: { id: string; name: string };
    site: { id: string; name: string; address: string };
  };
  sequence: number;
  status: StopStatus;
  estimatedArrival?: string;
  actualArrival?: string;
  completedAt?: string;
  notes?: string;
}

export interface ScheduleRun {
  id: string;
  runNumber: string;
  vehicleId: string;
  vehicle: Vehicle;
  driverId: string;
  driver: Driver;
  status: RunStatus;
  scheduledDate: string;
  startedAt?: string;
  completedAt?: string;
  notes?: string;
  stops: ScheduleStop[];
  createdById: string;
  createdBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

// Queries
export function useScheduleRuns(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['schedule', 'runs', params],
    queryFn: async () => {
      const { data } = await scheduleApi.runs.list(params);
      return data as { data: ScheduleRun[]; total: number; page: number; limit: number };
    },
  });
}

export function useScheduleRun(id: string) {
  return useQuery({
    queryKey: ['schedule', 'runs', id],
    queryFn: async () => {
      const { data } = await scheduleApi.runs.get(id);
      return data as ScheduleRun;
    },
    enabled: !!id,
  });
}

export function useVehicles() {
  return useQuery({
    queryKey: ['schedule', 'vehicles'],
    queryFn: async () => {
      const { data } = await scheduleApi.vehicles.list();
      return data as Vehicle[];
    },
  });
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: ['schedule', 'vehicles', id],
    queryFn: async () => {
      const { data } = await scheduleApi.vehicles.get(id);
      return data as Vehicle;
    },
    enabled: !!id,
  });
}

export function useDrivers() {
  return useQuery({
    queryKey: ['schedule', 'drivers'],
    queryFn: async () => {
      const { data } = await scheduleApi.drivers.list();
      return data as Driver[];
    },
  });
}

export function useDriver(id: string) {
  return useQuery({
    queryKey: ['schedule', 'drivers', id],
    queryFn: async () => {
      const { data } = await scheduleApi.drivers.get(id);
      return data as Driver;
    },
    enabled: !!id,
  });
}

export function useScheduleStats() {
  return useQuery({
    queryKey: ['schedule', 'stats'],
    queryFn: async () => {
      const [runsRes, vehiclesRes, driversRes] = await Promise.all([
        scheduleApi.runs.list({ limit: 100 }),
        scheduleApi.vehicles.list(),
        scheduleApi.drivers.list(),
      ]);

      const runs = (runsRes.data as { data: ScheduleRun[] }).data;
      const vehicles = vehiclesRes.data as Vehicle[];
      const drivers = driversRes.data as Driver[];

      const today = new Date().toDateString();
      const todayRuns = runs.filter(
        (r) => new Date(r.scheduledDate).toDateString() === today
      );

      return {
        totalRuns: runs.length,
        todayRuns: todayRuns.length,
        inProgressRuns: runs.filter((r) => r.status === 'in_progress').length,
        completedToday: todayRuns.filter((r) => r.status === 'completed').length,
        availableVehicles: vehicles.filter((v) => v.status === 'available').length,
        totalVehicles: vehicles.length,
        activeDrivers: drivers.filter((d) => d.status === 'active').length,
        totalDrivers: drivers.length,
      };
    },
  });
}

// Mutations
export function useCreateScheduleRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: {
      vehicleId: string;
      driverId: string;
      scheduledDate: string;
      notes?: string;
      orderIds: string[];
    }) => {
      const { data } = await scheduleApi.runs.create(dto);
      return data as ScheduleRun;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useUpdateScheduleRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...dto }: { id: string; notes?: string }) => {
      const { data } = await scheduleApi.runs.update(id, dto);
      return data as ScheduleRun;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['schedule', 'runs'] });
      queryClient.invalidateQueries({ queryKey: ['schedule', 'runs', id] });
    },
  });
}

export function useTransitionScheduleRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RunStatus }) => {
      const { data } = await scheduleApi.runs.transition(id, status);
      return data as ScheduleRun;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['schedule', 'runs'] });
      queryClient.invalidateQueries({ queryKey: ['schedule', 'runs', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: {
      registrationNumber: string;
      vehicleType: VehicleType;
      make?: string;
      model?: string;
      year?: number;
      cylinderCapacityUnits?: number;
      bulkCapacityLitres?: number;
    }) => {
      const { data } = await scheduleApi.vehicles.create(dto);
      return data as Vehicle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', 'vehicles'] });
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...dto }: { id: string; status?: VehicleStatus; [key: string]: unknown }) => {
      const { data } = await scheduleApi.vehicles.update(id, dto);
      return data as Vehicle;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['schedule', 'vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['schedule', 'vehicles', id] });
    },
  });
}

export function useCreateDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: {
      userId: string;
      licenseNumber: string;
      licenseExpiry: string;
      pdpNumber?: string;
      pdpExpiry?: string;
    }) => {
      const { data } = await scheduleApi.drivers.create(dto);
      return data as Driver;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule', 'drivers'] });
    },
  });
}

export function useUpdateDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...dto }: { id: string; [key: string]: unknown }) => {
      const { data } = await scheduleApi.drivers.update(id, dto);
      return data as Driver;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['schedule', 'drivers'] });
      queryClient.invalidateQueries({ queryKey: ['schedule', 'drivers', id] });
    },
  });
}
