'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Plus, Minus, Save, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useCreateMovement } from '@/hooks/use-api';

const cylinderSizes = ['9kg', '14kg', '19kg', '48kg'];

export default function ReceiveEmptiesPage() {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [damaged, setDamaged] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMovement = useCreateMovement();

  const updateQty = (size: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [size]: Math.max(0, (prev[size] || 0) + delta),
    }));
  };

  const updateDamaged = (size: string, delta: number) => {
    setDamaged(prev => ({
      ...prev,
      [size]: Math.max(0, (prev[size] || 0) + delta),
    }));
  };

  const totalEmpty = Object.values(quantities).reduce((sum, q) => sum + q, 0);
  const totalDamaged = Object.values(damaged).reduce((sum, q) => sum + q, 0);

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Create movements for empty returns
      const emptyPromises = Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([size, qty]) =>
          createMovement.mutateAsync({
            cylinderSize: size,
            movementType: 'collect_empty',
            quantity: qty,
            reason: 'Empties returned from deliveries',
            notes: notes || undefined,
          })
        );

      // Create movements for damaged/quarantine
      const damagedPromises = Object.entries(damaged)
        .filter(([, qty]) => qty > 0)
        .map(([size, qty]) =>
          createMovement.mutateAsync({
            cylinderSize: size,
            movementType: 'quarantine',
            quantity: qty,
            reason: 'Damaged cylinders received',
            notes: notes || undefined,
          })
        );

      await Promise.all([...emptyPromises, ...damagedPromises]);
      router.push('/stock');
    } catch (e) {
      console.error('Failed to record receipt:', e);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4 pt-2">
        <button onClick={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Receive Empties</h1>
          <p className="text-sm text-muted-foreground">Log returned cylinders</p>
        </div>
      </div>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 text-sm text-blue-700">
          Record empty cylinders returned from deliveries. Mark damaged cylinders for quarantine.
        </CardContent>
      </Card>

      {/* Empty Cylinders */}
      <div className="space-y-3">
        <h2 className="font-semibold">Empty Cylinders</h2>

        {cylinderSizes.map((size) => {
          const qty = quantities[size] || 0;
          return (
            <Card key={size}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Package className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium">{size}</p>
                      <p className="text-sm text-muted-foreground">Empty cylinders</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQty(size, -1)}
                      disabled={qty === 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-10 text-center font-medium">{qty}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateQty(size, 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Damaged Cylinders */}
      <div className="space-y-3">
        <h2 className="font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          Damaged / Quarantine
        </h2>

        {cylinderSizes.map((size) => {
          const qty = damaged[size] || 0;
          return (
            <Card key={size} className={cn(qty > 0 && 'border-amber-200 bg-amber-50')}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'h-10 w-10 rounded-full flex items-center justify-center',
                      qty > 0 ? 'bg-amber-100' : 'bg-gray-100'
                    )}>
                      <AlertTriangle className={cn(
                        'h-5 w-5',
                        qty > 0 ? 'text-amber-600' : 'text-gray-400'
                      )} />
                    </div>
                    <div>
                      <p className="font-medium">{size}</p>
                      <p className="text-sm text-muted-foreground">Damaged / Quarantine</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateDamaged(size, -1)}
                      disabled={qty === 0}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-10 text-center font-medium">{qty}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateDamaged(size, 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Notes (optional)</label>
        <Input
          placeholder="Any additional notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Summary */}
      {(totalEmpty > 0 || totalDamaged > 0) && (
        <Card>
          <CardContent className="p-4">
            <p className="font-medium mb-2">Summary</p>
            <div className="flex gap-6 text-sm">
              <span>Empty: <strong>{totalEmpty}</strong></span>
              {totalDamaged > 0 && (
                <span className="text-amber-600">Damaged: <strong>{totalDamaged}</strong></span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
      <Button
        className="w-full"
        size="lg"
        onClick={handleSubmit}
        disabled={isSubmitting || (totalEmpty === 0 && totalDamaged === 0)}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Recording...
          </>
        ) : (
          <>
            <Save className="mr-2 h-5 w-5" />
            Record Receipt
          </>
        )}
      </Button>
    </div>
  );
}
