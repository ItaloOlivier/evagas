'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotesApi } from '@/lib/api';

export interface QuoteItem {
  id: string;
  productId: string;
  product: { id: string; name: string; sku: string };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  customerId: string;
  customer: { id: string; name: string };
  siteId?: string;
  site?: { id: string; name: string; address: string };
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'converted';
  validUntil: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  items: QuoteItem[];
  sentAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  convertedToOrderId?: string;
  createdById: string;
  createdBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuoteDto {
  customerId: string;
  siteId?: string;
  validUntil: string;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice?: number;
    notes?: string;
  }[];
}

export interface UpdateQuoteDto extends Partial<Omit<CreateQuoteDto, 'customerId'>> {}

// Queries
export function useQuotes(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['quotes', params],
    queryFn: async () => {
      const { data } = await quotesApi.list(params);
      return data as { data: Quote[]; total: number; page: number; limit: number };
    },
  });
}

export function useQuote(id: string) {
  return useQuery({
    queryKey: ['quotes', id],
    queryFn: async () => {
      const { data } = await quotesApi.get(id);
      return data as Quote;
    },
    enabled: !!id,
  });
}

export function useQuoteStats() {
  return useQuery({
    queryKey: ['quotes', 'stats'],
    queryFn: async () => {
      const { data } = await quotesApi.list({ limit: 100 });
      const quotes = (data as { data: Quote[] }).data;
      return {
        draft: quotes.filter((q) => q.status === 'draft').length,
        sent: quotes.filter((q) => q.status === 'sent').length,
        accepted: quotes.filter((q) => q.status === 'accepted').length,
        rejected: quotes.filter((q) => q.status === 'rejected').length,
        converted: quotes.filter((q) => q.status === 'converted').length,
        expired: quotes.filter((q) => q.status === 'expired').length,
      };
    },
  });
}

// Mutations
export function useCreateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateQuoteDto) => {
      const { data } = await quotesApi.create(dto as unknown as Record<string, unknown>);
      return data as Quote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
}

export function useUpdateQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...dto }: UpdateQuoteDto & { id: string }) => {
      const { data } = await quotesApi.update(id, dto as unknown as Record<string, unknown>);
      return data as Quote;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quotes', variables.id] });
    },
  });
}

export function useSendQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await quotesApi.send(id);
      return data as Quote;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quotes', id] });
    },
  });
}

export function useAcceptQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await quotesApi.accept(id);
      return data as Quote;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quotes', id] });
    },
  });
}

export function useRejectQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { data } = await quotesApi.reject(id, reason);
      return data as Quote;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quotes', id] });
    },
  });
}

export function useConvertQuote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await quotesApi.convert(id);
      return data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quotes', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
