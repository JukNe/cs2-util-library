import MapViewer from '@/components/mapViewer';
import { getMapData } from '@/lib/map-data';
import { TUtilityLandingPoint } from '@/types/utilities';

const Mirage = async () => {
    let data: TUtilityLandingPoint[] = [];
    
    try {
        data = await getMapData('mirage');
    } catch (error) {
        console.error('Error fetching mirage data:', error);
    }

    return (
        <MapViewer mapName='mirage' data={data} />
    )
}

export default Mirage;