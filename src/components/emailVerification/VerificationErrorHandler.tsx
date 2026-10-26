'use client';

import { useState } from 'react';
import { VerificationPrompt } from './VerificationPrompt';
import { UnknownError } from '@/types/errors';

interface VerificationErrorHandlerProps {
    error: UnknownError | null;
    onClose: () => void;
    userEmail?: string;
    isVerified?: boolean;
    onResendVerification?: () => void;
}

function requiresEmailVerification(error: UnknownError | null): boolean {
    return Boolean(
        error?.requiresVerification ||
        error?.message?.includes('verify your email') ||
        error?.error?.includes('verify your email')
    );
}

export const VerificationErrorHandler = ({
    error,
    onClose,
    userEmail,
    isVerified = false,
    onResendVerification
}: VerificationErrorHandlerProps) => {
    const [dismissedError, setDismissedError] = useState<UnknownError | null>(null);
    const showModal = requiresEmailVerification(error) && error !== dismissedError;

    const handleClose = () => {
        setDismissedError(error);
        onClose();
    };

    if (!showModal) {
        return null;
    }

    return (
        <div className="verification-error-overlay">
            <div className="verification-error-backdrop" onClick={handleClose} />
            <VerificationPrompt
                title="Email Verification Required"
                message={error?.error || error?.message || "Please verify your email address to continue."}
                email={userEmail || ''}
                isVerified={isVerified}
                onResendVerification={onResendVerification}
                variant="modal"
            />
        </div>
    );
};
