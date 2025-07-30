'use client'

import './style.scss'
import Link from "next/link"
import SidebarLink from "./sidebarLink"
import { Maps } from '@/utils/constants'
import UtilityFilters from './utilityFilters'



const Sidebar = () => {

    return (
        <div className="sidebar" style={{ display: 'flex', flexDirection: 'column', flex: '0 1 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Link href={'/'} ><h3 style={{ whiteSpace: 'nowrap' }}>CS2 Utility Library</h3></Link>
                {Maps.map((item) => (
                    <SidebarLink key={item} mapName={item} />
                ))}
            </div>
            <UtilityFilters />
        </div>
    )
}

export default Sidebar;