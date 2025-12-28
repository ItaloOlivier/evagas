'use client';

import { useState, useMemo } from 'react';
import { Download, Calendar, FileBarChart, TrendingUp, Truck, Package, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import {
  useSalesReport,
  useDeliveryReport,
  useInventoryReport,
} from '@/hooks/use-reports';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#E63E2D', '#F4776A', '#10b981', '#3b82f6'];

const reportTypes = [
  {
    id: 'sales',
    name: 'Sales Report',
    description: 'Revenue, orders, and product analysis',
    icon: TrendingUp,
  },
  {
    id: 'delivery',
    name: 'Delivery Report',
    description: 'Delivery performance and completion rates',
    icon: Truck,
  },
  {
    id: 'inventory',
    name: 'Inventory Report',
    description: 'Stock levels, movements, and turnover',
    icon: Package,
  },
  {
    id: 'customer',
    name: 'Customer Report',
    description: 'Customer analysis and order history',
    icon: Users,
  },
  {
    id: 'compliance',
    name: 'Compliance Report',
    description: 'Checklists, audits, and safety records',
    icon: FileBarChart,
  },
];

function getDateRange(range: string): { startDate: string; endDate: string } {
  const now = new Date();
  const end = now.toISOString().split('T')[0];
  let start = new Date();

  switch (range) {
    case 'last_7_days':
      start.setDate(start.getDate() - 7);
      break;
    case 'last_30_days':
      start.setDate(start.getDate() - 30);
      break;
    case 'last_90_days':
      start.setDate(start.getDate() - 90);
      break;
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'last_month':
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: start.toISOString().split('T')[0], endDate: lastMonthEnd.toISOString().split('T')[0] };
    case 'this_year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }

  return { startDate: start.toISOString().split('T')[0], endDate: end };
}

export default function ReportsPage() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState('last_30_days');
  const [customReportType, setCustomReportType] = useState('sales');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [customFormat, setCustomFormat] = useState('pdf');

  const dateParams = useMemo(() => getDateRange(dateRange), [dateRange]);

  // Queries
  const { data: salesReport, isLoading: salesLoading } = useSalesReport(dateParams);
  const { data: deliveryReport, isLoading: deliveryLoading } = useDeliveryReport(dateParams);
  const { data: inventoryReport, isLoading: inventoryLoading } = useInventoryReport();

  const isLoading = salesLoading || deliveryLoading || inventoryLoading;

  // Format data for charts
  const salesChartData = salesReport?.dailyRevenue?.slice(-30).map((d) => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    revenue: d.revenue,
    orders: d.orders,
  })) || [];

  const productMixData = salesReport?.byProduct?.slice(0, 5).map((p) => ({
    name: p.productName,
    value: p.percentage,
  })) || [];

  const deliveryChartData = deliveryReport?.dailyDeliveries?.slice(-7).map((d) => ({
    day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    completed: d.successful,
    failed: d.failed,
  })) || [];

  // Stats from reports
  const totalRevenue = salesReport?.summary?.totalRevenue ?? 0;
  const totalOrders = salesReport?.summary?.totalOrders ?? 0;
  const avgOrderValue = salesReport?.summary?.averageOrderValue ?? 0;
  const revenueChange = salesReport?.summary?.revenueChange ?? 0;
  const successRate = deliveryReport?.summary?.successRate ?? 0;

  const handleGenerateReport = () => {
    if (!customStartDate || !customEndDate) {
      toast({
        title: 'Error',
        description: 'Please select both start and end dates',
        variant: 'destructive',
      });
      return;
    }
    toast({
      title: 'Generating Report',
      description: `Generating ${customReportType} report in ${customFormat.toUpperCase()} format...`,
    });
    // TODO: Call API to generate report
  };

  const handleDownloadReport = (reportId: string, format: string) => {
    toast({
      title: 'Downloading Report',
      description: `Preparing ${reportId} report in ${format.toUpperCase()} format...`,
    });
    // TODO: Call API to download report
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Analytics and reporting for your depot operations
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last_7_days">Last 7 Days</SelectItem>
              <SelectItem value="last_30_days">Last 30 Days</SelectItem>
              <SelectItem value="last_90_days">Last 90 Days</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : formatCurrency(totalRevenue)}
            </div>
            {!isLoading && revenueChange !== 0 && (
              <p className="text-xs text-muted-foreground">
                <span className={revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {revenueChange >= 0 ? '+' : ''}{revenueChange.toFixed(1)}%
                </span>{' '}
                vs previous period
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalOrders}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Delivery Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : `${successRate.toFixed(1)}%`}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : formatCurrency(avgOrderValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="generate">Generate Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Charts row */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Daily revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {salesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : salesChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" fontSize={12} />
                        <YAxis tickFormatter={(v) => `R${v / 1000}k`} fontSize={12} />
                        <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#E63E2D"
                          fill="#E63E2D"
                          fillOpacity={0.3}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No revenue data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Mix</CardTitle>
                <CardDescription>Sales distribution by product</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {salesLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : productMixData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={productMixData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {productMixData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No product data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Delivery Performance</CardTitle>
              <CardDescription>Daily completed vs failed deliveries this week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {deliveryLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : deliveryChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deliveryChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completed" name="Completed" fill="#10b981" />
                      <Bar dataKey="failed" name="Failed" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No delivery data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reportTypes.map((report) => (
              <Card key={report.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <report.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{report.name}</CardTitle>
                      <CardDescription>{report.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownloadReport(report.id, 'pdf')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownloadReport(report.id, 'xlsx')}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Custom Report</CardTitle>
              <CardDescription>Generate a custom report with specific parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>Report Type</Label>
                  <Select value={customReportType} onValueChange={setCustomReportType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                      <SelectItem value="customer">Customer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select value={customFormat} onValueChange={setCustomFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="xlsx">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={handleGenerateReport}>
                  <Download className="mr-2 h-4 w-4" />
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
