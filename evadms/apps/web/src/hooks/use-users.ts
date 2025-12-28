'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';

export type UserRole =
  | 'admin'
  | 'depot_manager'
  | 'dispatcher'
  | 'driver'
  | 'sales'
  | 'yard_operator'
  | 'qc_inspector';

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

// Queries
export function useUsers(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['users', params],
    queryFn: async () => {
      const { data } = await usersApi.list(params);
      return data as { data: User[]; total: number; page: number; limit: number };
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
      const users = (data as { data: User[] }).data;
      return {
        total: users.length,
        active: users.filter((u) => u.status === 'active').length,
        inactive: users.filter((u) => u.status === 'inactive').length,
        roles: new Set(users.map((u) => u.role)).size,
        byRole: {
          admin: users.filter((u) => u.role === 'admin').length,
          depot_manager: users.filter((u) => u.role === 'depot_manager').length,
          dispatcher: users.filter((u) => u.role === 'dispatcher').length,
          driver: users.filter((u) => u.role === 'driver').length,
          sales: users.filter((u) => u.role === 'sales').length,
          yard_operator: users.filter((u) => u.role === 'yard_operator').length,
          qc_inspector: users.filter((u) => u.role === 'qc_inspector').length,
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
      const { data } = await usersApi.create(dto);
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
      const { data } = await usersApi.update(id, dto);
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
