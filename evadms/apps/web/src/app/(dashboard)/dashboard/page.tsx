'use client';

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
import { formatCurrency } from '@/lib/utils';
import {
  ShoppingCart,
  Truck,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package,
  Loader2,
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
import {
  useDashboardStats,
  useWeeklyOverview,
  useAlerts,
  useRecentOrders,
  useCylinderInventory,
} from '@/hooks/use-dashboard';

function getStatusBadge(status: string) {
  const variants: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'destructive'> = {
    created: 'secondary',
    scheduled: 'default',
    dispatched: 'warning',
    in_transit: 'warning',
    delivered: 'success',
    cancelled: 'destructive',
  };
  const labels: Record<string, string> = {
    created: 'Created',
    scheduled: 'Scheduled',
    dispatched: 'Dispatched',
    in_transit: 'In Transit',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
}

function getAlertStyles(severity: string) {
  switch (severity) {
    case 'error':
      return {
        bg: 'bg-red-50 border-red-200',
        icon: 'text-red-600',
        title: 'text-red-800',
        text: 'text-red-700',
      };
    case 'warning':
      return {
        bg: 'bg-yellow-50 border-yellow-200',
        icon: 'text-yellow-600',
        title: 'text-yellow-800',
        text: 'text-yellow-700',
      };
    default:
      return {
        bg: 'bg-blue-50 border-blue-200',
        icon: 'text-blue-600',
        title: 'text-blue-800',
        text: 'text-blue-700',
      };
  }
}

function getAlertIcon(type: string) {
  switch (type) {
    case 'low_stock':
      return AlertTriangle;
    case 'compliance':
      return CheckCircle;
    default:
      return Clock;
  }
}

export default function DashboardPage() {
  // Queries
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: weeklyData, isLoading: weeklyLoading } = useWeeklyOverview();
  const { data: alerts, isLoading: alertsLoading } = useAlerts();
  const { data: recentOrders, isLoading: ordersLoading } = useRecentOrders();
  const { data: inventory, isLoading: inventoryLoading } = useCylinderInventory();

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
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.todayOrders ?? 0}
            </div>
            {!statsLoading && stats?.ordersChange !== undefined && (
              <p className="text-xs text-muted-foreground">
                <span className={stats.ordersChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {stats.ordersChange >= 0 ? '+' : ''}{stats.ordersChange}%
                </span>{' '}
                from yesterday
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deliveries Today</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.todayDeliveries ?? 0}
            </div>
            {!statsLoading && (
              <p className="text-xs text-muted-foreground">
                {stats?.deliveriesInProgress ?? 0} in progress, {stats?.deliveriesCompleted ?? 0} completed
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Full Cylinders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.fullCylinders ?? 0}
            </div>
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
            <div className="text-2xl font-bold">
              {statsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : formatCurrency(stats?.todayRevenue ?? 0)}
            </div>
            {!statsLoading && stats?.revenueChange !== undefined && (
              <p className="text-xs text-muted-foreground">
                <span className={stats.revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {stats.revenueChange >= 0 ? '+' : ''}{stats.revenueChange}%
                </span>{' '}
                from yesterday
              </p>
            )}
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
              {weeklyLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : weeklyData && weeklyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="orders"
                      stackId="1"
                      stroke="#E63E2D"
                      fill="#E63E2D"
                      fillOpacity={0.6}
                      name="Orders"
                    />
                    <Area
                      type="monotone"
                      dataKey="deliveries"
                      stackId="2"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.6}
                      name="Deliveries"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No data available
                </div>
              )}
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
            {alertsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-4">
                {alerts.slice(0, 5).map((alert) => {
                  const styles = getAlertStyles(alert.severity);
                  const Icon = getAlertIcon(alert.type);
                  return (
                    <div
                      key={alert.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border ${styles.bg}`}
                    >
                      <Icon className={`h-5 w-5 mt-0.5 ${styles.icon}`} />
                      <div>
                        <p className={`text-sm font-medium ${styles.title}`}>{alert.title}</p>
                        <p className={`text-xs ${styles.text}`}>{alert.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">All Clear</p>
                  <p className="text-xs text-green-700">No alerts at this time</p>
                </div>
              </div>
            )}
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
            {ordersLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentOrders && recentOrders.length > 0 ? (
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
                  {recentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(order.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent orders
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory summary */}
        <Card>
          <CardHeader>
            <CardTitle>Cylinder Inventory</CardTitle>
            <CardDescription>Current stock levels by size</CardDescription>
          </CardHeader>
          <CardContent>
            {inventoryLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : inventory && inventory.length > 0 ? (
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
                  {inventory.map((item) => (
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
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No inventory data
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
