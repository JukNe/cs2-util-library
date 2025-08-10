'use client';

import { useState } from 'react';
import { BsEnvelope, BsExclamationTriangle } from 'react-icons/bs';
import Link from 'next/link';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import './style.scss';

interface VerificationPromptProps {
    title: string;
    message: string;
    email: string;
    isVerified: boolean;
    onResendVerification?: () => void;
    variant?: 'banner' | 'modal';
}

export const VerificationPrompt = ({
    title,
    message,
    email,
    isVerified,
    onResendVerification,
    variant = 'banner'
}: VerificationPromptProps) => {
    const [isResending, setIsResending] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const { resendVerification } = useEmailVerification();

    const handleResendVerification = async () => {
        if (!onResendVerification) return;

        setIsResending(true);
        setStatusMessage('');

        try {
            await onResendVerification();
            setStatusMessage('Verification email sent successfully!');
        } catch {
            setStatusMessage('Failed to send verification email. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    if (isVerified) {
        return null;
    }

    const containerClass = `verification-prompt ${variant}`;

    return (
        <div className={containerClass}>
            <div className="prompt-content">
                <div className="prompt-icon">
                    <BsExclamationTriangle size="1.5rem" />
                </div>

                <div className="prompt-text">
                    <h4>{title}</h4>
                    <p>{message}</p>

                    {statusMessage && (
                        <p className={`prompt-message ${statusMessage.includes('successfully') ? 'success' : 'error'}`}>
                            {statusMessage}
                        </p>
                    )}
                </div>

                <div className="prompt-actions">
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
