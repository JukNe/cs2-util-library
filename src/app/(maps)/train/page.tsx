import MapViewer from '@/components/mapViewer';
import { getMapData } from '@/lib/map-data';
import { TUtilityLandingPoint } from '@/types/utilities';

const Train = async () => {
    let data: TUtilityLandingPoint[] = [];
    
    try {
        data = await getMapData('train');
    } catch (error) {
        console.error('Error fetching train data:', error);
    }

    return (
        <MapViewer mapName='train' data={data} />
    )
}

export default Train;