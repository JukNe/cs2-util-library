'use client'

import './style.scss';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface User {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string;
}

const Header = () => {
    const [session, setSession] = useState<{ user: User } | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

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
        } catch (error) {
            console.error('Error checking session:', error);
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
            checkSession();
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

    const handleLogout = async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                setSession(null);
                // Trigger auth status change event
                window.dispatchEvent(new Event('auth-status-changed'));
                localStorage.setItem('auth-status', 'logged-out');
                router.push('/login');
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    if (loading) {
        return (
            <header className='header'>
                <h4>CS2 Util Library</h4>
            </header>
        );
    }

    return (
        <header className='header'>
            <h4>CS2 Util Library</h4>
            {session && (
                <div className="header-user-section">
                    <span className="user-greeting">Hello, {session.user.name}</span>
                    <button className="logout-button" onClick={handleLogout}>
                        Sign Out
                    </button>
                </div>
            )}
        </header>
    );
};

export default Header;