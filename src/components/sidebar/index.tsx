'use client'

import { useState, useEffect } from 'react'
import './style.scss'
import SidebarLink from "./sidebarLink"
import { Maps } from '@/utils/constants'
import UtilityFilters from './utilityFilters'
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs'



interface SidebarProps {
    onCollapseChange?: (collapsed: boolean) => void;
}

const Sidebar = ({ onCollapseChange }: SidebarProps) => {
    const [isCollapsed, setIsCollapsed] = useState(() => {
        // Initialize based on screen size
        if (typeof window !== 'undefined') {
            return window.innerWidth < 1280;
        }
        return false;
    });

    useEffect(() => {
        const handleResize = () => {
            const shouldBeCollapsed = window.innerWidth < 1280;
            if (isCollapsed !== shouldBeCollapsed) {
                setIsCollapsed(shouldBeCollapsed);
                if (onCollapseChange) {
                    onCollapseChange(shouldBeCollapsed);
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isCollapsed, onCollapseChange]);

    const toggleSidebar = () => {
        const newCollapsedState = !isCollapsed;
        setIsCollapsed(newCollapsedState);
        if (onCollapseChange) {
            onCollapseChange(newCollapsedState);
        }
    };

    return (
        <div className={`sidebar ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
            <button
                className="sidebar-toggle-btn"
                onClick={toggleSidebar}
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                {isCollapsed ? <BsChevronRight size="1.2em" /> : <BsChevronLeft size="1.2em" />}
            </button>

            <div className={`sidebar-content ${isCollapsed ? 'sidebar-content-collapsed' : ''}`}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {Maps.map((item) => (
                        <SidebarLink key={item} mapName={item} />
                    ))}
                </div>
                <UtilityFilters />
            </div>
        </div>
    )
}

export default Sidebar;