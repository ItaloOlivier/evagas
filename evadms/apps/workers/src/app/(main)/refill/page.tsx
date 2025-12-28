'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Flame, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useRefillBatches } from '@/hooks/use-api';

interface RefillBatch {
  id: string;
  batchRef?: string;
  batchNumber?: string;
  cylinderSize: string;
  quantity: number;
  status: string;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; step: number }> = {
  created: { label: 'Pending', color: 'text-gray-600', bg: 'bg-gray-100', step: 0 },
  inspecting: { label: 'Inspecting', color: 'text-blue-600', bg: 'bg-blue-100', step: 1 },
  filling: { label: 'Filling', color: 'text-orange-600', bg: 'bg-orange-100', step: 2 },
  qc: { label: 'QC Check', color: 'text-purple-600', bg: 'bg-purple-100', step: 3 },
  passed: { label: 'Ready to Stock', color: 'text-green-600', bg: 'bg-green-100', step: 4 },
  failed: { label: 'Failed', color: 'text-red-600', bg: 'bg-red-100', step: -1 },
  stocked: { label: 'Stocked', color: 'text-green-600', bg: 'bg-green-100', step: 5 },
};

export default function RefillPage() {
  const [filter, setFilter] = useState<'active' | 'completed'>('active');

  const { data: batchesData, isLoading, error } = useRefillBatches();

  const batches: RefillBatch[] = batchesData?.data || batchesData || [];

  const activeBatches = batches.filter((b: RefillBatch) => !['passed', 'stocked', 'failed'].includes(b.status));
  const completedBatches = batches.filter((b: RefillBatch) => ['passed', 'stocked', 'failed'].includes(b.status));

  const filteredBatches = filter === 'active' ? activeBatches : completedBatches;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-eva-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 space-y-4">
        <div className="pt-2">
          <h1 className="text-2xl font-bold">Refill</h1>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">Failed to load refill batches. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const inspectingCount = batches.filter((b: RefillBatch) => b.status === 'inspecting').length;
  const fillingCount = batches.filter((b: RefillBatch) => b.status === 'filling').length;
  const qcCount = batches.filter((b: RefillBatch) => b.status === 'qc').length;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Refill</h1>
        <p className="text-muted-foreground">Fill empty cylinders</p>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-orange-500 to-eva-primary text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Active Batches</p>
              <p className="text-3xl font-bold">{activeBatches.length}</p>
            </div>
            <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
              <Flame className="h-8 w-8" />
            </div>
          </div>
          <div className="mt-4 flex gap-6">
            <div>
              <p className="text-white/80 text-xs">Inspecting</p>
              <p className="text-xl font-semibold">{inspectingCount}</p>
            </div>
            <div>
              <p className="text-white/80 text-xs">Filling</p>
              <p className="text-xl font-semibold">{fillingCount}</p>
            </div>
            <div>
              <p className="text-white/80 text-xs">QC</p>
              <p className="text-xl font-semibold">{qcCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('active')}
        >
          Active ({activeBatches.length})
        </Button>
        <Button
          variant={filter === 'completed' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('completed')}
        >
          Completed ({completedBatches.length})
        </Button>
      </div>

      {/* Batches List */}
      <div className="space-y-3">
        {filteredBatches.map((batch) => {
          const config = statusConfig[batch.status] || statusConfig.created;
          const batchRef = batch.batchRef || batch.batchNumber || `Batch ${batch.id.slice(0, 8)}`;
          return (
            <Link href={`/refill/${batch.id}`} key={batch.id}>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={cn('h-10 w-10 rounded-full flex items-center justify-center', config.bg)}>
                        <Flame className={cn('h-5 w-5', config.color)} />
                      </div>
                      <div>
                        <p className="font-medium">{batchRef}</p>
                        <p className="text-sm text-muted-foreground">
                          {batch.quantity}x {batch.cylinderSize}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>

                  {/* Progress Steps */}
                  <div className="flex items-center gap-1 mt-3">
                    {['Inspect', 'Fill', 'QC', 'Stock'].map((step, idx) => {
                      const isComplete = config.step > idx;
                      const isCurrent = config.step === idx;
                      return (
                        <div key={step} className="flex-1">
                          <div className={cn(
                            'h-1.5 rounded-full',
                            isComplete ? 'bg-green-500' : isCurrent ? 'bg-eva-primary' : 'bg-muted'
                          )} />
                          <p className={cn(
                            'text-[10px] mt-1 text-center',
                            isCurrent ? 'text-eva-primary font-medium' : 'text-muted-foreground'
                          )}>
                            {step}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}

        {filteredBatches.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No {filter} batches found
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
