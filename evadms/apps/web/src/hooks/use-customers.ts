'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customersApi } from '@/lib/api';

export interface CustomerSite {
  id: string;
  name: string;
  address: string;
  city?: string;
  province?: string;
  postalCode?: string;
  contactName?: string;
  contactPhone?: string;
  deliveryInstructions?: string;
  latitude?: number;
  longitude?: number;
  isPrimary: boolean;
}

export interface Customer {
  id: string;
  name: string;
  type: 'retail' | 'b2b' | 'wholesale';
  email?: string;
  phone?: string;
  accountNumber?: string;
  taxNumber?: string;
  creditLimit: number;
  paymentTerms: 'cod' | 'net_7' | 'net_14' | 'net_30' | 'net_45' | 'net_60';
  status: 'active' | 'inactive' | 'suspended';
  pricingTierId?: string;
  pricingTier?: { id: string; name: string };
  sites: CustomerSite[];
  _count?: {
    orders: number;
    quotes: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  name: string;
  type: 'retail' | 'b2b' | 'wholesale';
  email?: string;
  phone?: string;
  accountNumber?: string;
  taxNumber?: string;
  creditLimit?: number;
  paymentTerms?: 'cod' | 'net_7' | 'net_14' | 'net_30' | 'net_45' | 'net_60';
  pricingTierId?: string;
  sites?: Omit<CustomerSite, 'id'>[];
}

export interface UpdateCustomerDto extends Partial<CreateCustomerDto> {
  status?: 'active' | 'inactive' | 'suspended';
}

// Queries
export function useCustomers(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: async () => {
      const { data } = await customersApi.list(params);
      return data as { data: Customer[]; total: number; page: number; limit: number };
    },
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ['customers', id],
    queryFn: async () => {
      const { data } = await customersApi.get(id);
      return data as Customer;
    },
    enabled: !!id,
  });
}

// Mutations
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateCustomerDto) => {
      const { data } = await customersApi.create(dto);
      return data as Customer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...dto }: UpdateCustomerDto & { id: string }) => {
      const { data } = await customersApi.update(id, dto);
      return data as Customer;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customers', variables.id] });
    },
  });
}

export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await customersApi.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
}
