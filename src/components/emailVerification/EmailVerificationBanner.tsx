'use client'

import { useState } from 'react';
import { BsEnvelope } from 'react-icons/bs';
import Link from 'next/link';
import './style.scss';

interface EmailVerificationBannerProps {
  email: string;
  isVerified: boolean;
  onResendVerification?: () => void;
}

export const EmailVerificationBanner = ({
  email,
  isVerified,
  onResendVerification
}: EmailVerificationBannerProps) => {
  const [isResending, setIsResending] = useState(false);
  const [message, setMessage] = useState('');

  const handleResendVerification = async () => {
    if (!onResendVerification) return;

    setIsResending(true);
    setMessage('');

    try {
      await onResendVerification();
      setMessage('Verification email sent successfully!');
    } catch {
      setMessage('Failed to send verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  if (isVerified) {
    return null; // Don't show banner if email is verified
  }

  return (
    <div className="email-verification-banner">
      <div className="banner-content">
        <div className="banner-icon">
          <BsEnvelope size="1.5rem" />
        </div>

        <div className="banner-text">
          <h4>Verify your email address</h4>
          <p>
            We sent a verification email to <strong>{email}</strong>.
            Please check your inbox and click the verification link to complete your registration.
          </p>

          {message && (
            <p className={`banner-message ${message.includes('successfully') ? 'success' : 'error'}`}>
              {message}
            </p>
          )}
        </div>

        <div className="banner-actions">
          <button
            onClick={handleResendVerification}
            disabled={isResending}
            className="resend-button"
          >
            {isResending ? 'Sending...' : 'Resend Email'}
          </button>
          <Link href="/verify-email" className="manual-verify-link">
            Manual Verification
          </Link>
        </div>
      </div>
    </div>
  );
}; 