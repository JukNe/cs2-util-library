'use client'

import './style.scss'
import MapCard from '../mapCard';
import { useEffect, useState } from 'react';
import { Maps } from '@/utils/constants';

interface MapDataWithCount {
    mapName: string;
    totalUtilities: number;
}

const MapSelector = () => {
    const [mapData, setMapData] = useState<MapDataWithCount[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllMapData = async () => {
            try {
                const response = await fetch('/api/maps', {
                    credentials: 'include'
                });
                let databaseMaps: MapDataWithCount[] = [];

                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        databaseMaps = result.data;
                    }
                }

                // Create a map of database results for quick lookup
                const databaseMap = new Map(
                    databaseMaps.map(map => [map.mapName, map.totalUtilities])
                );

                // Create final map data with all maps from constants
                const allMaps: MapDataWithCount[] = Maps.map(mapName => ({
                    mapName,
                    totalUtilities: databaseMap.get(mapName) || 0
                }));

                setMapData(allMaps);
            } catch (error) {
                console.error('Error fetching map data:', error);
                // Fallback: show all maps with 0 utilities
                const fallbackMaps: MapDataWithCount[] = Maps.map(mapName => ({
                    mapName,
                    totalUtilities: 0
                }));
                setMapData(fallbackMaps);
            } finally {
                setLoading(false);
            }
        };

        fetchAllMapData();
    }, []);

    if (loading) {
        return <div>Loading maps...</div>;
    }

    return (
        <div className="map-grid">
            {mapData.map((map) => (
                <MapCard
                    key={map.mapName}
                    mapName={map.mapName}
                    totalUtilities={map.totalUtilities}
                />
            ))}
        </div>
    );
};

export default MapSelector;