'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checklistsApi } from '@/lib/api';

export type ChecklistType =
  | 'vehicle_inspection'
  | 'pre_delivery'
  | 'post_delivery'
  | 'cylinder_inspection'
  | 'depot_audit'
  | 'safety_inspection'
  | 'driver_training'
  | 'custom';

export type ChecklistCategory = 'safety' | 'quality' | 'compliance' | 'training' | 'operational';

export type ItemType = 'yes_no' | 'text' | 'number' | 'photo' | 'signature' | 'reading' | 'select' | 'multi_select';

export type TemplateStatus = 'draft' | 'active' | 'archived';

export type ResponseStatus = 'in_progress' | 'completed' | 'cancelled';

export interface ChecklistItem {
  id: string;
  templateId: string;
  question: string;
  description?: string;
  itemType: ItemType;
  options?: string[];
  required: boolean;
  isCritical: boolean;
  blocksOnFail: boolean;
  sequence: number;
  conditions?: Record<string, unknown>;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description?: string;
  type: ChecklistType;
  category: ChecklistCategory;
  status: TemplateStatus;
  version: number;
  items: ChecklistItem[];
  createdById: string;
  createdBy: { id: string; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistAnswer {
  id: string;
  responseId: string;
  itemId: string;
  item: ChecklistItem;
  value: string;
  passed?: boolean;
  notes?: string;
  photoUrl?: string;
  signatureUrl?: string;
  createdAt: string;
}

export interface ChecklistResponse {
  id: string;
  templateId: string;
  template: { id: string; name: string; type: ChecklistType; category: ChecklistCategory };
  entityType: string;
  entityId: string;
  respondentId: string;
  respondent: { id: string; firstName: string; lastName: string };
  status: ResponseStatus;
  passed?: boolean;
  blocked: boolean;
  answers: ChecklistAnswer[];
  startedAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Queries
export function useChecklistTemplates(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['checklists', 'templates', params],
    queryFn: async () => {
      const { data } = await checklistsApi.templates.list();
      return data as ChecklistTemplate[];
    },
  });
}

export function useChecklistTemplate(id: string) {
  return useQuery({
    queryKey: ['checklists', 'templates', id],
    queryFn: async () => {
      const { data } = await checklistsApi.templates.get(id);
      return data as ChecklistTemplate;
    },
    enabled: !!id,
  });
}

export function useChecklistResponses(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['checklists', 'responses', params],
    queryFn: async () => {
      const { data } = await checklistsApi.responses.list(params);
      return data as { data: ChecklistResponse[]; total: number; page: number; limit: number };
    },
  });
}

export function useChecklistResponse(id: string) {
  return useQuery({
    queryKey: ['checklists', 'responses', id],
    queryFn: async () => {
      const { data } = await checklistsApi.responses.get(id);
      return data as ChecklistResponse;
    },
    enabled: !!id,
  });
}

export function useChecklistStats() {
  return useQuery({
    queryKey: ['checklists', 'stats'],
    queryFn: async () => {
      const [templatesRes, responsesRes] = await Promise.all([
        checklistsApi.templates.list(),
        checklistsApi.responses.list({ limit: 1000 }),
      ]);

      const templates = templatesRes.data as ChecklistTemplate[];
      const responses = (responsesRes.data as { data: ChecklistResponse[] }).data;

      const today = new Date().toDateString();
      const todayResponses = responses.filter(
        (r) => new Date(r.createdAt).toDateString() === today
      );

      return {
        activeTemplates: templates.filter((t) => t.status === 'active').length,
        totalTemplates: templates.length,
        completedToday: todayResponses.filter((r) => r.status === 'completed').length,
        inProgress: responses.filter((r) => r.status === 'in_progress').length,
        blocked: responses.filter((r) => r.blocked).length,
        passedToday: todayResponses.filter((r) => r.passed === true).length,
        failedToday: todayResponses.filter((r) => r.passed === false).length,
      };
    },
  });
}

// Mutations
export function useCreateChecklistTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: {
      name: string;
      description?: string;
      type: ChecklistType;
      category: ChecklistCategory;
      items: Omit<ChecklistItem, 'id' | 'templateId'>[];
    }) => {
      const { data } = await checklistsApi.templates.create(dto);
      return data as ChecklistTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists', 'templates'] });
    },
  });
}

export function useUpdateChecklistTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...dto }: { id: string; name?: string; description?: string }) => {
      const { data } = await checklistsApi.templates.update(id, dto);
      return data as ChecklistTemplate;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['checklists', 'templates'] });
      queryClient.invalidateQueries({ queryKey: ['checklists', 'templates', id] });
    },
  });
}

export function useActivateChecklistTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await checklistsApi.templates.activate(id);
      return data as ChecklistTemplate;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['checklists', 'templates'] });
      queryClient.invalidateQueries({ queryKey: ['checklists', 'templates', id] });
    },
  });
}

export function useArchiveChecklistTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await checklistsApi.templates.archive(id);
      return data as ChecklistTemplate;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['checklists', 'templates'] });
      queryClient.invalidateQueries({ queryKey: ['checklists', 'templates', id] });
    },
  });
}

export function useCreateChecklistResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: { templateId: string; entityType: string; entityId: string }) => {
      const { data } = await checklistsApi.responses.create(dto);
      return data as ChecklistResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists', 'responses'] });
    },
  });
}

export function useUpdateChecklistResponse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...dto }: { id: string; answers?: Record<string, unknown>[] }) => {
      const { data } = await checklistsApi.responses.update(id, dto);
      return data as ChecklistResponse;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['checklists', 'responses'] });
      queryClient.invalidateQueries({ queryKey: ['checklists', 'responses', id] });
    },
  });
}
