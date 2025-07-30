'use client'

import MapViewer from '@/components/mapViewer';

interface PageProps {
    params: {
        id: string;
    };
}

const AnubisDetail = async ({ params }: PageProps) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/maps/anubis`, {
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
        <MapViewer mapName='anubis' data={data} />
    )
}

export default AnubisDetail;