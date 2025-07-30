import MapViewer from '@/components/mapViewer';
import { getMapData } from '@/lib/map-data';
import { TUtilityLandingPoint } from '@/types/utilities';

const Inferno = async () => {
    let data: TUtilityLandingPoint[] = [];
    
    try {
        data = await getMapData('inferno');
    } catch (error) {
        console.error('Error fetching inferno data:', error);
    }

    return (
        <MapViewer mapName='inferno' data={data} />
    )
}

export default Inferno;