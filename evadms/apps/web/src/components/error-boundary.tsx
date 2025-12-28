'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiError } from '@/lib/api';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log to console with full details
    console.group('🔴 React Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleCopyError = () => {
    const { error, errorInfo } = this.state;
    const errorText = `
Error: ${error?.message}
Name: ${error?.name}
Stack: ${error?.stack}
Component Stack: ${errorInfo?.componentStack}
Timestamp: ${new Date().toISOString()}
URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}
    `.trim();

    navigator.clipboard.writeText(errorText);
  };

  toggleDetails = () => {
    this.setState((prev) => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, errorInfo, showDetails } = this.state;
      const isApiError = error instanceof ApiError;

      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="w-full max-w-2xl border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle className="text-destructive">Something went wrong</CardTitle>
              </div>
              <CardDescription>
                {isApiError
                  ? `API Error: ${(error as ApiError).status} ${(error as ApiError).statusText}`
                  : 'An unexpected error occurred in this component'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Error Message */}
              <div className="rounded-md bg-destructive/10 p-4">
                <p className="font-mono text-sm text-destructive">{error?.message}</p>
              </div>

              {/* API Error Details */}
              {isApiError && (
                <div className="rounded-md bg-muted p-4 space-y-2">
                  <p className="text-sm">
                    <span className="font-semibold">Endpoint:</span>{' '}
                    <code className="bg-background px-1 rounded">
                      {(error as ApiError).method} {(error as ApiError).endpoint}
                    </code>
                  </p>
                  <p className="text-sm">
                    <span className="font-semibold">Timestamp:</span> {(error as ApiError).timestamp}
                  </p>
                </div>
              )}

              {/* Expandable Details */}
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={this.toggleDetails}
                  className="flex items-center gap-1 text-muted-foreground"
                >
                  {showDetails ? (
                    <>
                      <ChevronUp className="h-4 w-4" /> Hide Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" /> Show Details
                    </>
                  )}
                </Button>

                {showDetails && (
                  <div className="mt-2 space-y-2">
                    <div className="rounded-md bg-muted p-4">
                      <p className="text-xs font-semibold mb-2 text-muted-foreground">Stack Trace:</p>
                      <pre className="text-xs overflow-auto max-h-40 whitespace-pre-wrap font-mono">
                        {error?.stack || 'No stack trace available'}
                      </pre>
                    </div>

                    {errorInfo?.componentStack ? (
                      <div className="rounded-md bg-muted p-4">
                        <p className="text-xs font-semibold mb-2 text-muted-foreground">Component Stack:</p>
                        <pre className="text-xs overflow-auto max-h-40 whitespace-pre-wrap font-mono">
                          {String(errorInfo.componentStack)}
                        </pre>
                      </div>
                    ) : null}

                    {isApiError && (error as ApiError).responseData ? (
                      <div className="rounded-md bg-muted p-4">
                        <p className="text-xs font-semibold mb-2 text-muted-foreground">API Response:</p>
                        <pre className="text-xs overflow-auto max-h-40 whitespace-pre-wrap font-mono">
                          {JSON.stringify((error as ApiError).responseData, null, 2)}
                        </pre>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button onClick={this.handleRetry} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button variant="outline" onClick={this.handleCopyError} className="flex items-center gap-2">
                  <Copy className="h-4 w-4" />
                  Copy Error
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for using error boundary programmatically
export function useErrorHandler() {
  const handleError = (error: Error) => {
    console.group('🔴 Error Handler');
    console.error('Error:', error);
    if (error instanceof ApiError) {
      console.error('API Error Details:', error.toJSON());
    }
    console.groupEnd();
    throw error;
  };

  return { handleError };
}
