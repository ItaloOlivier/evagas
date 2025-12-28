'use client';

import { AlertCircle, RefreshCw, ChevronUp, Copy, Bug } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiError } from '@/lib/api';
import { formatErrorForDisplay } from '@/lib/error-utils';

interface ErrorDisplayProps {
  error: unknown;
  title?: string;
  onRetry?: () => void;
  showDetails?: boolean;
  className?: string;
}

export function ErrorDisplay({
  error,
  title,
  onRetry,
  showDetails: initialShowDetails = false,
  className = '',
}: ErrorDisplayProps) {
  const [showDetails, setShowDetails] = useState(initialShowDetails);
  const [copied, setCopied] = useState(false);

  const errorInfo = formatErrorForDisplay(error);
  const isApiError = error instanceof ApiError;

  const handleCopy = () => {
    const errorText = JSON.stringify(
      {
        ...errorInfo,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'N/A',
      },
      null,
      2
    );
    navigator.clipboard.writeText(errorText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className={`border-destructive/50 bg-destructive/5 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <CardTitle className="text-destructive text-lg flex items-center justify-between flex-1">
            <span>{title || errorInfo.title}</span>
            {isApiError && (
              <span className="text-xs font-mono bg-destructive/20 px-2 py-0.5 rounded">
                {(error as ApiError).status}
              </span>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-destructive/90">{errorInfo.message}</p>

        {/* API Error Quick Info */}
        {isApiError && (
          <div className="text-xs font-mono bg-background/50 p-2 rounded border border-destructive/20">
            <span className="text-muted-foreground">Endpoint: </span>
            <span>{(error as ApiError).method} {(error as ApiError).endpoint}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="border-destructive/50 hover:bg-destructive/10"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-destructive/80"
          >
            {showDetails ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Hide Details
              </>
            ) : (
              <>
                <Bug className="h-3 w-3 mr-1" />
                Debug Info
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-destructive/80"
          >
            <Copy className="h-3 w-3 mr-1" />
            {copied ? 'Copied!' : 'Copy'}
          </Button>
        </div>

        {/* Expandable Details */}
        {showDetails && errorInfo.details && (
          <div className="mt-3 space-y-2">
            <pre className="text-xs bg-background/50 p-3 rounded border border-destructive/20 overflow-auto max-h-60 whitespace-pre-wrap">
              {JSON.stringify(errorInfo.details, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Inline error message for form fields
 */
export function InlineError({ message }: { message: string }) {
  return (
    <p className="text-sm text-destructive flex items-center gap-1 mt-1">
      <AlertCircle className="h-3 w-3" />
      {message}
    </p>
  );
}

/**
 * Full page error display
 */
export function PageError({
  error,
  title = 'Failed to load',
  onRetry,
}: {
  error: unknown;
  title?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-4">
      <div className="max-w-lg w-full">
        <ErrorDisplay error={error} title={title} onRetry={onRetry} showDetails />
      </div>
    </div>
  );
}

/**
 * Card-style error for sections
 */
export function CardError({
  error,
  title,
  onRetry,
}: {
  error: unknown;
  title?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="p-4">
      <ErrorDisplay error={error} title={title} onRetry={onRetry} />
    </div>
  );
}
