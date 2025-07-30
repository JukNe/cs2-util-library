import MapViewer from '@/components/mapViewer';
import { getMapData } from '@/lib/map-data';
import { TUtilityLandingPoint } from '@/types/utilities';

const Dust2 = async () => {
    let data: TUtilityLandingPoint[] = [];

    try {
        data = await getMapData('dust2');
    } catch (error) {
        console.error('Error fetching dust2 data:', error);
    }

    return (
        <MapViewer mapName='dust2' data={data} />
    )
}

export default Dust2;