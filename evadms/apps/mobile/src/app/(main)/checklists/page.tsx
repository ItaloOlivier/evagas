'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ClipboardCheck, CheckCircle, Clock, AlertTriangle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Mock data
const mockChecklists = [
  {
    id: '1',
    name: 'Daily Vehicle Inspection',
    description: 'Complete before starting your first run',
    required: true,
    status: 'completed',
    completedAt: '2024-01-15T07:15:00Z',
    itemCount: 15,
  },
  {
    id: '2',
    name: 'Pre-Delivery Safety Check',
    description: 'Complete before each delivery',
    required: true,
    status: 'pending',
    completedAt: null,
    itemCount: 8,
  },
  {
    id: '3',
    name: 'End of Day Report',
    description: 'Complete at end of shift',
    required: false,
    status: 'pending',
    completedAt: null,
    itemCount: 10,
  },
];

const statusConfig = {
  completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100', label: 'Completed' },
  pending: { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-100', label: 'Pending' },
  failed: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-100', label: 'Failed' },
};

export default function ChecklistsPage() {
  const pendingRequired = mockChecklists.filter((c) => c.required && c.status !== 'completed').length;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Checklists</h1>
        <p className="text-muted-foreground">Safety and compliance checks</p>
      </div>

      {/* Alert for pending required checklists */}
      {pendingRequired > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="font-medium text-yellow-800">Required Checklists Pending</p>
              <p className="text-sm text-yellow-700">
                Complete {pendingRequired} required checklist{pendingRequired !== 1 ? 's' : ''} before proceeding
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's summary */}
      <Card className="bg-eva-primary text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Today's Checklists</p>
              <p className="text-3xl font-bold">{mockChecklists.length}</p>
            </div>
            <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
              <ClipboardCheck className="h-8 w-8" />
            </div>
          </div>
          <div className="mt-4 flex gap-6">
            <div>
              <p className="text-white/80 text-xs">Completed</p>
              <p className="text-xl font-semibold">
                {mockChecklists.filter((c) => c.status === 'completed').length}
              </p>
            </div>
            <div>
              <p className="text-white/80 text-xs">Pending</p>
              <p className="text-xl font-semibold">
                {mockChecklists.filter((c) => c.status === 'pending').length}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Checklists list */}
      <div className="space-y-3">
        {mockChecklists.map((checklist) => {
          const config = statusConfig[checklist.status];
          const Icon = config.icon;

          return (
            <Link key={checklist.id} href={`/checklists/${checklist.id}`}>
              <Card className={cn(
                'transition-all active:scale-[0.98]',
                checklist.required && checklist.status !== 'completed' && 'border-yellow-300'
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center', config.bg)}>
                      <Icon className={cn('h-6 w-6', config.color)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{checklist.name}</p>
                        {checklist.required && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {checklist.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {checklist.itemCount} items • {config.label}
                      </p>
                    </div>

                    <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
