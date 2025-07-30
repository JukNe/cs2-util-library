import MapViewer from '@/components/mapViewer';
import { getMapData } from '@/lib/map-data';
import { TUtilityLandingPoint } from '@/types/utilities';

const Nuke = async () => {
    let data: TUtilityLandingPoint[] = [];
    
    try {
        data = await getMapData('nuke');
    } catch (error) {
        console.error('Error fetching nuke data:', error);
    }

    return (
        <MapViewer mapName='nuke' data={data} />
    )
}

export default Nuke;