'use client';

import { useState } from 'react';
import { Plus, Search, MoreHorizontal, Eye, Truck, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatDate } from '@/lib/utils';

// Mock data
const mockOrders = [
  {
    id: 'ORD-2024-0156',
    customer: 'ABC Corporation',
    site: 'Main Office',
    status: 'dispatched',
    items: [
      { product: '9kg LPG', qty: 20 },
      { product: '19kg LPG', qty: 10 },
    ],
    total: 4500,
    createdAt: '2024-01-15T10:30:00Z',
    deliveryDate: '2024-01-16',
    driver: 'John Doe',
    vehicle: 'GH 123 GP',
  },
  {
    id: 'ORD-2024-0155',
    customer: 'XYZ Industries',
    site: 'Warehouse A',
    status: 'scheduled',
    items: [{ product: '48kg LPG', qty: 15 }],
    total: 2800,
    createdAt: '2024-01-15T09:15:00Z',
    deliveryDate: '2024-01-16',
    driver: 'Mike Smith',
    vehicle: 'GH 456 GP',
  },
  {
    id: 'ORD-2024-0154',
    customer: 'Quick Gas Ltd',
    site: 'Distribution Center',
    status: 'delivered',
    items: [
      { product: '9kg LPG', qty: 50 },
      { product: '14kg LPG', qty: 30 },
    ],
    total: 6200,
    createdAt: '2024-01-14T14:00:00Z',
    deliveryDate: '2024-01-15',
    driver: 'Peter Jones',
    vehicle: 'GH 789 GP',
  },
  {
    id: 'ORD-2024-0153',
    customer: 'Metro Restaurant',
    site: 'Downtown Branch',
    status: 'created',
    items: [{ product: '19kg LPG', qty: 8 }],
    total: 1500,
    createdAt: '2024-01-15T11:45:00Z',
    deliveryDate: '2024-01-17',
    driver: null,
    vehicle: null,
  },
  {
    id: 'ORD-2024-0152',
    customer: 'City Bakery',
    site: 'Production Facility',
    status: 'closed',
    items: [{ product: '14kg LPG', qty: 25 }],
    total: 3200,
    createdAt: '2024-01-13T08:30:00Z',
    deliveryDate: '2024-01-14',
    driver: 'John Doe',
    vehicle: 'GH 123 GP',
  },
];

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  created: { label: 'Created', variant: 'secondary' },
  scheduled: { label: 'Scheduled', variant: 'default' },
  prepared: { label: 'Prepared', variant: 'default' },
  loading: { label: 'Loading', variant: 'warning' },
  dispatched: { label: 'Dispatched', variant: 'warning' },
  in_transit: { label: 'In Transit', variant: 'warning' },
  arrived: { label: 'Arrived', variant: 'default' },
  delivered: { label: 'Delivered', variant: 'success' },
  partial_delivery: { label: 'Partial', variant: 'warning' },
  failed: { label: 'Failed', variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
  closed: { label: 'Closed', variant: 'success' },
};

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = mockOrders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const ordersByStatus = {
    active: mockOrders.filter((o) => ['created', 'scheduled', 'prepared', 'loading', 'dispatched', 'in_transit', 'arrived'].includes(o.status)),
    delivered: mockOrders.filter((o) => o.status === 'delivered'),
    closed: mockOrders.filter((o) => ['closed', 'cancelled', 'failed'].includes(o.status)),
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage customer orders and track deliveries
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Order
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersByStatus.active.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Transit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockOrders.filter((o) => o.status === 'dispatched').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Delivered Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ordersByStatus.delivered.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Scheduling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockOrders.filter((o) => o.status === 'created').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="created">Created</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="dispatched">Dispatched</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders table */}
      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer / Site</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Driver / Vehicle</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{order.customer}</p>
                      <p className="text-sm text-muted-foreground">{order.site}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {order.items.map((i) => `${i.qty}x ${i.product}`).join(', ')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(order.total)}</TableCell>
                  <TableCell>{formatDate(order.deliveryDate)}</TableCell>
                  <TableCell>
                    <Badge variant={statusConfig[order.status]?.variant || 'default'}>
                      {statusConfig[order.status]?.label || order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {order.driver ? (
                      <div className="flex items-center gap-1">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm">{order.driver}</p>
                          <p className="text-xs text-muted-foreground">{order.vehicle}</p>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>Edit Order</DropdownMenuItem>
                        <DropdownMenuItem>Assign Driver</DropdownMenuItem>
                        <DropdownMenuItem>Update Status</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Cancel Order
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
