'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Truck, ChevronRight, Package, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useScheduleRuns } from '@/hooks/use-api';

interface RunItem {
  size: string;
  quantity: number;
  unit?: string;
}

interface Run {
  id: string;
  runNumber: string;
  status: string;
  driverName?: string;
  vehicleReg?: string;
  driver?: { name: string };
  vehicle?: { registrationNumber: string };
  runType: string;
  totalStops?: number;
  stops?: unknown[];
  items?: RunItem[];
  plannedCylinders?: Record<string, number>;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  scheduled: { label: 'Scheduled', color: 'text-gray-600', bg: 'bg-gray-100' },
  ready: { label: 'Ready to Load', color: 'text-blue-600', bg: 'bg-blue-100' },
  loading: { label: 'Loading', color: 'text-orange-600', bg: 'bg-orange-100' },
  loaded: { label: 'Loaded', color: 'text-green-600', bg: 'bg-green-100' },
  in_progress: { label: 'In Progress', color: 'text-purple-600', bg: 'bg-purple-100' },
  completed: { label: 'Completed', color: 'text-green-700', bg: 'bg-green-100' },
};

export default function LoadingPage() {
  const [filter, setFilter] = useState<'all' | 'ready' | 'loading'>('all');
  const today = new Date().toISOString().split('T')[0];

  const { data: runsData, isLoading, error } = useScheduleRuns({ date: today });

  const runs: Run[] = runsData?.data || runsData || [];

  const filteredRuns = filter === 'all'
    ? runs.filter((run: Run) => ['ready', 'loading', 'loaded'].includes(run.status))
    : runs.filter((run: Run) => run.status === filter);

  const readyCount = runs.filter((r: Run) => r.status === 'ready').length;
  const loadingCount = runs.filter((r: Run) => r.status === 'loading').length;

  // Helper to extract items from run data
  const getRunItems = (run: Run): RunItem[] => {
    if (run.items) return run.items;
    if (run.plannedCylinders) {
      return Object.entries(run.plannedCylinders).map(([size, quantity]) => ({
        size,
        quantity,
      }));
    }
    return [];
  };

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
          <h1 className="text-2xl font-bold">Loading</h1>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">Failed to load runs. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Loading</h1>
        <p className="text-muted-foreground">Load trucks for delivery runs</p>
      </div>

      {/* Summary Card */}
      <Card className="bg-eva-primary text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Today&apos;s Runs</p>
              <p className="text-3xl font-bold">{runs.length}</p>
            </div>
            <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
              <Truck className="h-8 w-8" />
            </div>
          </div>
          <div className="mt-4 flex gap-6">
            <div>
              <p className="text-white/80 text-xs">Ready</p>
              <p className="text-xl font-semibold">{readyCount}</p>
            </div>
            <div>
              <p className="text-white/80 text-xs">In Progress</p>
              <p className="text-xl font-semibold">{loadingCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'ready', 'loading'] as const).map((status) => (
          <Button
            key={status}
            variant={filter === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(status)}
          >
            {status === 'all' ? 'All' : status === 'ready' ? 'Ready' : 'Loading'}
          </Button>
        ))}
      </div>

      {/* Runs List */}
      <div className="space-y-3">
        {filteredRuns.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No runs {filter !== 'all' ? `with status "${filter}"` : ''} found for today
            </CardContent>
          </Card>
        ) : (
          filteredRuns.map((run) => {
            const config = statusConfig[run.status] || statusConfig.scheduled;
            const items = getRunItems(run);
            const vehicleReg = run.vehicleReg || run.vehicle?.registrationNumber || 'No vehicle';
            const driverName = run.driverName || run.driver?.name || 'Unassigned';
            const totalStops = run.totalStops || run.stops?.length || 0;

            return (
              <Link href={`/loading/${run.id}`} key={run.id}>
                <Card className="overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{run.runNumber}</CardTitle>
                      <span className={cn('text-xs font-medium px-2 py-1 rounded-full', config.bg, config.color)}>
                        {config.label}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {vehicleReg} • {driverName}
                    </p>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    {/* Items to load */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {items.length > 0 ? (
                        items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-lg text-sm">
                            <Package className="h-3 w-3" />
                            <span>{item.quantity}x {item.size}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">No items specified</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{totalStops} stops</span>
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
