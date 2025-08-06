'use client'

import { useEffect, useState } from 'react';
import Header from '@/components/header';
import Navbar from '@/components/navbar';
import { EmailVerificationWrapper } from '@/components/emailVerification';
import { LoadingSpinner } from './LoadingSpinner';

interface User {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string;
}

interface AuthWrapperProps {
    children: React.ReactNode;
}

export const AuthWrapper = ({ children }: AuthWrapperProps) => {
    const [session, setSession] = useState<{ user: User } | null>(null);
    const [loading, setLoading] = useState(true);

    const checkSession = async () => {
        try {
            const response = await fetch('/api/auth/check-session', {
                method: 'GET',
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.session) {
                    setSession(data.session);
                } else {
                    setSession(null);
                }
            } else {
                setSession(null);
            }
        } catch {
            console.error('Error checking session');
            setSession(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Check session on component mount
        checkSession();

        // Listen for storage events (when user logs in/out in another tab)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'auth-status') {
                checkSession();
            }
        };

        // Listen for custom auth events
        const handleAuthEvent = () => {
            // Add a small delay to ensure the server has processed the verification
            setTimeout(() => {
                checkSession();
            }, 500);
        };

        // Add event listeners
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('auth-status-changed', handleAuthEvent);

        // Cleanup event listeners
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('auth-status-changed', handleAuthEvent);
        };
    }, []);

    // Show loading state
    if (loading) {
        return <LoadingSpinner />;
    }

    // If user is not authenticated, only show children (login page, etc.)
    if (!session) {
        return (
            <main>
                {children}
            </main>
        );
    }

    // If user is authenticated, show header, navbar, and children
    return (
        <main>
            <Header session={session} />
            <EmailVerificationWrapper session={session} />
            <Navbar />
            {children}
        </main>
    );
}; 