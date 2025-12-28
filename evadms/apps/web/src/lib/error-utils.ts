import { ApiError } from './api';
import { toast } from '@/components/ui/use-toast';

/**
 * Get user-friendly error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred';
}

/**
 * Get error details for debugging
 */
export function getErrorDetails(error: unknown): Record<string, unknown> {
  if (error instanceof ApiError) {
    return error.toJSON();
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return { error };
}

/**
 * Show error toast with appropriate styling
 */
export function showErrorToast(error: unknown, title?: string) {
  const message = getErrorMessage(error);
  const isApiError = error instanceof ApiError;

  let description = message;
  if (isApiError) {
    const apiError = error as ApiError;
    description = `${apiError.method} ${apiError.endpoint}: ${message}`;
  }

  toast({
    variant: 'destructive',
    title: title || (isApiError ? `Error ${(error as ApiError).status}` : 'Error'),
    description,
  });

  // Also log to console for debugging
  console.error('Error Toast:', getErrorDetails(error));
}

/**
 * Show success toast
 */
export function showSuccessToast(title: string, description?: string) {
  toast({
    title,
    description,
  });
}

/**
 * Format error for display in UI components
 */
export function formatErrorForDisplay(error: unknown): {
  title: string;
  message: string;
  details?: Record<string, unknown>;
} {
  if (error instanceof ApiError) {
    return {
      title: `API Error (${error.status})`,
      message: error.message,
      details: {
        endpoint: `${error.method} ${error.endpoint}`,
        timestamp: error.timestamp,
        response: error.responseData,
      },
    };
  }

  if (error instanceof Error) {
    return {
      title: error.name,
      message: error.message,
      details: {
        stack: error.stack,
      },
    };
  }

  return {
    title: 'Error',
    message: String(error),
  };
}

/**
 * Check if error is a specific HTTP status
 */
export function isHttpError(error: unknown, status: number): boolean {
  return error instanceof ApiError && error.status === status;
}

/**
 * Check if error is a network error (no response)
 */
export function isNetworkError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 0;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  return isHttpError(error, 401) || isHttpError(error, 403);
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  return isHttpError(error, 400) || isHttpError(error, 422);
}

/**
 * Check if error is a server error
 */
export function isServerError(error: unknown): boolean {
  return error instanceof ApiError && error.status >= 500;
}
