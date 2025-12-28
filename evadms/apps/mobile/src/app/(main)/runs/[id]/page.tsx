'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Package,
  Phone,
  Navigation,
  CheckCircle,
  Camera,
  FileSignature,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Mock data
const mockRun = {
  id: 'RUN-2024-001',
  status: 'in_progress',
  vehicle: 'GH 123 GP',
  startedAt: '2024-01-15T07:30:00Z',
  stops: [
    {
      id: '1',
      order: 1,
      orderId: 'ORD-2024-0156',
      customer: 'ABC Corporation',
      site: 'Main Office',
      address: '456 Business Park, Sandton',
      phone: '+27 11 123 4567',
      status: 'completed',
      eta: '08:00',
      arrivedAt: '08:05',
      completedAt: '08:25',
      items: [
        { product: '9kg LPG', qty: 20, delivered: 20, empties: 18 },
        { product: '19kg LPG', qty: 10, delivered: 10, empties: 10 },
      ],
    },
    {
      id: '2',
      order: 2,
      orderId: 'ORD-2024-0155',
      customer: 'Quick Gas Ltd',
      site: 'Distribution Center',
      address: '789 Industrial Ave, Johannesburg South',
      phone: '+27 11 234 5678',
      status: 'completed',
      eta: '09:00',
      arrivedAt: '09:10',
      completedAt: '09:35',
      items: [{ product: '9kg LPG', qty: 50, delivered: 50, empties: 45 }],
    },
    {
      id: '3',
      order: 3,
      orderId: 'ORD-2024-0154',
      customer: 'XYZ Industries',
      site: 'Warehouse A',
      address: '123 Industrial Road, Johannesburg',
      phone: '+27 11 345 6789',
      status: 'current',
      eta: '10:30',
      arrivedAt: null,
      completedAt: null,
      items: [{ product: '48kg LPG', qty: 15, delivered: null, empties: null }],
    },
    {
      id: '4',
      order: 4,
      orderId: 'ORD-2024-0153',
      customer: 'Metro Restaurant',
      site: 'Downtown Branch',
      address: '321 Food Court, Braamfontein',
      phone: '+27 11 456 7890',
      status: 'pending',
      eta: '11:30',
      arrivedAt: null,
      completedAt: null,
      items: [{ product: '19kg LPG', qty: 8, delivered: null, empties: null }],
    },
    {
      id: '5',
      order: 5,
      orderId: 'ORD-2024-0152',
      customer: 'City Bakery',
      site: 'Production Facility',
      address: '555 Baker Street, Randburg',
      phone: '+27 11 567 8901',
      status: 'pending',
      eta: '12:30',
      arrivedAt: null,
      completedAt: null,
      items: [{ product: '14kg LPG', qty: 25, delivered: null, empties: null }],
    },
  ],
};

const stopStatusConfig: Record<string, { icon: typeof Clock; color: string; bg: string; line: string }> = {
  pending: { icon: Clock, color: 'text-gray-400', bg: 'bg-gray-100', line: 'bg-gray-200' },
  current: { icon: MapPin, color: 'text-orange-500', bg: 'bg-orange-100', line: 'bg-orange-200' },
  completed: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100', line: 'bg-green-500' },
};

export default function RunDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [selectedStop, setSelectedStop] = useState<string | null>(
    mockRun.stops.find((s) => s.status === 'current')?.id || null
  );

  const currentStopIndex = mockRun.stops.findIndex((s) => s.status === 'current');
  const completedStops = mockRun.stops.filter((s) => s.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10 safe-area-top">
        <div className="flex items-center gap-4 p-4">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-lg">{mockRun.id}</h1>
            <p className="text-sm text-muted-foreground">
              {completedStops}/{mockRun.stops.length} stops completed
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{mockRun.vehicle}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 pb-4">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-eva-primary transition-all"
              style={{ width: `${(completedStops / mockRun.stops.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stops list */}
      <div className="p-4 space-y-3">
        {mockRun.stops.map((stop, index) => {
          const config = stopStatusConfig[stop.status];
          const Icon = config.icon;
          const isSelected = selectedStop === stop.id;
          const isLast = index === mockRun.stops.length - 1;

          return (
            <div key={stop.id} className="relative">
              {/* Timeline connector */}
              {!isLast && (
                <div
                  className={cn(
                    'absolute left-[22px] top-12 bottom-0 w-0.5 -mb-3',
                    stop.status === 'completed' ? 'bg-green-500' : 'bg-gray-200'
                  )}
                />
              )}

              <Card
                className={cn(
                  'cursor-pointer transition-all',
                  isSelected && 'ring-2 ring-eva-primary',
                  stop.status === 'current' && 'border-orange-300 bg-orange-50'
                )}
                onClick={() => setSelectedStop(isSelected ? null : stop.id)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    {/* Status icon */}
                    <div className={cn('h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0', config.bg)}>
                      <Icon className={cn('h-5 w-5', config.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold">{stop.customer}</p>
                          <p className="text-sm text-muted-foreground">{stop.site}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-medium">
                            {stop.status === 'completed' ? stop.completedAt : `ETA ${stop.eta}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Stop {stop.order}
                          </p>
                        </div>
                      </div>

                      {/* Items summary */}
                      <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span>
                          {stop.items.map((i) => `${i.qty}x ${i.product}`).join(', ')}
                        </span>
                      </div>

                      {/* Expanded content */}
                      {isSelected && (
                        <div className="mt-4 space-y-4">
                          {/* Address */}
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <p className="text-sm">{stop.address}</p>
                          </div>

                          {/* Phone */}
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <a href={`tel:${stop.phone}`} className="text-sm text-eva-primary">
                              {stop.phone}
                            </a>
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            {stop.status === 'current' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(
                                      `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(stop.address)}`,
                                      '_blank'
                                    );
                                  }}
                                >
                                  <Navigation className="mr-2 h-4 w-4" />
                                  Navigate
                                </Button>
                                <Link href={`/runs/${params.id}/deliver/${stop.id}`} className="flex-1">
                                  <Button size="sm" className="w-full" onClick={(e) => e.stopPropagation()}>
                                    <Camera className="mr-2 h-4 w-4" />
                                    Deliver
                                  </Button>
                                </Link>
                              </>
                            )}
                            {stop.status === 'completed' && (
                              <Link href={`/runs/${params.id}/pod/${stop.orderId}`} className="flex-1">
                                <Button variant="outline" size="sm" className="w-full" onClick={(e) => e.stopPropagation()}>
                                  <FileSignature className="mr-2 h-4 w-4" />
                                  View POD
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <ChevronRight
                      className={cn(
                        'h-5 w-5 text-muted-foreground transition-transform flex-shrink-0',
                        isSelected && 'rotate-90'
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
