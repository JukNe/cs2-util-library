import MapViewer from '@/components/mapViewer';
import { getMapData } from '@/lib/map-data';
import { TUtilityLandingPoint } from '@/types/utilities';

const Vertigo = async () => {
    let data: TUtilityLandingPoint[] = [];
    
    try {
        data = await getMapData('vertigo');
    } catch (error) {
        console.error('Error fetching vertigo data:', error);
    }

    return (
        <MapViewer mapName='vertigo' data={data} />
    )
}

export default Vertigo;