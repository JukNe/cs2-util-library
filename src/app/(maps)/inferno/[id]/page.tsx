'use client'

import MapViewer from '@/components/mapViewer';

interface PageProps {
    params: {
        id: string;
    };
}

const InfernoDetail = async ({ params }: PageProps) => {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/maps/inferno`, {
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
        <MapViewer mapName='inferno' data={data} />
    )
}

export default InfernoDetail;