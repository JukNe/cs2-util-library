'use client'

import { EmailVerificationBanner } from './EmailVerificationBanner';
import { useEmailVerification } from '@/hooks/useEmailVerification';

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

    const handleResendVerification = async () => {
        if (session?.user?.email) {
            await resendVerification(session.user.email);
            // Trigger auth status change to refresh session
            setTimeout(() => {
                window.dispatchEvent(new Event('auth-status-changed'));
            }, 1000);
        }
    };

    // Only show banner if user is not verified
    if (!session.user.emailVerified) {
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