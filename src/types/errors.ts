// Common error types used throughout the application

export interface ApiError {
  success: false;
  error: string;
  requiresVerification?: boolean;
  message?: string;
}

export interface VerificationError extends ApiError {
  requiresVerification: true;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  requiresVerification?: boolean;
}

// Type guard to check if an error requires verification
export function isVerificationError(error: unknown): error is VerificationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'requiresVerification' in error &&
    (error as VerificationError).requiresVerification === true
  );
}

// Type guard to check if an error is an API error
export function isApiError(error: unknown): error is ApiError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'success' in error &&
    (error as ApiError).success === false &&
    'error' in error
  );
}

// Generic error type for unknown errors
export interface UnknownError {
  message?: string;
  error?: string;
  [key: string]: unknown;
}
