'use client'

import './style.scss';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaCheckCircle, FaEnvelope } from 'react-icons/fa';

interface User {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image?: string;
}

interface HeaderProps {
    session: { user: User };
}

const Header = ({ session }: HeaderProps) => {
    const [resending, setResending] = useState(false);
    const router = useRouter();

    const handleResendVerification = async () => {
        if (!session?.user?.email || resending) return;

        setResending(true);
        try {
            const response = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: session.user.email }),
            });

            const data = await response.json();
            if (data.success) {
                alert('Verification email sent successfully!');
            } else {
                alert(data.error || 'Failed to send verification email');
            }
        } catch {
            console.error('Resend verification error');
            alert('Failed to send verification email. Please try again.');
        } finally {
            setResending(false);
        }
    };

    const handleLogout = async () => {
        try {
            const response = await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include'
            });

            if (response.ok) {
                // Trigger auth status change event
                window.dispatchEvent(new Event('auth-status-changed'));
                localStorage.setItem('auth-status', 'logged-out');
                router.push('/login');
            }
        } catch {
            console.error('Logout error');
        }
    };

    return (
        <header className='header'>
            <h4>CS2 Util Library</h4>
            <div className="header-user-section">
                <span className="user-greeting">
                    Hello, {session.user.name}
                    {session.user.emailVerified && (
                        <FaCheckCircle
                            className="verification-checkmark"
                            title="Email verified"
                        />
                    )}
                </span>
                {!session.user.emailVerified && (
                    <button
                        className="resend-verification-button"
                        onClick={handleResendVerification}
                        disabled={resending}
                        title="Resend verification email"
                    >
                        <FaEnvelope />
                        {resending ? 'Sending...' : 'Resend Email'}
                    </button>
                )}
                <button className="logout-button" onClick={handleLogout}>
                    Sign Out
                </button>
            </div>
        </header>
    );
};

export default Header;