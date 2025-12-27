'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MapPin, Clock, Package, ChevronRight, Play, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth';

// Mock data
const mockRuns = [
  {
    id: 'RUN-2024-001',
    status: 'in_progress',
    vehicle: 'GH 123 GP',
    totalStops: 5,
    completedStops: 2,
    currentStop: {
      customer: 'XYZ Industries',
      address: '123 Industrial Road, Johannesburg',
      eta: '09:30',
    },
    stops: [
      { id: '1', customer: 'ABC Corporation', status: 'completed', items: '20x 9kg, 10x 19kg' },
      { id: '2', customer: 'Quick Gas Ltd', status: 'completed', items: '50x 9kg' },
      { id: '3', customer: 'XYZ Industries', status: 'current', items: '15x 48kg' },
      { id: '4', customer: 'Metro Restaurant', status: 'pending', items: '8x 19kg' },
      { id: '5', customer: 'City Bakery', status: 'pending', items: '25x 14kg' },
    ],
  },
  {
    id: 'RUN-2024-002',
    status: 'ready',
    vehicle: 'GH 123 GP',
    totalStops: 3,
    completedStops: 0,
    stops: [
      { id: '1', customer: 'Hotel Grand', status: 'pending', items: '30x 9kg' },
      { id: '2', customer: 'Shopping Mall', status: 'pending', items: '40x 14kg' },
      { id: '3', customer: 'Factory A', status: 'pending', items: '20x 48kg' },
    ],
  },
];

const statusConfig = {
  ready: { label: 'Ready to Start', color: 'bg-blue-500', textColor: 'text-blue-600' },
  in_progress: { label: 'In Progress', color: 'bg-orange-500', textColor: 'text-orange-600' },
  completed: { label: 'Completed', color: 'bg-green-500', textColor: 'text-green-600' },
};

const stopStatusConfig = {
  pending: { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-100' },
  current: { icon: MapPin, color: 'text-orange-500', bg: 'bg-orange-100' },
  completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' },
};

export default function RunsPage() {
  const { user } = useAuthStore();

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="pt-2">
        <p className="text-muted-foreground">Good morning,</p>
        <h1 className="text-2xl font-bold">{user?.firstName} {user?.lastName}</h1>
      </div>

      {/* Today's summary */}
      <Card className="bg-eva-primary text-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Today's Deliveries</p>
              <p className="text-3xl font-bold">8</p>
            </div>
            <div className="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center">
              <Package className="h-8 w-8" />
            </div>
          </div>
          <div className="mt-4 flex gap-6">
            <div>
              <p className="text-white/80 text-xs">Completed</p>
              <p className="text-xl font-semibold">2</p>
            </div>
            <div>
              <p className="text-white/80 text-xs">Remaining</p>
              <p className="text-xl font-semibold">6</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Runs list */}
      <div className="space-y-3">
        <h2 className="font-semibold text-lg">My Runs</h2>

        {mockRuns.map((run) => (
          <Card key={run.id} className="overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('h-2 w-2 rounded-full', statusConfig[run.status].color)} />
                  <CardTitle className="text-base">{run.id}</CardTitle>
                </div>
                <span className={cn('text-sm font-medium', statusConfig[run.status].textColor)}>
                  {statusConfig[run.status].label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Vehicle: {run.vehicle} • {run.completedStops}/{run.totalStops} stops
              </p>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              {/* Current stop highlight for in-progress runs */}
              {run.status === 'in_progress' && run.currentStop && (
                <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-xl">
                  <p className="text-xs text-orange-600 font-medium mb-1">CURRENT STOP</p>
                  <p className="font-medium">{run.currentStop.customer}</p>
                  <p className="text-sm text-muted-foreground">{run.currentStop.address}</p>
                  <p className="text-sm text-muted-foreground mt-1">ETA: {run.currentStop.eta}</p>
                </div>
              )}

              {/* Stops preview */}
              <div className="space-y-2">
                {run.stops.slice(0, 3).map((stop) => {
                  const config = stopStatusConfig[stop.status];
                  const Icon = config.icon;
                  return (
                    <div
                      key={stop.id}
                      className={cn(
                        'flex items-center gap-3 p-2 rounded-lg',
                        stop.status === 'current' && 'bg-orange-50'
                      )}
                    >
                      <div className={cn('h-8 w-8 rounded-full flex items-center justify-center', config.bg)}>
                        <Icon className={cn('h-4 w-4', config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{stop.customer}</p>
                        <p className="text-xs text-muted-foreground truncate">{stop.items}</p>
                      </div>
                    </div>
                  );
                })}
                {run.stops.length > 3 && (
                  <p className="text-sm text-muted-foreground text-center py-1">
                    +{run.stops.length - 3} more stops
                  </p>
                )}
              </div>

              {/* Action button */}
              <div className="mt-4">
                {run.status === 'ready' && (
                  <Button className="w-full" size="lg">
                    <Play className="mr-2 h-5 w-5" />
                    Start Run
                  </Button>
                )}
                {run.status === 'in_progress' && (
                  <Link href={`/runs/${run.id}`}>
                    <Button variant="outline" className="w-full" size="lg">
                      View Details
                      <ChevronRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
