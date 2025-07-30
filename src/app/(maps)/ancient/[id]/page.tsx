'use client'

import MapViewer from '@/components/mapViewer';
import { useEffect, useState } from 'react';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

const AncientDetail = ({ params }: PageProps) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const resolvedParams = await params;
                const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/maps/ancient`, {
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

    return (
        <MapViewer mapName='ancient' data={data} />
    )
}

export default AncientDetail;