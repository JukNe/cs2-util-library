import MapViewer from '@/components/mapViewer';
import { getMapData } from '@/lib/map-data';
import { TUtilityLandingPoint } from '@/types/utilities';

const Overpass = async () => {
    let data: TUtilityLandingPoint[] = [];
    
    try {
        data = await getMapData('overpass');
    } catch (error) {
        console.error('Error fetching overpass data:', error);
    }

    return (
        <MapViewer mapName='overpass' data={data} />
    )
}

export default Overpass;