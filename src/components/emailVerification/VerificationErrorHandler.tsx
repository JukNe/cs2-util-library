'use client';

import { useState, useEffect } from 'react';
import { VerificationPrompt } from './VerificationPrompt';
import { UnknownError } from '@/types/errors';

interface VerificationErrorHandlerProps {
    error: UnknownError | null;
    onClose: () => void;
    userEmail?: string;
    isVerified?: boolean;
    onResendVerification?: () => void;
}

export const VerificationErrorHandler = ({
    error,
    onClose,
    userEmail,
    isVerified = false,
    onResendVerification
}: VerificationErrorHandlerProps) => {
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        // Check if the error requires verification
        if (error?.requiresVerification ||
            error?.message?.includes('verify your email') ||
            error?.error?.includes('verify your email')) {
            setShowModal(true);
        }
    }, [error]);

    const handleClose = () => {
        setShowModal(false);
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
