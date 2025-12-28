'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Flame, ClipboardCheck, Play, CheckCircle, Package, AlertTriangle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  useRefillBatch,
  useStartInspection,
  useCompleteInspection,
  useStartFilling,
  useCompleteFilling,
  useCompleteQC,
  useStockBatch,
} from '@/hooks/use-api';

const steps = [
  { id: 'inspect', label: 'Pre-Fill Inspection', icon: ClipboardCheck, status: 'inspecting' },
  { id: 'fill', label: 'Fill Cylinders', icon: Flame, status: 'filling' },
  { id: 'qc', label: 'Quality Check', icon: CheckCircle, status: 'qc' },
  { id: 'stock', label: 'Move to Stock', icon: Package, status: 'passed' },
];

export default function RefillBatchPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = use(params);
  const router = useRouter();

  const { data: batch, isLoading, error } = useRefillBatch(batchId);

  const startInspection = useStartInspection();
  const completeInspection = useCompleteInspection();
  const startFilling = useStartFilling();
  const completeFilling = useCompleteFilling();
  const completeQC = useCompleteQC();
  const stockBatch = useStockBatch();

  const isSubmitting =
    startInspection.isPending ||
    completeInspection.isPending ||
    startFilling.isPending ||
    completeFilling.isPending ||
    completeQC.isPending ||
    stockBatch.isPending;

  const handleStartInspection = async () => {
    try {
      await startInspection.mutateAsync({ id: batchId });
    } catch (e) {
      console.error('Failed to start inspection:', e);
    }
  };

  const handleCompleteInspection = async () => {
    try {
      await completeInspection.mutateAsync({
        id: batchId,
        data: { passedCount: batch?.quantity || 0, failedCount: 0 },
      });
    } catch (e) {
      console.error('Failed to complete inspection:', e);
    }
  };

  const handleStartFilling = async () => {
    try {
      await startFilling.mutateAsync({ id: batchId });
    } catch (e) {
      console.error('Failed to start filling:', e);
    }
  };

  const handleCompleteFilling = async () => {
    try {
      await completeFilling.mutateAsync(batchId);
    } catch (e) {
      console.error('Failed to complete filling:', e);
    }
  };

  const handleCompleteQC = async () => {
    try {
      await completeQC.mutateAsync({
        id: batchId,
        data: { passedCount: batch?.quantity || 0, failedCount: 0 },
      });
    } catch (e) {
      console.error('Failed to complete QC:', e);
    }
  };

  const handleStockBatch = async () => {
    try {
      await stockBatch.mutateAsync(batchId);
      router.push('/refill');
    } catch (e) {
      console.error('Failed to stock batch:', e);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-eva-primary" />
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-4 pt-2">
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-bold">Batch Details</h1>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700">Failed to load batch details. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const batchRef = batch.batchRef || batch.batchNumber || `Batch ${batch.id.slice(0, 8)}`;
  const currentStepIndex = steps.findIndex(s => s.status === batch.status);

  // Get the action handler for each step
  const getStepAction = (stepIndex: number) => {
    switch (stepIndex) {
      case 0: // inspecting -> complete inspection
        return handleCompleteInspection;
      case 1: // filling -> complete filling
        return handleCompleteFilling;
      case 2: // qc -> complete QC
        return handleCompleteQC;
      default:
        return undefined;
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
          <h1 className="text-xl font-bold">{batchRef}</h1>
          <p className="text-sm text-muted-foreground">
            {batch.quantity}x {batch.cylinderSize} Cylinders
          </p>
        </div>
      </div>

      {/* Batch Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center">
              <Flame className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{batch.cylinderSize} Cylinders</p>
              <p className="text-sm text-muted-foreground">
                Quantity: {batch.quantity}
                {batch.fillStation && ` • ${batch.fillStation}`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Steps */}
      <div className="space-y-3">
        <h2 className="font-semibold">Refill Workflow</h2>

        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isComplete = idx < currentStepIndex || batch.status === 'stocked';
          const isCurrent = step.status === batch.status;
          const isPending = idx > currentStepIndex && currentStepIndex !== -1;
          const stepAction = getStepAction(idx);

          return (
            <Card key={step.id} className={cn(
              isCurrent && 'border-eva-primary bg-red-50/50',
              isComplete && 'bg-green-50 border-green-200'
            )}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    'h-10 w-10 rounded-full flex items-center justify-center',
                    isComplete ? 'bg-green-100' : isCurrent ? 'bg-eva-primary/10' : 'bg-muted'
                  )}>
                    {isComplete ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Icon className={cn('h-5 w-5', isCurrent ? 'text-eva-primary' : 'text-muted-foreground')} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      'font-medium',
                      isPending && 'text-muted-foreground'
                    )}>
                      {step.label}
                    </p>
                    {isComplete && (
                      <p className="text-sm text-green-600">Completed</p>
                    )}
                    {isCurrent && (
                      <p className="text-sm text-eva-primary">In progress</p>
                    )}
                  </div>

                  {isCurrent && stepAction && (
                    <Button
                      size="sm"
                      onClick={stepAction}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Complete'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Action Buttons */}
      {batch.status === 'created' && (
        <Button
          className="w-full"
          size="lg"
          onClick={handleStartInspection}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Play className="mr-2 h-5 w-5" />
          )}
          Start Pre-Fill Inspection
        </Button>
      )}

      {batch.status === 'passed' && (
        <Button
          className="w-full"
          size="lg"
          onClick={handleStockBatch}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Package className="mr-2 h-5 w-5" />
          )}
          Move to Stock
        </Button>
      )}

      {/* Failed State */}
      {batch.status === 'failed' && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <div>
                <p className="font-medium">Batch Failed QC</p>
                <p className="text-sm">This batch has been quarantined</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
