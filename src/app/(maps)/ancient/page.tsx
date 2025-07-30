import MapViewer from '@/components/mapViewer';
import { getMapData } from '@/lib/map-data';
import { TUtilityLandingPoint } from '@/types/utilities';

const Ancient = async () => {
    let data: TUtilityLandingPoint[] = [];
    
    try {
        data = await getMapData('ancient');
    } catch (error) {
        console.error('Error fetching ancient data:', error);
    }

    return (
        <MapViewer mapName='ancient' data={data} />
    )
}

export default Ancient;