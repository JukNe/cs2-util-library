import { useState, useCallback } from 'react';

interface UseEmailVerificationReturn {
  resendVerification: (email: string) => Promise<void>;
  isResending: boolean;
  error: string | null;
  success: string | null;
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
    } catch (err) {
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