'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';

export type UserRole =
  | 'admin'
  | 'owner'
  | 'compliance'
  | 'supervisor'
  | 'dispatcher'
  | 'sales'
  | 'operator'
  | 'driver';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  permissions: string[];
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  phone?: string;
  role: UserRole;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
}

interface UsersApiResponse {
  data: User[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Queries
export function useUsers(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const { data } = await usersApi.list(params);
      const response = data as UsersApiResponse;
      // Transform to expected format for compatibility
      return {
        data: response.data || [],
        total: response.meta?.total || 0,
        page: response.meta?.page || 1,
        limit: response.meta?.limit || 20,
      };
    },
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const { data } = await usersApi.get(id);
      return data as User;
    },
    enabled: !!id,
  });
}

export function useUserStats() {
  return useQuery({
    queryKey: ['users', 'stats'],
    queryFn: async () => {
      const { data } = await usersApi.list({ limit: 1000 });
      const response = data as UsersApiResponse;
      const users = response.data || [];
      return {
        total: users.length,
        active: users.filter((u) => u.status === 'active').length,
        inactive: users.filter((u) => u.status === 'inactive').length,
        roles: new Set(users.map((u) => u.role)).size,
        byRole: {
          admin: users.filter((u) => u.role === 'admin').length,
          owner: users.filter((u) => u.role === 'owner').length,
          compliance: users.filter((u) => u.role === 'compliance').length,
          supervisor: users.filter((u) => u.role === 'supervisor').length,
          dispatcher: users.filter((u) => u.role === 'dispatcher').length,
          sales: users.filter((u) => u.role === 'sales').length,
          operator: users.filter((u) => u.role === 'operator').length,
          driver: users.filter((u) => u.role === 'driver').length,
        },
      };
    },
  });
}

// Mutations
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateUserDto) => {
      const { data } = await usersApi.create(dto as unknown as Record<string, unknown>);
      return data as User;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...dto }: UpdateUserDto & { id: string }) => {
      const { data } = await usersApi.update(id, dto as unknown as Record<string, unknown>);
      return data as User;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['users', variables.id] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await usersApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}
