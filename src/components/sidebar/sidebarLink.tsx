'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from 'next/image'

interface SidebarLinkProps {
    mapName: string;
}

const SidebarLink = (props: SidebarLinkProps) => {
    const path = usePathname();
    const { mapName } = props;
    const formatMapName = (name: string) => {
        if (name === 'dust2') {
            return 'Dust 2';
        }
        return name;
    };
    const isActive = path.includes(mapName)
    return (
        <Link className={isActive ? "sidebar-link active" : "sidebar-link"} href={`/${mapName}`}>
            <div style={{ height: '1.5em' }}>
                <Image className={'map-item-icon'} unoptimized alt={mapName} height={0} width={0} src={`/icons/${mapName}_icon.webp`} style={{ height: '100%', width: 'auto' }} />
            </div>
            <div>{formatMapName(mapName)}</div>
        </Link>
    )
}

export default SidebarLink;