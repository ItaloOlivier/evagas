'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Save, AlertTriangle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useStockSummary, useSubmitDailyCount } from '@/hooks/use-api';

interface StockItem {
  size: string;
  status: string;
  systemQty: number;
}

export default function StockCountPage() {
  const router = useRouter();
  const [counts, setCounts] = useState<Record<string, number>>({});

  const { data: stockSummaryData, isLoading, error } = useStockSummary();
  const submitCount = useSubmitDailyCount();

  // Transform API data to systemStock format
  const getSystemStock = (): StockItem[] => {
    if (!stockSummaryData) return [];

    const data = stockSummaryData.data || stockSummaryData;
    const items: StockItem[] = [];

    // Handle object format: { '9kg': { full: 100, empty: 50 }, ... }
    if (typeof data === 'object' && !Array.isArray(data)) {
      Object.entries(data).forEach(([size, statuses]) => {
        if (typeof statuses === 'object') {
          Object.entries(statuses as Record<string, number>).forEach(([status, qty]) => {
            if (['full', 'empty', 'quarantine', 'maintenance'].includes(status)) {
              items.push({ size, status, systemQty: qty || 0 });
            }
          });
        }
      });
    }

    // Handle array format: [{ size: '9kg', full: 100, empty: 50 }, ...]
    if (Array.isArray(data)) {
      data.forEach((item: { size: string; full?: number; empty?: number; quarantine?: number; maintenance?: number }) => {
        if (item.full !== undefined) items.push({ size: item.size, status: 'full', systemQty: item.full });
        if (item.empty !== undefined) items.push({ size: item.size, status: 'empty', systemQty: item.empty });
        if (item.quarantine !== undefined) items.push({ size: item.size, status: 'quarantine', systemQty: item.quarantine });
        if (item.maintenance !== undefined) items.push({ size: item.size, status: 'maintenance', systemQty: item.maintenance });
      });
    }

    // If still empty, provide default structure
    if (items.length === 0) {
      ['9kg', '14kg', '19kg', '48kg'].forEach(size => {
        items.push({ size, status: 'full', systemQty: 0 });
        items.push({ size, status: 'empty', systemQty: 0 });
      });
    }

    return items;
  };

  const systemStock = getSystemStock();

  const getKey = (size: string, status: string) => `${size}-${status}`;

  const updateCount = (size: string, status: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setCounts(prev => ({ ...prev, [getKey(size, status)]: numValue }));
  };

  const getVariance = (size: string, status: string, systemQty: number) => {
    const counted = counts[getKey(size, status)];
    if (counted === undefined) return null;
    return counted - systemQty;
  };

  const hasVariances = systemStock.some(item => {
    const variance = getVariance(item.size, item.status, item.systemQty);
    return variance !== null && variance !== 0;
  });

  const handleSubmit = async () => {
    const today = new Date().toISOString().split('T')[0];

    // Build items array from counts
    const items = Object.entries(counts).map(([key, physicalQuantity]) => {
      const [cylinderSize, status] = key.split('-');
      return { cylinderSize, status, physicalQuantity };
    });

    try {
      await submitCount.mutateAsync({ countDate: today, items });
      router.push('/stock');
    } catch (e) {
      console.error('Failed to submit count:', e);
    }
  };

  // Group by size
  const sizes = Array.from(new Set(systemStock.map(s => s.size)));

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
        <div className="flex items-center gap-4 pt-2">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold">Daily Stock Count</h1>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">Failed to load stock data. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4 pt-2">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Daily Stock Count</h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 text-sm text-blue-700">
          Count the physical cylinders and enter quantities below. Variances will be highlighted.
        </CardContent>
      </Card>

      {/* Count Forms */}
      <div className="space-y-4">
        {sizes.map((size) => {
          const sizeItems = systemStock.filter(s => s.size === size);

          return (
            <Card key={size}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Package className="h-5 w-5" />
                  </div>
                  <p className="font-medium text-lg">{size} Cylinders</p>
                </div>

                <div className="space-y-3">
                  {sizeItems.map((item) => {
                    const key = getKey(item.size, item.status);
                    const counted = counts[key];
                    const variance = getVariance(item.size, item.status, item.systemQty);
                    const hasVariance = variance !== null && variance !== 0;

                    return (
                      <div key={key} className="flex items-center gap-3">
                        <div className={cn(
                          'h-3 w-3 rounded-full',
                          item.status === 'full' ? 'bg-green-500' : 'bg-gray-400'
                        )} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium capitalize">{item.status}</span>
                            <span className="text-xs text-muted-foreground">
                              System: {item.systemQty}
                            </span>
                          </div>
                          <Input
                            type="number"
                            inputMode="numeric"
                            placeholder="Count"
                            value={counted ?? ''}
                            onChange={(e) => updateCount(item.size, item.status, e.target.value)}
                            className={cn(
                              hasVariance && 'border-amber-500 bg-amber-50'
                            )}
                          />
                          {hasVariance && (
                            <div className="flex items-center gap-1 mt-1 text-amber-600 text-xs">
                              <AlertTriangle className="h-3 w-3" />
                              Variance: {variance! > 0 ? '+' : ''}{variance}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Submit Button */}
      <Button
        className="w-full"
        size="lg"
        onClick={handleSubmit}
        disabled={submitCount.isPending || Object.keys(counts).length === 0}
      >
        {submitCount.isPending ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Save className="mr-2 h-5 w-5" />
            Submit Count
          </>
        )}
      </Button>

      {hasVariances && (
        <p className="text-sm text-center text-amber-600">
          Variances detected - supervisor approval may be required
        </p>
      )}
    </div>
  );
}
