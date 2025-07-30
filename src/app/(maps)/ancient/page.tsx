import MapViewer from '@/components/mapViewer';

const Ancient = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/maps/ancient`, {
        cache: 'no-store'
    });

    let data = [];
    if (response.ok) {
        const result = await response.json();
        if (result.success) {
            data = result.data;
        }
    }

    return (
        <MapViewer mapName='ancient' data={data} />
    )
}

export default Ancient;