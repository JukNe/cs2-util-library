import MapViewer from '@/components/mapViewer';
import { getMapData } from '@/lib/map-data';
import { TUtilityLandingPoint } from '@/types/utilities';

const Cache = async () => {
    let data: TUtilityLandingPoint[] = [];
    
    try {
        data = await getMapData('cache');
    } catch (error) {
        console.error('Error fetching cache data:', error);
    }

    return (
        <MapViewer mapName='cache' data={data} />
    )
}

export default Cache;