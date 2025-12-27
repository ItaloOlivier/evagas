'use client';

import { useState } from 'react';
import { Plus, Truck, User, MapPin, Clock, MoreHorizontal, Play, CheckCircle } from 'lucide-react';
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

// Mock data
const mockRuns = [
  {
    id: 'RUN-2024-001',
    date: '2024-01-16',
    status: 'in_progress',
    vehicle: { registration: 'GH 123 GP', name: 'Truck 1' },
    driver: { name: 'John Doe', phone: '+27 82 123 4567' },
    stops: [
      { order: 1, customer: 'ABC Corporation', site: 'Main Office', status: 'completed', eta: '08:00' },
      { order: 2, customer: 'XYZ Industries', site: 'Warehouse A', status: 'in_progress', eta: '09:30' },
      { order: 3, customer: 'Quick Gas Ltd', site: 'Distribution Center', status: 'pending', eta: '11:00' },
    ],
  },
  {
    id: 'RUN-2024-002',
    date: '2024-01-16',
    status: 'ready',
    vehicle: { registration: 'GH 456 GP', name: 'Truck 2' },
    driver: { name: 'Mike Smith', phone: '+27 82 234 5678' },
    stops: [
      { order: 1, customer: 'Metro Restaurant', site: 'Downtown Branch', status: 'pending', eta: '08:30' },
      { order: 2, customer: 'City Bakery', site: 'Production Facility', status: 'pending', eta: '10:00' },
    ],
  },
  {
    id: 'RUN-2024-003',
    date: '2024-01-16',
    status: 'planned',
    vehicle: { registration: 'GH 789 GP', name: 'Truck 3' },
    driver: null,
    stops: [
      { order: 1, customer: 'Hotel Grand', site: 'Kitchen', status: 'pending', eta: '09:00' },
    ],
  },
];

const mockVehicles = [
  { id: '1', registration: 'GH 123 GP', name: 'Truck 1', type: 'delivery', capacity: '2000kg', status: 'active', currentRun: 'RUN-2024-001' },
  { id: '2', registration: 'GH 456 GP', name: 'Truck 2', type: 'delivery', capacity: '2000kg', status: 'active', currentRun: 'RUN-2024-002' },
  { id: '3', registration: 'GH 789 GP', name: 'Truck 3', type: 'delivery', capacity: '1500kg', status: 'available', currentRun: null },
  { id: '4', registration: 'GH 101 GP', name: 'Van 1', type: 'collection', capacity: '500kg', status: 'maintenance', currentRun: null },
];

const mockDrivers = [
  { id: '1', name: 'John Doe', phone: '+27 82 123 4567', license: 'C1', status: 'on_duty', currentRun: 'RUN-2024-001' },
  { id: '2', name: 'Mike Smith', phone: '+27 82 234 5678', license: 'C1', status: 'on_duty', currentRun: 'RUN-2024-002' },
  { id: '3', name: 'Peter Jones', phone: '+27 82 345 6789', license: 'C', status: 'available', currentRun: null },
  { id: '4', name: 'David Brown', phone: '+27 82 456 7890', license: 'C1', status: 'off_duty', currentRun: null },
];

const runStatusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' }> = {
  planned: { label: 'Planned', variant: 'secondary' },
  ready: { label: 'Ready', variant: 'default' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
};

const stopStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-gray-500' },
  in_progress: { label: 'In Progress', color: 'text-blue-600' },
  completed: { label: 'Completed', color: 'text-green-600' },
  failed: { label: 'Failed', color: 'text-red-600' },
};

export default function SchedulePage() {
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
            <div className="text-2xl font-bold">{mockRuns.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockRuns.filter((r) => r.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Vehicles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockVehicles.filter((v) => v.status === 'available').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available Drivers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockDrivers.filter((d) => d.status === 'available').length}
            </div>
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
          {mockRuns.map((run) => (
            <Card key={run.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <CardTitle>{run.id}</CardTitle>
                    <Badge variant={runStatusConfig[run.status]?.variant || 'default'}>
                      {runStatusConfig[run.status]?.label || run.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {run.status === 'ready' && (
                      <Button size="sm">
                        <Play className="mr-2 h-4 w-4" />
                        Start Run
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
                        <DropdownMenuItem className="text-destructive">Cancel Run</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <CardDescription>
                  <div className="flex items-center gap-6 mt-2">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      {run.vehicle ? `${run.vehicle.name} (${run.vehicle.registration})` : 'No vehicle assigned'}
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {run.driver ? `${run.driver.name}` : 'No driver assigned'}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {run.stops.length} stops
                    </div>
                  </div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {run.stops.map((stop, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {stop.order}
                        </div>
                        <div>
                          <p className="font-medium">{stop.customer}</p>
                          <p className="text-sm text-muted-foreground">{stop.site}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          ETA: {stop.eta}
                        </div>
                        <span className={stopStatusConfig[stop.status]?.color}>
                          {stop.status === 'completed' && <CheckCircle className="h-5 w-5" />}
                          {stop.status !== 'completed' && stopStatusConfig[stop.status]?.label}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="vehicles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fleet Vehicles</CardTitle>
              <CardDescription>Manage your delivery fleet</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Current Run</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockVehicles.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">{vehicle.name}</TableCell>
                      <TableCell>{vehicle.registration}</TableCell>
                      <TableCell className="capitalize">{vehicle.type}</TableCell>
                      <TableCell>{vehicle.capacity}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            vehicle.status === 'active'
                              ? 'success'
                              : vehicle.status === 'available'
                              ? 'default'
                              : 'warning'
                          }
                        >
                          {vehicle.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {vehicle.currentRun || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Current Run</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockDrivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">{driver.name}</TableCell>
                      <TableCell>{driver.phone}</TableCell>
                      <TableCell>{driver.license}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            driver.status === 'on_duty'
                              ? 'success'
                              : driver.status === 'available'
                              ? 'default'
                              : 'secondary'
                          }
                        >
                          {driver.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {driver.currentRun || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
