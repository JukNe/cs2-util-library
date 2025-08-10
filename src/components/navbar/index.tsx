'use client'

import './style.scss';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Navbar = () => {
    const pathname = usePathname();

    const isActive = (path: string) => {
        if (path === '/') {
            return pathname === '/';
        }
        return pathname.startsWith(path);
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link
                    href="/"
                    className={`navbar-button ${isActive('/') ? 'active' : ''}`}
                >
                    Maps
                </Link>
                <Link
                    href="/media"
                    className={`navbar-button ${isActive('/media') ? 'active' : ''}`}
                >
                    Media
                </Link>
                <Link
                    href="/learn"
                    className={`navbar-button ${isActive('/learn') ? 'active' : ''}`}
                >
                    Learn
                </Link>
            </div>
        </nav>
    );
};

export default Navbar; 