'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api';
import { api } from '@/lib/api';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  type: 'cylinder' | 'bulk_lpg' | 'delivery_fee' | 'service';
  cylinderSize?: number;
  unit: string;
  basePrice: number;
  depositPrice?: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PricingTier {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  discountPercent: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductDto {
  sku: string;
  name: string;
  description?: string;
  type: 'cylinder' | 'bulk_lpg' | 'delivery_fee' | 'service';
  cylinderSize?: number;
  unit: string;
  basePrice: number;
  depositPrice?: number;
}

export interface UpdateProductDto extends Partial<CreateProductDto> {
  active?: boolean;
}

export interface CreatePricingTierDto {
  name: string;
  description?: string;
  discountPercent?: number;
}

// Products Queries
export function useProducts(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: async () => {
      const { data } = await productsApi.list(params);
      return data as { data: Product[]; total: number; page: number; limit: number };
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['products', id],
    queryFn: async () => {
      const { data } = await productsApi.get(id);
      return data as Product;
    },
    enabled: !!id,
  });
}

export function useCylinderProducts() {
  return useQuery({
    queryKey: ['products', 'cylinders'],
    queryFn: async () => {
      const { data } = await api.get('/products/cylinders');
      return data as Product[];
    },
  });
}

// Products Mutations
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateProductDto) => {
      const { data } = await productsApi.create(dto as unknown as Record<string, unknown>);
      return data as Product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...dto }: UpdateProductDto & { id: string }) => {
      const { data } = await productsApi.update(id, dto as unknown as Record<string, unknown>);
      return data as Product;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products', variables.id] });
    },
  });
}

// Pricing Tiers Queries
export function usePricingTiers() {
  return useQuery({
    queryKey: ['pricing-tiers'],
    queryFn: async () => {
      const { data } = await api.get('/pricing-tiers');
      return data as PricingTier[];
    },
  });
}

export function usePricingTier(id: string) {
  return useQuery({
    queryKey: ['pricing-tiers', id],
    queryFn: async () => {
      const { data } = await api.get(`/pricing-tiers/${id}`);
      return data as PricingTier;
    },
    enabled: !!id,
  });
}

// Pricing Tiers Mutations
export function useCreatePricingTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreatePricingTierDto) => {
      const { data } = await api.post('/pricing-tiers', dto);
      return data as PricingTier;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-tiers'] });
    },
  });
}

export function useUpdatePricingTier() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...dto }: Partial<CreatePricingTierDto> & { id: string }) => {
      const { data } = await api.put(`/pricing-tiers/${id}`, dto);
      return data as PricingTier;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pricing-tiers'] });
      queryClient.invalidateQueries({ queryKey: ['pricing-tiers', variables.id] });
    },
  });
}

export function useSetTierPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: { tierId: string; productId: string; price: number }) => {
      const { data } = await api.post('/pricing-tiers/tier-price', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-tiers'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useSetCustomerPrice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: { customerId: string; productId: string; price: number }) => {
      const { data } = await api.post('/pricing-tiers/customer-price', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}
