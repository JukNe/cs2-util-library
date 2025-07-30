import MapViewer from '@/components/mapViewer';

const Mirage = async () => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/maps/mirage`, {
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
        <MapViewer mapName='mirage' data={data} />
    )
}

export default Mirage;