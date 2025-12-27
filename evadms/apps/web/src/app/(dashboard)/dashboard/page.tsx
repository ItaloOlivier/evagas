'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { inventoryApi, ordersApi, reportsApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Cylinder,
  ShoppingCart,
  Truck,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Mock data for demo
const mockChartData = [
  { name: 'Mon', orders: 12, deliveries: 10 },
  { name: 'Tue', orders: 19, deliveries: 15 },
  { name: 'Wed', orders: 15, deliveries: 18 },
  { name: 'Thu', orders: 22, deliveries: 20 },
  { name: 'Fri', orders: 28, deliveries: 25 },
  { name: 'Sat', orders: 18, deliveries: 22 },
  { name: 'Sun', orders: 8, deliveries: 10 },
];

const mockRecentOrders = [
  { id: 'ORD-2024-0156', customer: 'ABC Corporation', status: 'dispatched', total: 4500 },
  { id: 'ORD-2024-0155', customer: 'XYZ Industries', status: 'scheduled', total: 2800 },
  { id: 'ORD-2024-0154', customer: 'Quick Gas Ltd', status: 'delivered', total: 6200 },
  { id: 'ORD-2024-0153', customer: 'Metro Restaurant', status: 'created', total: 1500 },
  { id: 'ORD-2024-0152', customer: 'City Bakery', status: 'delivered', total: 3200 },
];

const mockInventorySummary = [
  { size: '9kg', full: 245, empty: 120, issued: 45, atCustomer: 380 },
  { size: '14kg', full: 180, empty: 95, issued: 30, atCustomer: 220 },
  { size: '19kg', full: 150, empty: 80, issued: 25, atCustomer: 180 },
  { size: '48kg', full: 85, empty: 45, issued: 15, atCustomer: 120 },
];

function getStatusBadge(status: string) {
  const variants: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
    created: 'secondary',
    scheduled: 'default',
    dispatched: 'warning',
    delivered: 'success',
    cancelled: 'destructive',
  };
  return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+12%</span> from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deliveries Today</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18</div>
            <p className="text-xs text-muted-foreground">
              6 in progress, 12 completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Full Cylinders</CardTitle>
            <Cylinder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">660</div>
            <p className="text-xs text-muted-foreground">
              Across all sizes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(45680)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-500">+8%</span> from yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and tables */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Order chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Weekly Overview</CardTitle>
            <CardDescription>Orders vs deliveries this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="orders"
                    stackId="1"
                    stroke="#E63E2D"
                    fill="#E63E2D"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="deliveries"
                    stackId="2"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Alerts</CardTitle>
            <CardDescription>Items requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Low Stock Alert</p>
                  <p className="text-xs text-yellow-700">9kg cylinders below minimum (120 remaining)</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Pending Refill Batch</p>
                  <p className="text-xs text-blue-700">Batch #RF-2024-045 awaiting QC approval</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">Compliance Check Due</p>
                  <p className="text-xs text-green-700">Monthly vehicle inspection - 2 days remaining</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent orders and inventory */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest orders from customers</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockRecentOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{order.customer}</TableCell>
                    <TableCell>{getStatusBadge(order.status)}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(order.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Inventory summary */}
        <Card>
          <CardHeader>
            <CardTitle>Cylinder Inventory</CardTitle>
            <CardDescription>Current stock levels by size</CardDescription>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockInventorySummary.map((item) => (
                  <TableRow key={item.size}>
                    <TableCell className="font-medium">{item.size}</TableCell>
                    <TableCell className="text-right text-green-600">
                      {item.full}
                    </TableCell>
                    <TableCell className="text-right text-gray-500">
                      {item.empty}
                    </TableCell>
                    <TableCell className="text-right text-blue-600">
                      {item.issued}
                    </TableCell>
                    <TableCell className="text-right text-orange-600">
                      {item.atCustomer}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
