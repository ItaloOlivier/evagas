'use client';

import { useState } from 'react';
import { Plus, ArrowUpDown, Package, AlertTriangle, ArrowDown, ArrowUp, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import {
  useInventorySummary,
  useCylinderMovements,
  useRefillBatches,
  useBulkTanks,
  useTransitionRefillBatch,
  type RefillBatchStatus,
} from '@/hooks/use-inventory';

const sizeLabels: Record<string, string> = {
  kg_9: '9kg',
  kg_14: '14kg',
  kg_19: '19kg',
  kg_48: '48kg',
};

const movementTypeLabels: Record<string, { label: string; color: string }> = {
  received: { label: 'Received', color: 'text-blue-600' },
  filled: { label: 'Filled', color: 'text-green-600' },
  issued_to_delivery: { label: 'Issued', color: 'text-orange-600' },
  delivered: { label: 'Delivered', color: 'text-purple-600' },
  returned_full: { label: 'Returned Full', color: 'text-green-600' },
  returned_empty: { label: 'Returned Empty', color: 'text-gray-600' },
  collected_empty: { label: 'Collected Empty', color: 'text-blue-600' },
  damaged: { label: 'Damaged', color: 'text-red-600' },
  scrapped: { label: 'Scrapped', color: 'text-red-600' },
  adjustment: { label: 'Adjustment', color: 'text-yellow-600' },
  transfer_in: { label: 'Transfer In', color: 'text-green-600' },
  transfer_out: { label: 'Transfer Out', color: 'text-orange-600' },
  stock_count: { label: 'Stock Count', color: 'text-blue-600' },
  initial_stock: { label: 'Initial Stock', color: 'text-gray-600' },
};

const batchStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  created: { label: 'Created', variant: 'secondary' },
  inspecting: { label: 'Inspecting', variant: 'default' },
  filling: { label: 'Filling', variant: 'warning' },
  qc: { label: 'QC', variant: 'default' },
  passed: { label: 'Passed', variant: 'success' },
  failed: { label: 'Failed', variant: 'destructive' },
  stocked: { label: 'Stocked', variant: 'success' },
};

export default function InventoryPage() {
  const { toast } = useToast();

  // Queries
  const { data: stockSummary, isLoading: summaryLoading, error: summaryError } = useInventorySummary();
  const { data: movementsData, isLoading: movementsLoading } = useCylinderMovements({ limit: 50 });
  const { data: batchesData, isLoading: batchesLoading } = useRefillBatches();
  const { data: tanks, isLoading: tanksLoading } = useBulkTanks();

  // Mutations
  const transitionBatch = useTransitionRefillBatch();

  const movements = movementsData?.data || [];
  const batches = batchesData?.data || [];

  // Calculate totals from summary
  const totalFull = stockSummary?.reduce((sum, item) => sum + item.full, 0) || 0;
  const totalEmpty = stockSummary?.reduce((sum, item) => sum + item.empty, 0) || 0;
  const totalAtCustomer = stockSummary?.reduce((sum, item) => sum + item.atCustomer, 0) || 0;
  const lowStockItems = stockSummary?.filter((item) => item.full < 50) || []; // Assume 50 as minimum

  const handleTransitionBatch = async (batchId: string, status: RefillBatchStatus) => {
    try {
      await transitionBatch.mutateAsync({ id: batchId, status });
      toast({ title: 'Success', description: `Batch status updated to ${batchStatusConfig[status]?.label}` });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update batch status',
        variant: 'destructive',
      });
    }
  };

  if (summaryError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load inventory</p>
          <p className="text-sm text-muted-foreground">
            {(summaryError as any)?.message || 'Please try again later'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Manage cylinder stock and track movements
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Record Movement
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Refill Batch
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Full Cylinders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {summaryLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalFull}
            </div>
            <p className="text-xs text-muted-foreground">Ready for dispatch</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Empty Cylinders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {summaryLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalEmpty}
            </div>
            <p className="text-xs text-muted-foreground">Ready for refill</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              At Customer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {summaryLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalAtCustomer}
            </div>
            <p className="text-xs text-muted-foreground">Pending collection</p>
          </CardContent>
        </Card>
        <Card className={lowStockItems.length > 0 ? 'border-yellow-300 bg-yellow-50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {lowStockItems.length > 0 && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : lowStockItems.length}
            </div>
            <p className="text-xs text-muted-foreground">Items below minimum</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="summary">
        <TabsList>
          <TabsTrigger value="summary">Stock Summary</TabsTrigger>
          <TabsTrigger value="movements">Movements</TabsTrigger>
          <TabsTrigger value="refill">Refill Batches</TabsTrigger>
          <TabsTrigger value="tanks">Bulk Tanks</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cylinder Stock by Size</CardTitle>
              <CardDescription>Current inventory levels across all statuses</CardDescription>
            </CardHeader>
            <CardContent>
              {summaryLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Size</TableHead>
                      <TableHead className="text-right">Full</TableHead>
                      <TableHead className="text-right">Empty</TableHead>
                      <TableHead className="text-right">Issued</TableHead>
                      <TableHead className="text-right">At Customer</TableHead>
                      <TableHead className="text-right">Damaged</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockSummary && stockSummary.length > 0 ? (
                      stockSummary.map((item) => (
                        <TableRow key={item.size}>
                          <TableCell className="font-medium">
                            {sizeLabels[item.size] || item.size}
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            {item.full}
                          </TableCell>
                          <TableCell className="text-right text-gray-500">{item.empty}</TableCell>
                          <TableCell className="text-right text-blue-600">{item.issued}</TableCell>
                          <TableCell className="text-right text-orange-600">{item.atCustomer}</TableCell>
                          <TableCell className="text-right text-red-600">{item.damaged}</TableCell>
                          <TableCell className="text-right font-medium">{item.total}</TableCell>
                          <TableCell>
                            {item.full < 50 ? (
                              <Badge variant="warning" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Low Stock
                              </Badge>
                            ) : (
                              <Badge variant="success">OK</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No inventory data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Movements</CardTitle>
              <CardDescription>Cylinder status changes and transfers</CardDescription>
            </CardHeader>
            <CardContent>
              {movementsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Transition</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.length > 0 ? (
                      movements.map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell className="text-sm">{formatDate(movement.createdAt)}</TableCell>
                          <TableCell>
                            <span className={movementTypeLabels[movement.movementType]?.color || ''}>
                              {movementTypeLabels[movement.movementType]?.label || movement.movementType}
                            </span>
                          </TableCell>
                          <TableCell>{sizeLabels[movement.cylinderSize] || movement.cylinderSize}</TableCell>
                          <TableCell className="text-right font-medium">{movement.quantity}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              {movement.previousStatus && (
                                <Badge variant="outline">{movement.previousStatus}</Badge>
                              )}
                              {movement.previousStatus && movement.newStatus && (
                                <ArrowDown className="h-3 w-3 text-muted-foreground rotate-[-90deg]" />
                              )}
                              {movement.newStatus && (
                                <Badge variant="outline">{movement.newStatus}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {movement.createdBy?.firstName} {movement.createdBy?.lastName}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {movement.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No movements recorded
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="refill" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Refill Batches</CardTitle>
              <CardDescription>Track cylinder refilling operations</CardDescription>
            </CardHeader>
            <CardContent>
              {batchesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch ID</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Planned / Actual</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead>Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.length > 0 ? (
                      batches.map((batch) => (
                        <TableRow key={batch.id}>
                          <TableCell className="font-medium">{batch.batchNumber}</TableCell>
                          <TableCell>{sizeLabels[batch.cylinderSize] || batch.cylinderSize}</TableCell>
                          <TableCell>
                            {batch.plannedCount}
                            {batch.actualFilledCount !== undefined && ` / ${batch.actualFilledCount}`}
                          </TableCell>
                          <TableCell>
                            <Badge variant={batchStatusConfig[batch.status]?.variant || 'default'}>
                              {batchStatusConfig[batch.status]?.label || batch.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {batch.createdBy?.firstName} {batch.createdBy?.lastName}
                          </TableCell>
                          <TableCell className="text-sm">
                            {batch.startedAt ? formatDate(batch.startedAt) : '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {batch.completedAt ? formatDate(batch.completedAt) : '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No refill batches found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tanks" className="space-y-4">
          {tanksLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : tanks && tanks.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {tanks.map((tank) => (
                <Card key={tank.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {tank.name}
                      <Badge variant={tank.currentLevel / tank.capacity < 0.3 ? 'warning' : 'success'}>
                        {Math.round((tank.currentLevel / tank.capacity) * 100)}% Full
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Last reading: {tank.lastReadingAt ? formatDate(tank.lastReadingAt) : 'Never'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="relative h-8 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-eva-primary rounded-full"
                          style={{ width: `${(tank.currentLevel / tank.capacity) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{tank.currentLevel.toLocaleString()} {tank.unit}</span>
                        <span className="text-muted-foreground">
                          of {tank.capacity.toLocaleString()} {tank.unit} capacity
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <ArrowUp className="mr-2 h-4 w-4" />
                          Record Delivery
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <ArrowDown className="mr-2 h-4 w-4" />
                          Record Reading
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">No bulk tanks configured</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
