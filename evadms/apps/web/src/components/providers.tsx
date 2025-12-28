'use client';

import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from '@tanstack/react-query';
import { useState } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/error-boundary';
import { showErrorToast, isAuthError } from '@/lib/error-utils';
import { ApiError } from '@/lib/api';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: (failureCount, error) => {
              // Don't retry on auth errors or client errors
              if (error instanceof ApiError) {
                if (error.status >= 400 && error.status < 500) {
                  return false;
                }
              }
              return failureCount < 2;
            },
          },
          mutations: {
            retry: false,
          },
        },
        queryCache: new QueryCache({
          onError: (error, query) => {
            // Only show toast for errors that are not handled by the component
            // Skip auth errors as they are handled by the interceptor
            if (!isAuthError(error)) {
              console.error(`Query error [${query.queryKey.join('/')}]:`, error);
              // Show toast for unexpected errors
              if (error instanceof ApiError && error.status >= 500) {
                showErrorToast(error, 'Server Error');
              }
            }
          },
        }),
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            // Show toast for mutation errors
            console.error(`Mutation error:`, error);
            if (!isAuthError(error)) {
              showErrorToast(
                error,
                mutation.options.mutationKey
                  ? `Failed: ${String(mutation.options.mutationKey)}`
                  : 'Operation Failed'
              );
            }
          },
        }),
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
      <Toaster />
    </QueryClientProvider>
  );
}
