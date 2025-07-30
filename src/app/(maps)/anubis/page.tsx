import MapViewer from '@/components/mapViewer';
import { getMapData } from '@/lib/map-data';
import { TUtilityLandingPoint } from '@/types/utilities';

const Anubis = async () => {
    let data: TUtilityLandingPoint[] = [];
    
    try {
        data = await getMapData('anubis');
    } catch (error) {
        console.error('Error fetching anubis data:', error);
    }

    return (
        <MapViewer mapName='anubis' data={data} />
    )
}

export default Anubis;