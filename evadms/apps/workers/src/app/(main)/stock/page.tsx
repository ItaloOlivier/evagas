'use client';

import Link from 'next/link';
import { Package, ClipboardList, ArrowDownCircle, AlertTriangle, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useStockSummary, useLowStockAlerts } from '@/hooks/use-api';

interface StockItem {
  size: string;
  full: number;
  empty: number;
  quarantine: number;
  maintenance?: number;
}

interface StockSummaryData {
  [size: string]: {
    [status: string]: number;
  };
}

interface LowStockAlert {
  size: string;
  status: string;
  quantity: number;
  minimum: number;
  message?: string;
}

export default function StockPage() {
  const { data: stockSummaryData, isLoading: stockLoading, error: stockError } = useStockSummary();
  const { data: alertsData, isLoading: alertsLoading } = useLowStockAlerts();

  const isLoading = stockLoading || alertsLoading;

  // Transform API data to our format
  const getCylinderData = (): StockItem[] => {
    if (!stockSummaryData) return [];

    // Handle different API response structures
    const data = stockSummaryData.data || stockSummaryData;

    // If it's already an array of items
    if (Array.isArray(data)) {
      return data.map((item: { size: string; full?: number; empty?: number; quarantine?: number; maintenance?: number }) => ({
        size: item.size,
        full: item.full || 0,
        empty: item.empty || 0,
        quarantine: item.quarantine || 0,
        maintenance: item.maintenance || 0,
      }));
    }

    // If it's an object with sizes as keys
    if (typeof data === 'object') {
      const summaryData = data as StockSummaryData;
      return Object.entries(summaryData).map(([size, statuses]) => ({
        size,
        full: statuses.full || 0,
        empty: statuses.empty || 0,
        quarantine: statuses.quarantine || 0,
        maintenance: statuses.maintenance || 0,
      }));
    }

    return [];
  };

  const cylinders = getCylinderData();
  const alerts: LowStockAlert[] = alertsData?.data || alertsData || [];

  const totalFull = cylinders.reduce((sum, c) => sum + c.full, 0);
  const totalEmpty = cylinders.reduce((sum, c) => sum + c.empty, 0);
  const totalQuarantine = cylinders.reduce((sum, c) => sum + c.quarantine, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-eva-primary" />
      </div>
    );
  }

  if (stockError) {
    return (
      <div className="p-4 space-y-4">
        <div className="pt-2">
          <h1 className="text-2xl font-bold">Stock</h1>
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
      <div className="pt-2">
        <h1 className="text-2xl font-bold">Stock</h1>
        <p className="text-muted-foreground">Cylinder inventory overview</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 text-center">
            <div className="h-3 w-3 rounded-full bg-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalFull}</p>
            <p className="text-xs text-muted-foreground">Full</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="h-3 w-3 rounded-full bg-gray-400 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalEmpty}</p>
            <p className="text-xs text-muted-foreground">Empty</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 text-center">
            <div className="h-3 w-3 rounded-full bg-red-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalQuarantine}</p>
            <p className="text-xs text-muted-foreground">Quarantine</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {alerts.length > 0 && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-amber-700">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-medium">Low Stock Alert</p>
                <p className="text-sm">
                  {alerts[0].message || `${alerts[0].size} ${alerts[0].status} - Below minimum`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/stock/count">
          <Card className="h-full hover:bg-muted/50 transition-colors">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                <ClipboardList className="h-6 w-6 text-blue-600" />
              </div>
              <p className="font-medium">Daily Count</p>
              <p className="text-xs text-muted-foreground">Record stock count</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/stock/receive">
          <Card className="h-full hover:bg-muted/50 transition-colors">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-3">
                <ArrowDownCircle className="h-6 w-6 text-purple-600" />
              </div>
              <p className="font-medium">Receive Empties</p>
              <p className="text-xs text-muted-foreground">Log returned cylinders</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Stock by Size */}
      <div className="space-y-3">
        <h2 className="font-semibold">Stock by Size</h2>

        {cylinders.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No stock data available
            </CardContent>
          </Card>
        ) : (
          cylinders.map((cylinder) => {
            const total = cylinder.full + cylinder.empty + cylinder.quarantine;
            return (
              <Card key={cylinder.size}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{cylinder.size}</p>
                        <p className="text-sm text-muted-foreground">Total: {total}</p>
                      </div>
                    </div>
                  </div>

                  {/* Stock Bar */}
                  {total > 0 && (
                    <div className="h-4 bg-muted rounded-full overflow-hidden flex">
                      <div
                        className="bg-green-500 h-full"
                        style={{ width: `${(cylinder.full / total) * 100}%` }}
                      />
                      <div
                        className="bg-gray-400 h-full"
                        style={{ width: `${(cylinder.empty / total) * 100}%` }}
                      />
                      <div
                        className="bg-red-500 h-full"
                        style={{ width: `${(cylinder.quarantine / total) * 100}%` }}
                      />
                    </div>
                  )}

                  {/* Legend */}
                  <div className="flex gap-4 mt-2 text-xs">
                    <span className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-green-500" />
                      Full: {cylinder.full}
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-gray-400" />
                      Empty: {cylinder.empty}
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      Quar: {cylinder.quarantine}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
