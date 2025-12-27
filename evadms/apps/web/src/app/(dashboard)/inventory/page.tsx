'use client';

import { useState } from 'react';
import { Plus, ArrowUpDown, Package, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/utils';

// Mock data
const mockInventorySummary = [
  { size: '9kg', full: 245, empty: 120, issued: 45, atCustomer: 380, damaged: 5, minStock: 200 },
  { size: '14kg', full: 180, empty: 95, issued: 30, atCustomer: 220, damaged: 3, minStock: 150 },
  { size: '19kg', full: 150, empty: 80, issued: 25, atCustomer: 180, damaged: 2, minStock: 100 },
  { size: '48kg', full: 85, empty: 45, issued: 15, atCustomer: 120, damaged: 1, minStock: 50 },
];

const mockMovements = [
  { id: '1', timestamp: '2024-01-15T14:30:00Z', type: 'refill', size: '9kg', quantity: 50, from: 'empty', to: 'full', user: 'John Doe', reference: 'RF-2024-045' },
  { id: '2', timestamp: '2024-01-15T13:15:00Z', type: 'issue', size: '19kg', quantity: 10, from: 'full', to: 'issued', user: 'Mike Smith', reference: 'ORD-2024-0156' },
  { id: '3', timestamp: '2024-01-15T12:00:00Z', type: 'deliver', size: '9kg', quantity: 20, from: 'issued', to: 'at_customer', user: 'Peter Jones', reference: 'ORD-2024-0154' },
  { id: '4', timestamp: '2024-01-15T11:30:00Z', type: 'collect_empty', size: '14kg', quantity: 15, from: 'at_customer', to: 'empty', user: 'Peter Jones', reference: 'ORD-2024-0154' },
  { id: '5', timestamp: '2024-01-15T10:00:00Z', type: 'receive_empty', size: '48kg', quantity: 10, from: null, to: 'empty', user: 'Admin', reference: 'RECV-001' },
];

const mockRefillBatches = [
  { id: 'RF-2024-045', status: 'filling', size: '9kg', targetCount: 50, startedAt: '2024-01-15T08:00:00Z', operator: 'John Doe' },
  { id: 'RF-2024-044', status: 'qc', size: '14kg', targetCount: 30, startedAt: '2024-01-14T14:00:00Z', operator: 'Mike Smith' },
  { id: 'RF-2024-043', status: 'stocked', size: '19kg', targetCount: 25, actualCount: 25, startedAt: '2024-01-14T08:00:00Z', completedAt: '2024-01-14T16:00:00Z', operator: 'John Doe' },
];

const mockTanks = [
  { id: '1', name: 'Tank A', capacity: 10000, currentLevel: 7500, lastReading: '2024-01-15T08:00:00Z' },
  { id: '2', name: 'Tank B', capacity: 10000, currentLevel: 4200, lastReading: '2024-01-15T08:00:00Z' },
];

const movementTypeLabels: Record<string, { label: string; color: string }> = {
  receive_empty: { label: 'Receive Empty', color: 'text-blue-600' },
  refill: { label: 'Refill', color: 'text-green-600' },
  issue: { label: 'Issue', color: 'text-orange-600' },
  deliver: { label: 'Deliver', color: 'text-purple-600' },
  collect_empty: { label: 'Collect Empty', color: 'text-blue-600' },
  scrap: { label: 'Scrap', color: 'text-red-600' },
};

const batchStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' }> = {
  created: { label: 'Created', variant: 'secondary' },
  inspecting: { label: 'Inspecting', variant: 'default' },
  filling: { label: 'Filling', variant: 'warning' },
  qc: { label: 'QC', variant: 'default' },
  passed: { label: 'Passed', variant: 'success' },
  stocked: { label: 'Stocked', variant: 'success' },
};

export default function InventoryPage() {
  const totalFull = mockInventorySummary.reduce((sum, item) => sum + item.full, 0);
  const totalEmpty = mockInventorySummary.reduce((sum, item) => sum + item.empty, 0);
  const totalAtCustomer = mockInventorySummary.reduce((sum, item) => sum + item.atCustomer, 0);
  const lowStockItems = mockInventorySummary.filter((item) => item.full < item.minStock);

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
            <div className="text-2xl font-bold text-green-600">{totalFull}</div>
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
            <div className="text-2xl font-bold text-gray-600">{totalEmpty}</div>
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
            <div className="text-2xl font-bold text-orange-600">{totalAtCustomer}</div>
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
            <div className="text-2xl font-bold">{lowStockItems.length}</div>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Full</TableHead>
                    <TableHead className="text-right">Empty</TableHead>
                    <TableHead className="text-right">Issued</TableHead>
                    <TableHead className="text-right">At Customer</TableHead>
                    <TableHead className="text-right">Damaged</TableHead>
                    <TableHead className="text-right">Min Stock</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInventorySummary.map((item) => (
                    <TableRow key={item.size}>
                      <TableCell className="font-medium">{item.size}</TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        {item.full}
                      </TableCell>
                      <TableCell className="text-right text-gray-500">{item.empty}</TableCell>
                      <TableCell className="text-right text-blue-600">{item.issued}</TableCell>
                      <TableCell className="text-right text-orange-600">{item.atCustomer}</TableCell>
                      <TableCell className="text-right text-red-600">{item.damaged}</TableCell>
                      <TableCell className="text-right">{item.minStock}</TableCell>
                      <TableCell>
                        {item.full < item.minStock ? (
                          <Badge variant="warning" className="gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="success">OK</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Transition</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="text-sm">{formatDate(movement.timestamp)}</TableCell>
                      <TableCell>
                        <span className={movementTypeLabels[movement.type]?.color}>
                          {movementTypeLabels[movement.type]?.label}
                        </span>
                      </TableCell>
                      <TableCell>{movement.size}</TableCell>
                      <TableCell className="text-right font-medium">{movement.quantity}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          {movement.from && <Badge variant="outline">{movement.from}</Badge>}
                          <ArrowDown className="h-3 w-3 text-muted-foreground rotate-[-90deg]" />
                          <Badge variant="outline">{movement.to}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{movement.reference}</TableCell>
                      <TableCell className="text-sm">{movement.user}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Batch ID</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Target / Actual</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRefillBatches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell className="font-medium">{batch.id}</TableCell>
                      <TableCell>{batch.size}</TableCell>
                      <TableCell>
                        {batch.targetCount}
                        {batch.actualCount !== undefined && ` / ${batch.actualCount}`}
                      </TableCell>
                      <TableCell>
                        <Badge variant={batchStatusConfig[batch.status]?.variant || 'default'}>
                          {batchStatusConfig[batch.status]?.label || batch.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{batch.operator}</TableCell>
                      <TableCell className="text-sm">{formatDate(batch.startedAt)}</TableCell>
                      <TableCell className="text-sm">
                        {batch.completedAt ? formatDate(batch.completedAt) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tanks" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {mockTanks.map((tank) => (
              <Card key={tank.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {tank.name}
                    <Badge variant={tank.currentLevel / tank.capacity < 0.3 ? 'warning' : 'success'}>
                      {Math.round((tank.currentLevel / tank.capacity) * 100)}% Full
                    </Badge>
                  </CardTitle>
                  <CardDescription>Last reading: {formatDate(tank.lastReading)}</CardDescription>
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
                      <span>{tank.currentLevel.toLocaleString()} L</span>
                      <span className="text-muted-foreground">
                        of {tank.capacity.toLocaleString()} L capacity
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
