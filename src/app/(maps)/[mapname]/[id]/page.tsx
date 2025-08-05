'use client'

import MapViewer from '@/components/mapViewer';
import { useEffect, useState } from 'react';

interface PageProps {
    params: Promise<{
        mapname: string;
        id: string;
    }>;
}

const MapDetail = ({ params }: PageProps) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mapName, setMapName] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            const resolvedParams = await params;
            const mapName = resolvedParams.mapname;
            setMapName(mapName);

            try {
                const response = await fetch(`/api/maps/${mapName}`, {
                    cache: 'no-store'
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        setData(result.data);
                    }
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [params]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return <MapViewer mapName={mapName} data={data} />
}

export default MapDetail; 