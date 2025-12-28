'use client';

import { useState } from 'react';
import { Plus, Truck, User, MapPin, Clock, MoreHorizontal, Play, CheckCircle, Loader2 } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import {
  useScheduleRuns,
  useVehicles,
  useDrivers,
  useScheduleStats,
  useTransitionScheduleRun,
  useUpdateVehicle,
  type RunStatus,
  type VehicleStatus,
} from '@/hooks/use-schedule';

const vehicleTypeLabels: Record<string, string> = {
  bulk_tanker: 'Bulk Tanker',
  cylinder_truck: 'Cylinder Truck',
  van: 'Van',
  bakkie: 'Bakkie',
};

const runStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  planned: { label: 'Planned', variant: 'secondary' },
  ready: { label: 'Ready', variant: 'default' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'destructive' },
};

const stopStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-gray-500' },
  in_progress: { label: 'In Progress', color: 'text-blue-600' },
  completed: { label: 'Completed', color: 'text-green-600' },
  skipped: { label: 'Skipped', color: 'text-yellow-600' },
  failed: { label: 'Failed', color: 'text-red-600' },
};

const vehicleStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  available: { label: 'Available', variant: 'success' },
  in_use: { label: 'In Use', variant: 'warning' },
  maintenance: { label: 'Maintenance', variant: 'secondary' },
  out_of_service: { label: 'Out of Service', variant: 'destructive' },
};

export default function SchedulePage() {
  const { toast } = useToast();

  // Queries
  const { data: runsData, isLoading: runsLoading, error: runsError } = useScheduleRuns();
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles();
  const { data: drivers, isLoading: driversLoading } = useDrivers();
  const { data: stats } = useScheduleStats();

  // Mutations
  const transitionRun = useTransitionScheduleRun();
  const updateVehicle = useUpdateVehicle();

  const runs = runsData?.data || [];

  const handleStartRun = async (runId: string) => {
    try {
      await transitionRun.mutateAsync({ id: runId, status: 'in_progress' });
      toast({ title: 'Success', description: 'Run started successfully' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to start run',
        variant: 'destructive',
      });
    }
  };

  const handleCompleteRun = async (runId: string) => {
    try {
      await transitionRun.mutateAsync({ id: runId, status: 'completed' });
      toast({ title: 'Success', description: 'Run completed successfully' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to complete run',
        variant: 'destructive',
      });
    }
  };

  const handleCancelRun = async (runId: string) => {
    try {
      await transitionRun.mutateAsync({ id: runId, status: 'cancelled' });
      toast({ title: 'Success', description: 'Run cancelled' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to cancel run',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateVehicleStatus = async (vehicleId: string, status: VehicleStatus) => {
    try {
      await updateVehicle.mutateAsync({ id: vehicleId, status });
      toast({ title: 'Success', description: `Vehicle status updated to ${vehicleStatusConfig[status]?.label}` });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update vehicle',
        variant: 'destructive',
      });
    }
  };

  if (runsError) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load schedule</p>
          <p className="text-sm text-muted-foreground">
            {(runsError as any)?.message || 'Please try again later'}
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
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground">
            Manage delivery runs, vehicles, and drivers
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Run
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today's Runs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.todayRuns ?? runs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inProgressRuns ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Vehicles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.availableVehicles ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Drivers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeDrivers ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="runs">
        <TabsList>
          <TabsTrigger value="runs">Delivery Runs</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="drivers">Drivers</TabsTrigger>
        </TabsList>

        <TabsContent value="runs" className="space-y-4">
          {runsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : runs.length > 0 ? (
            runs.map((run) => (
              <Card key={run.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <CardTitle>{run.runNumber}</CardTitle>
                      <Badge variant={runStatusConfig[run.status]?.variant || 'default'}>
                        {runStatusConfig[run.status]?.label || run.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {run.status === 'ready' && (
                        <Button size="sm" onClick={() => handleStartRun(run.id)}>
                          <Play className="mr-2 h-4 w-4" />
                          Start Run
                        </Button>
                      )}
                      {run.status === 'in_progress' && (
                        <Button size="sm" variant="outline" onClick={() => handleCompleteRun(run.id)}>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Complete
                        </Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit Run</DropdownMenuItem>
                          <DropdownMenuItem>Add Stop</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleCancelRun(run.id)}
                          >
                            Cancel Run
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  <CardDescription>
                    <div className="flex items-center gap-6 mt-2">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4" />
                        {run.vehicle
                          ? `${vehicleTypeLabels[run.vehicle.type] || run.vehicle.type} (${run.vehicle.registrationNumber})`
                          : 'No vehicle assigned'}
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {run.driver
                          ? `${run.driver.user?.firstName} ${run.driver.user?.lastName}`
                          : 'No driver assigned'}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {run.stops?.length || 0} stops
                      </div>
                    </div>
                  </CardDescription>
                </CardHeader>
                {run.stops && run.stops.length > 0 && (
                  <CardContent>
                    <div className="space-y-3">
                      {run.stops.map((stop) => (
                        <div
                          key={stop.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                              {stop.sequence}
                            </div>
                            <div>
                              <p className="font-medium">{stop.order?.customer?.name || 'Unknown'}</p>
                              <p className="text-sm text-muted-foreground">
                                {stop.order?.site?.name || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            {stop.estimatedArrival && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                ETA: {new Date(stop.estimatedArrival).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                            <span className={stopStatusConfig[stop.status]?.color}>
                              {stop.status === 'completed' ? (
                                <CheckCircle className="h-5 w-5" />
                              ) : (
                                stopStatusConfig[stop.status]?.label || stop.status
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-muted-foreground">No runs scheduled</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="vehicles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fleet Vehicles</CardTitle>
              <CardDescription>Manage your delivery fleet</CardDescription>
            </CardHeader>
            <CardContent>
              {vehiclesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Registration</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Make / Model</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Next Service</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicles && vehicles.length > 0 ? (
                      vehicles.map((vehicle) => (
                        <TableRow key={vehicle.id}>
                          <TableCell className="font-medium">{vehicle.registrationNumber}</TableCell>
                          <TableCell>{vehicleTypeLabels[vehicle.type] || vehicle.type}</TableCell>
                          <TableCell>
                            {vehicle.make && vehicle.model
                              ? `${vehicle.make} ${vehicle.model}`
                              : '-'}
                          </TableCell>
                          <TableCell>{vehicle.capacity ? `${vehicle.capacity}kg` : '-'}</TableCell>
                          <TableCell>
                            <Badge variant={vehicleStatusConfig[vehicle.status]?.variant || 'default'}>
                              {vehicleStatusConfig[vehicle.status]?.label || vehicle.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {vehicle.nextServiceDate
                              ? formatDate(vehicle.nextServiceDate)
                              : '-'}
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
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                <DropdownMenuItem>Edit Vehicle</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-xs text-muted-foreground">Status</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleUpdateVehicleStatus(vehicle.id, 'available')}>
                                  Mark Available
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateVehicleStatus(vehicle.id, 'maintenance')}>
                                  Set to Maintenance
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateVehicleStatus(vehicle.id, 'out_of_service')}>
                                  Mark Out of Service
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No vehicles found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Drivers</CardTitle>
              <CardDescription>Manage your delivery drivers</CardDescription>
            </CardHeader>
            <CardContent>
              {driversLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Driver</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>License</TableHead>
                      <TableHead>License Expiry</TableHead>
                      <TableHead>PDP</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {drivers && drivers.length > 0 ? (
                      drivers.map((driver) => (
                        <TableRow key={driver.id}>
                          <TableCell className="font-medium">
                            {driver.user?.firstName} {driver.user?.lastName}
                          </TableCell>
                          <TableCell>{driver.user?.phone || '-'}</TableCell>
                          <TableCell>{driver.licenseNumber}</TableCell>
                          <TableCell>{formatDate(driver.licenseExpiry)}</TableCell>
                          <TableCell>
                            {driver.pdpNumber ? (
                              <span>
                                {driver.pdpNumber}
                                {driver.pdpExpiry && (
                                  <span className="text-muted-foreground text-xs block">
                                    Exp: {formatDate(driver.pdpExpiry)}
                                  </span>
                                )}
                              </span>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                driver.status === 'active'
                                  ? 'success'
                                  : driver.status === 'inactive'
                                  ? 'secondary'
                                  : 'destructive'
                              }
                            >
                              {driver.status}
                            </Badge>
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
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                <DropdownMenuItem>Edit Driver</DropdownMenuItem>
                                <DropdownMenuItem>View Run History</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No drivers found
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
    </div>
  );
}
