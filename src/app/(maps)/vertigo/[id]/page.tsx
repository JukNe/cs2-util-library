'use client'

import MapViewer from '@/components/mapViewer';
import { useEffect, useState } from 'react';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

const VertigoDetail = ({ params }: PageProps) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                await params; // Await to handle the Promise but don't use the result
                const response = await fetch(`/api/maps/vertigo`, {
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
        <MapViewer mapName='vertigo' data={data} />
    )
}

export default VertigoDetail;