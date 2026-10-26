'use client'

import { useEffect } from 'react';
import { EmailVerificationBanner } from './EmailVerificationBanner';
import { VerificationPrompt } from './VerificationPrompt';
import { useEmailVerification } from '@/hooks/useEmailVerification';
import { useUserLimits } from '@/hooks/useEmailVerification';

interface User {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string;
}

interface EmailVerificationWrapperProps {
    session: { user: User };
}

export const EmailVerificationWrapper = ({ session }: EmailVerificationWrapperProps) => {
    const { resendVerification } = useEmailVerification();
    const { limits, refreshLimits } = useUserLimits();

    useEffect(() => {
        if (!session.user.emailVerified) {
            refreshLimits();
        }
    }, [session.user.emailVerified, refreshLimits]);

    const handleResendVerification = async () => {
        if (session?.user?.email) {
            await resendVerification(session.user.email);
            // Trigger auth status change to refresh session
            setTimeout(() => {
                window.dispatchEvent(new Event('auth-status-changed'));
            }, 1000);
        }
    };

    const showLimitPrompt =
        !session.user.emailVerified &&
        !!limits &&
        (!limits.canCreateUtility || !limits.canCreateThrowingPoint);

    // Only show banner if user is not verified
    if (!session.user.emailVerified) {
        if (showLimitPrompt) {
            return (
                <VerificationPrompt
                    title="Email Verification Required"
                    message="You've reached the limit for unverified users. Please verify your email address to create more utilities and throwing points."
                    email={session.user.email}
                    isVerified={session.user.emailVerified}
                    onResendVerification={handleResendVerification}
                    variant="banner"
                />
            );
        }

        return (
            <EmailVerificationBanner
                email={session.user.email}
                isVerified={session.user.emailVerified}
                onResendVerification={handleResendVerification}
            />
        );
    }

    return null;
};
