import Link from "next/link";
import Image from 'next/image'

interface MapCardProps {
    mapName: string;
    totalUtilities: number;
}

const MapCard = (props: MapCardProps) => {
    const { mapName, totalUtilities } = props;

    const formatMapName = (name: string) => {
        // Handle special case for dust2
        if (name === 'dust2') {
            return 'Dust 2';
        }
        return name;
    };

    return (
        <Link className={'map-item'} href={`/${mapName}`} style={{ backgroundImage: `url('/posters/${mapName}_poster.webp')` }}>
            <Image className={'map-item-icon'} unoptimized alt='' height={0} width={0} src={`/icons/${mapName}_icon.webp`} />
            <div className={'map-item-inner'}>
                <div>{formatMapName(mapName)}</div>
                <div style={{ fontSize: '20px', WebkitTextStroke: 'none' }}>{totalUtilities} {totalUtilities === 1 ? 'Grenade' : 'Grenades'}</div>
            </div>
        </Link>
    )
}
export default MapCard;