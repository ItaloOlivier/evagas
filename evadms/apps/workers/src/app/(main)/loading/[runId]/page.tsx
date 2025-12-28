'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Truck, Package, Check, Plus, Minus, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useScheduleRun, useCompleteLoading, useUpdateRunStatus } from '@/hooks/use-api';

interface LoadingItem {
  id: string;
  size: string;
  required: number;
  loaded: number;
}

export default function LoadingDetailPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = use(params);
  const router = useRouter();
  const [items, setItems] = useState<LoadingItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  const { data: run, isLoading, error } = useScheduleRun(runId);
  const completeLoading = useCompleteLoading();
  const updateRunStatus = useUpdateRunStatus();

  // Initialize items from API data
  useEffect(() => {
    if (run && !initialized) {
      const runItems: LoadingItem[] = [];

      // Convert plannedCylinders or items to our format
      if (run.plannedCylinders) {
        Object.entries(run.plannedCylinders).forEach(([size, quantity], idx) => {
          runItems.push({
            id: `${idx}`,
            size,
            required: quantity as number,
            loaded: 0,
          });
        });
      } else if (run.items) {
        run.items.forEach((item: { size: string; quantity: number }, idx: number) => {
          runItems.push({
            id: `${idx}`,
            size: item.size,
            required: item.quantity,
            loaded: 0,
          });
        });
      }

      setItems(runItems);
      setInitialized(true);
    }
  }, [run, initialized]);

  const updateLoaded = (itemId: string, delta: number) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newLoaded = Math.max(0, Math.min(item.required, item.loaded + delta));
        return { ...item, loaded: newLoaded };
      }
      return item;
    }));
  };

  const isComplete = items.length > 0 && items.every(item => item.loaded === item.required);
  const totalRequired = items.reduce((sum, item) => sum + item.required, 0);
  const totalLoaded = items.reduce((sum, item) => sum + item.loaded, 0);

  const handleConfirmLoad = async () => {
    // Convert items to loadedQuantities map
    const loadedQuantities: Record<string, number> = {};
    items.forEach(item => {
      loadedQuantities[item.size] = item.loaded;
    });

    try {
      // Try the dedicated complete-loading endpoint
      await completeLoading.mutateAsync({ id: runId, loadedQuantities });
      router.push('/loading');
    } catch {
      // Fallback to updating status
      try {
        await updateRunStatus.mutateAsync({ id: runId, status: 'loaded' });
        router.push('/loading');
      } catch (e) {
        console.error('Failed to complete loading:', e);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-eva-primary" />
      </div>
    );
  }

  if (error || !run) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-4 pt-2">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold">Run Details</h1>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">Failed to load run details. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const vehicleReg = run.vehicleReg || run.vehicle?.registrationNumber || 'No vehicle';
  const driverName = run.driverName || run.driver?.name || 'Unassigned';
  const totalStops = run.totalStops || run.stops?.length || 0;
  const plannedStartTime = run.plannedStartTime || run.startTime || '--:--';
  const isSubmitting = completeLoading.isPending || updateRunStatus.isPending;

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4 pt-2">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold">{run.runNumber}</h1>
          <p className="text-sm text-muted-foreground">
            {vehicleReg} • {driverName}
          </p>
        </div>
      </div>

      {/* Run Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-eva-primary/10 flex items-center justify-center">
              <Truck className="h-6 w-6 text-eva-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{run.runType === 'bulk_delivery' ? 'Bulk Delivery' : 'Cylinder Delivery'}</p>
              <p className="text-sm text-muted-foreground">
                Start time: {plannedStartTime} • {totalStops} stops
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      {totalRequired > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Loading Progress</span>
              <span className="text-sm text-muted-foreground">
                {totalLoaded} / {totalRequired}
              </span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  isComplete ? 'bg-green-500' : 'bg-eva-primary'
                )}
                style={{ width: `${(totalLoaded / totalRequired) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items to Load */}
      <div className="space-y-3">
        <h2 className="font-semibold">Cylinders to Load</h2>

        {items.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No cylinder requirements specified for this run
            </CardContent>
          </Card>
        ) : (
          items.map((item) => {
            const isDone = item.loaded === item.required;
            return (
              <Card key={item.id} className={cn(isDone && 'bg-green-50 border-green-200')}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'h-10 w-10 rounded-full flex items-center justify-center',
                        isDone ? 'bg-green-100' : 'bg-muted'
                      )}>
                        {isDone ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{item.size} Cylinders</p>
                        <p className="text-sm text-muted-foreground">
                          {item.loaded} of {item.required} loaded
                        </p>
                      </div>
                    </div>

                    {!isDone && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateLoaded(item.id, -1)}
                          disabled={item.loaded === 0}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.loaded}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateLoaded(item.id, 1)}
                          disabled={item.loaded === item.required}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Quick Load All Button */}
      {items.length > 0 && !isComplete && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setItems(prev => prev.map(item => ({ ...item, loaded: item.required })))}
        >
          <Check className="mr-2 h-4 w-4" />
          Load All Required
        </Button>
      )}

      {/* Confirm Button */}
      <Button
        className="w-full"
        size="lg"
        disabled={!isComplete || isSubmitting}
        onClick={handleConfirmLoad}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Confirming...
          </>
        ) : (
          'Confirm Loading Complete'
        )}
      </Button>
    </div>
  );
}
