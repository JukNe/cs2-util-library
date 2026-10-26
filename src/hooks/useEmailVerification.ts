import { useState, useCallback } from 'react';

interface UseEmailVerificationReturn {
  resendVerification: (email: string) => Promise<void>;
  isResending: boolean;
  error: string | null;
  success: string | null;
}

interface UserLimits {
  canCreateUtility: boolean;
  canCreateThrowingPoint: boolean;
  utilityCount: number;
  throwingPointCount: number;
}

interface UseUserLimitsReturn {
  limits: UserLimits | null;
  isLoading: boolean;
  error: string | null;
  refreshLimits: () => Promise<void>;
}

export const useEmailVerification = (): UseEmailVerificationReturn => {
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const resendVerification = useCallback(async (email: string) => {
    setIsResending(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(data.message);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  }, []);

  return {
    resendVerification,
    isResending,
    error,
    success
  };
};

export const useUserLimits = (): UseUserLimitsReturn => {
  const [limits, setLimits] = useState<UserLimits | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshLimits = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/check-user-limits', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setLimits(data.limits);
      } else {
        setError(data.error);
      }
    } catch {
      setError('Failed to fetch user limits');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    limits,
    isLoading,
    error,
    refreshLimits
  };
}; 