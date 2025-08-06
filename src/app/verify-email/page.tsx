'use client'

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { BsCheckCircle, BsXCircle, BsEnvelope } from 'react-icons/bs';
import './style.scss';

export default function VerifyEmail() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [verificationStatus, setVerificationStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setVerificationStatus('error');
      setMessage('No verification token provided');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (data.success) {
        setVerificationStatus('success');
        setMessage(data.message);

        // Trigger auth status change to refresh session data
        window.dispatchEvent(new Event('auth-status-changed'));
        localStorage.setItem('auth-status', 'verified');

        // Auto-redirect after a short delay to ensure session is refreshed
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        if (data.error.includes('expired')) {
          setVerificationStatus('expired');
        } else {
          setVerificationStatus('error');
        }
        setMessage(data.error);
      }
    } catch (error) {
      setVerificationStatus('error');
      setMessage('An unexpected error occurred. Please try again.');
    }
  };

  const resendVerification = async () => {
    if (!email) {
      setMessage('Please enter your email address');
      return;
    }

    setIsResending(true);
    setMessage('');

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
        setMessage('Verification email sent successfully! Please check your inbox.');
      } else {
        setMessage(data.error);
      }
    } catch (error) {
      setMessage('Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'success':
        return <BsCheckCircle size="4rem" className="success-icon" />;
      case 'error':
      case 'expired':
        return <BsXCircle size="4rem" className="error-icon" />;
      default:
        return <BsEnvelope size="4rem" className="loading-icon" />;
    }
  };

  const getStatusTitle = () => {
    switch (verificationStatus) {
      case 'success':
        return 'Email Verified!';
      case 'error':
        return 'Verification Failed';
      case 'expired':
        return 'Link Expired';
      default:
        return 'Verifying Email...';
    }
  };

  return (
    <div className="verify-email-page">
      <div className="verify-email-container">
        <div className="verify-email-card">
          <div className="status-section">
            {getStatusIcon()}
            <h1>{getStatusTitle()}</h1>
          </div>

          <div className="message-section">
            {verificationStatus === 'loading' && (
              <div className="loading-message">
                <p>Please wait while we verify your email address...</p>
                <div className="loading-spinner"></div>
              </div>
            )}

            {verificationStatus === 'success' && (
              <div className="success-message">
                <p>{message}</p>
                <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>
                  You will be automatically redirected to the dashboard in a few seconds...
                </p>
                <div className="success-actions">
                  <button
                    onClick={() => {
                      // Ensure session is refreshed before redirecting
                      window.dispatchEvent(new Event('auth-status-changed'));
                      setTimeout(() => {
                        router.push('/');
                      }, 100);
                    }}
                    className="primary-button"
                  >
                    Go to Dashboard Now
                  </button>
                </div>
              </div>
            )}

            {verificationStatus === 'error' && (
              <div className="error-message">
                <p>{message}</p>
                <div className="error-actions">
                  <button
                    onClick={() => router.push('/login')}
                    className="secondary-button"
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            )}

            {verificationStatus === 'expired' && (
              <div className="expired-message">
                <p>{message}</p>
                <div className="resend-section">
                  <p>Enter your email address to receive a new verification link:</p>
                  <div className="email-input-group">
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="email-input"
                    />
                    <button
                      onClick={resendVerification}
                      disabled={isResending || !email}
                      className="resend-button"
                    >
                      {isResending ? 'Sending...' : 'Resend Email'}
                    </button>
                  </div>
                  {message && (
                    <p className={`resend-message ${message.includes('successfully') ? 'success' : 'error'}`}>
                      {message}
                    </p>
                  )}
                </div>
                <div className="expired-actions">
                  <button
                    onClick={() => router.push('/login')}
                    className="secondary-button"
                  >
                    Go to Login
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 