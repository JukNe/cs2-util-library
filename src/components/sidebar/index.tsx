'use client'

import { useState } from 'react'
import './style.scss'
import Link from "next/link"
import SidebarLink from "./sidebarLink"
import { Maps } from '@/utils/constants'
import UtilityFilters from './utilityFilters'
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs'



interface SidebarProps {
    onCollapseChange?: (collapsed: boolean) => void;
}

const Sidebar = ({ onCollapseChange }: SidebarProps) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

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