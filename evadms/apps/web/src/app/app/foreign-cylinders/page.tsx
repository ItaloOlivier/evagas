'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Package,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  TrendingDown,
  Search,
  Filter,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { foreignCylindersApi } from '@/lib/api';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive'; icon: React.ElementType }> = {
  pending_intake: { label: 'Pending Intake', variant: 'warning', icon: Clock },
  received: { label: 'Received', variant: 'default', icon: Package },
  quarantined: { label: 'Quarantined', variant: 'secondary', icon: AlertTriangle },
  decanting: { label: 'Decanting', variant: 'default', icon: TrendingDown },
  decanted: { label: 'Decanted', variant: 'success', icon: CheckCircle },
  rejected: { label: 'Rejected', variant: 'destructive', icon: XCircle },
  returned: { label: 'Returned', variant: 'secondary', icon: Package },
  scrapped: { label: 'Scrapped', variant: 'destructive', icon: XCircle },
};

const brandLabels: Record<string, string> = {
  afrox: 'Afrox',
  total: 'Total',
  easigas: 'Easigas',
  oryx: 'Oryx',
  unknown: 'Unknown',
  other: 'Other',
};

const sizeLabels: Record<string, string> = {
  kg9: '9kg',
  kg14: '14kg',
  kg19: '19kg',
  kg48: '48kg',
};

const varianceStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  acceptable: { label: 'Acceptable', variant: 'success' },
  investigation_required: { label: 'Investigation Required', variant: 'warning' },
  escalated: { label: 'Escalated', variant: 'destructive' },
  resolved: { label: 'Resolved', variant: 'secondary' },
};

export default function ForeignCylindersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('cylinders');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCylinder, setSelectedCylinder] = useState<any>(null);
  const [showIntakeDialog, setShowIntakeDialog] = useState(false);

  // Queries
  const { data: cylindersData, isLoading: cylindersLoading } = useQuery({
    queryKey: ['foreign-cylinders', statusFilter, searchQuery],
    queryFn: () => foreignCylindersApi.list({
      status: statusFilter || undefined,
      search: searchQuery || undefined,
      limit: 50,
    }).then(res => res.data),
  });

  const { data: pendingIntake, isLoading: pendingLoading } = useQuery({
    queryKey: ['foreign-cylinders-pending'],
    queryFn: () => foreignCylindersApi.pendingIntake().then(res => res.data),
  });

  const { data: decantBatches, isLoading: decantLoading } = useQuery({
    queryKey: ['decant-batches'],
    queryFn: () => foreignCylindersApi.decantBatches.list({ limit: 50 }).then(res => res.data),
  });

  const { data: violations, isLoading: violationsLoading } = useQuery({
    queryKey: ['violations'],
    queryFn: () => foreignCylindersApi.violations.list({ acknowledged: false, limit: 50 }).then(res => res.data),
  });

  // Mutations
  const completeIntakeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      foreignCylindersApi.completeIntake(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foreign-cylinders'] });
      queryClient.invalidateQueries({ queryKey: ['foreign-cylinders-pending'] });
      toast({ title: 'Success', description: 'Intake completed successfully' });
      setShowIntakeDialog(false);
      setSelectedCylinder(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to complete intake',
        variant: 'destructive',
      });
    },
  });

  const quarantineMutation = useMutation({
    mutationFn: (id: string) => foreignCylindersApi.quarantine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['foreign-cylinders'] });
      toast({ title: 'Success', description: 'Cylinder moved to quarantine' });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to quarantine cylinder',
        variant: 'destructive',
      });
    },
  });

  const cylinders = cylindersData?.data || [];
  const batches = decantBatches?.data || [];
  const violationsList = violations?.data || [];
  const pendingList = pendingIntake || [];

  // Calculate stats
  const totalPending = pendingList.length;
  const totalQuarantined = cylinders.filter((c: any) => c.status === 'quarantined').length;
  const totalDecanted = cylinders.filter((c: any) => c.status === 'decanted').length;
  const unresolvedViolations = violationsList.filter((v: any) => !v.acknowledged).length;

  const handleCompleteIntake = (cylinder: any) => {
    setSelectedCylinder(cylinder);
    setShowIntakeDialog(true);
  };

  const handleQuarantine = async (id: string) => {
    await quarantineMutation.mutateAsync(id);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Foreign Cylinders</h1>
          <p className="text-muted-foreground">
            Track and manage non-Oryx cylinders collected from customers
          </p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={totalPending > 0 ? 'border-yellow-300 bg-yellow-50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {totalPending > 0 && <Clock className="h-4 w-4 text-yellow-600" />}
              Pending Intake
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalPending}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting depot confirmation</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quarantined
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {cylindersLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalQuarantined}
            </div>
            <p className="text-xs text-muted-foreground">Ready for decanting</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Decanted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {cylindersLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalDecanted}
            </div>
            <p className="text-xs text-muted-foreground">Residual recovered</p>
          </CardContent>
        </Card>
        <Card className={unresolvedViolations > 0 ? 'border-red-300 bg-red-50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {unresolvedViolations > 0 && <AlertTriangle className="h-4 w-4 text-red-600" />}
              Violations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {violationsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : unresolvedViolations}
            </div>
            <p className="text-xs text-muted-foreground">Unacknowledged late intakes</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="cylinders">All Cylinders</TabsTrigger>
          <TabsTrigger value="pending">
            Pending Intake
            {totalPending > 0 && (
              <Badge variant="warning" className="ml-2">{totalPending}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="decanting">Decant Batches</TabsTrigger>
          <TabsTrigger value="violations">
            Violations
            {unresolvedViolations > 0 && (
              <Badge variant="destructive" className="ml-2">{unresolvedViolations}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cylinders" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Foreign Cylinder Registry</CardTitle>
                  <CardDescription>All foreign cylinders collected from customers</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search serial number..."
                      className="pl-8 w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter || 'all'} onValueChange={(val) => setStatusFilter(val === 'all' ? '' : val)}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {Object.entries(statusConfig).map(([value, config]) => (
                        <SelectItem key={value} value={value}>{config.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {cylindersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Serial</TableHead>
                      <TableHead>Est. Residual</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Collected</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cylinders.length > 0 ? (
                      cylinders.map((cylinder: any) => {
                        const StatusIcon = statusConfig[cylinder.status]?.icon || Package;
                        return (
                          <TableRow key={cylinder.id}>
                            <TableCell className="font-medium">{cylinder.cylinderRef}</TableCell>
                            <TableCell>{brandLabels[cylinder.brand] || cylinder.brand}</TableCell>
                            <TableCell>{sizeLabels[cylinder.cylinderSize] || cylinder.cylinderSize}</TableCell>
                            <TableCell className="font-mono text-sm">{cylinder.serialNumber}</TableCell>
                            <TableCell>{Number(cylinder.estimatedResidualKg).toFixed(2)} kg</TableCell>
                            <TableCell>
                              <Badge variant={statusConfig[cylinder.status]?.variant || 'default'} className="gap-1">
                                <StatusIcon className="h-3 w-3" />
                                {statusConfig[cylinder.status]?.label || cylinder.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{formatDate(cylinder.collectedAt)}</TableCell>
                            <TableCell className="text-sm">
                              {cylinder.collectedByDriver?.user?.firstName} {cylinder.collectedByDriver?.user?.lastName}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" title="View details">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                {cylinder.status === 'received' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleQuarantine(cylinder.id)}
                                    disabled={quarantineMutation.isPending}
                                  >
                                    Quarantine
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No foreign cylinders found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Depot Intake</CardTitle>
              <CardDescription>
                Foreign cylinders collected in field awaiting depot confirmation.
                All cylinders must be logged at depot the same day they are collected.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>Brand</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Serial</TableHead>
                      <TableHead>Gross Weight</TableHead>
                      <TableHead>Est. Residual</TableHead>
                      <TableHead>Collected</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingList.length > 0 ? (
                      pendingList.map((cylinder: any) => (
                        <TableRow key={cylinder.id}>
                          <TableCell className="font-medium">{cylinder.cylinderRef}</TableCell>
                          <TableCell>{brandLabels[cylinder.brand] || cylinder.brand}</TableCell>
                          <TableCell>{sizeLabels[cylinder.cylinderSize] || cylinder.cylinderSize}</TableCell>
                          <TableCell className="font-mono text-sm">{cylinder.serialNumber}</TableCell>
                          <TableCell>{Number(cylinder.grossWeightKg).toFixed(2)} kg</TableCell>
                          <TableCell>{Number(cylinder.estimatedResidualKg).toFixed(2)} kg</TableCell>
                          <TableCell className="text-sm">{formatDate(cylinder.collectedAt)}</TableCell>
                          <TableCell className="text-sm">
                            {cylinder.collectedByDriver?.user?.firstName} {cylinder.collectedByDriver?.user?.lastName}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleCompleteIntake(cylinder)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Complete Intake
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          No cylinders pending intake
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decanting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Decant Batches</CardTitle>
              <CardDescription>
                Residual LPG recovery batches with mass balance tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              {decantLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Batch Ref</TableHead>
                      <TableHead>Cylinders</TableHead>
                      <TableHead>Expected (kg)</TableHead>
                      <TableHead>Actual (kg)</TableHead>
                      <TableHead>Variance</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batches.length > 0 ? (
                      batches.map((batch: any) => {
                        const variancePercent = batch.variancePercent ? Number(batch.variancePercent) : 0;
                        const varianceClass = Math.abs(variancePercent) <= 2
                          ? 'text-green-600'
                          : Math.abs(variancePercent) <= 5
                            ? 'text-yellow-600'
                            : 'text-red-600';
                        return (
                          <TableRow key={batch.id}>
                            <TableCell className="font-medium">{batch.batchRef}</TableCell>
                            <TableCell>{batch.cylinderCount}</TableCell>
                            <TableCell>{Number(batch.expectedResidualKg).toFixed(2)}</TableCell>
                            <TableCell>
                              {batch.actualResidualKg ? Number(batch.actualResidualKg).toFixed(2) : '-'}
                            </TableCell>
                            <TableCell className={varianceClass}>
                              {batch.variancePercent ? `${variancePercent.toFixed(1)}%` : '-'}
                            </TableCell>
                            <TableCell>
                              <Badge variant={varianceStatusConfig[batch.varianceStatus]?.variant || 'default'}>
                                {varianceStatusConfig[batch.varianceStatus]?.label || batch.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {batch.operator?.firstName} {batch.operator?.lastName}
                            </TableCell>
                            <TableCell className="text-sm">{formatDate(batch.createdAt)}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No decant batches found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Intake Violations</CardTitle>
              <CardDescription>
                Late intake violations - cylinders not returned to depot on the same day
              </CardDescription>
            </CardHeader>
            <CardContent>
              {violationsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Violation Ref</TableHead>
                      <TableHead>Cylinder</TableHead>
                      <TableHead>Collected</TableHead>
                      <TableHead>Expected By</TableHead>
                      <TableHead>Actual Intake</TableHead>
                      <TableHead>Hours Overdue</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {violationsList.length > 0 ? (
                      violationsList.map((violation: any) => (
                        <TableRow key={violation.id}>
                          <TableCell className="font-medium">{violation.violationRef}</TableCell>
                          <TableCell>{violation.foreignCylinder?.cylinderRef}</TableCell>
                          <TableCell className="text-sm">{formatDate(violation.collectedAt)}</TableCell>
                          <TableCell className="text-sm">{formatDate(violation.expectedIntakeBy)}</TableCell>
                          <TableCell className="text-sm">
                            {violation.actualIntakeAt ? formatDate(violation.actualIntakeAt) : '-'}
                          </TableCell>
                          <TableCell className="text-red-600 font-medium">
                            {Number(violation.hoursOverdue).toFixed(1)}h
                          </TableCell>
                          <TableCell className="text-sm">
                            {violation.driver?.user?.firstName} {violation.driver?.user?.lastName}
                          </TableCell>
                          <TableCell>
                            <Badge variant={violation.acknowledged ? 'secondary' : 'destructive'}>
                              {violation.acknowledged ? 'Acknowledged' : 'Pending'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                          No violations found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Intake Dialog */}
      <Dialog open={showIntakeDialog} onOpenChange={setShowIntakeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Depot Intake</DialogTitle>
            <DialogDescription>
              Confirm this foreign cylinder has arrived at the depot.
              {selectedCylinder && (
                <div className="mt-2 p-2 bg-muted rounded">
                  <p><strong>Reference:</strong> {selectedCylinder.cylinderRef}</p>
                  <p><strong>Brand:</strong> {brandLabels[selectedCylinder.brand]}</p>
                  <p><strong>Size:</strong> {sizeLabels[selectedCylinder.cylinderSize]}</p>
                  <p><strong>Serial:</strong> {selectedCylinder.serialNumber}</p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowIntakeDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedCylinder) {
                  completeIntakeMutation.mutate({
                    id: selectedCylinder.id,
                    data: {},
                  });
                }
              }}
              disabled={completeIntakeMutation.isPending}
            >
              {completeIntakeMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              Confirm Intake
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
