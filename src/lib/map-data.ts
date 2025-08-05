import { TUtilityLandingPoint } from '@/types/utilities';
import prisma from './prisma';

export async function getMapData(mapName: string, userId?: string): Promise<TUtilityLandingPoint[]> {
  try {
    // First, ensure the map exists in the database
    let map = await prisma.map.findUnique({
      where: { name: mapName }
    });

    // If map doesn't exist, create it
    if (!map) {
      const displayName = mapName.charAt(0).toUpperCase() + mapName.slice(1);
      map = await prisma.map.create({
        data: {
          name: mapName,
          displayName: displayName,
        }
      });
    }

    // Build the where clause for utilities
    const whereClause: {
      mapId: string;
      createdBy?: string;
    } = {
      mapId: map.id
    };

    // If userId is provided, filter by user
    if (userId) {
      whereClause.createdBy = userId;
    }

    // Fetch utilities for this map with their throwing points and media
    const utilities = await prisma.utility.findMany({
      where: whereClause,
      include: {
        throwingPoints: {
          include: {
            media: {}
          }
        },
        media: {}
      }
    });

    // Transform the data to match the expected format
    const transformedData: TUtilityLandingPoint[] = utilities.map(utility => ({
      id: utility.id,
      map: mapName,
      utilityType: utility.utilityType,
      team: utility.team,
      title: utility.title,
      description: utility.description || '',
      position: {
        X: utility.landingPointX,
        Y: utility.landingPointY
      },
      throwingPoints: utility.throwingPoints.map(tp => ({
        id: tp.id,
        position: {
          X: tp.positionX,
          Y: tp.positionY
        },
        title: tp.title,
        description: tp.description || '',
        url: tp.media.length > 0 ? tp.media[0].url : '' // Use first media URL as primary
      }))
    }));

    return transformedData;
  } catch (error) {
    console.error('Error fetching map data:', error);
    return [];
  }
}

export async function getAllMaps() {
  try {
    const maps = await prisma.map.findMany({
      orderBy: { displayName: 'asc' }
    });
    return maps;
  } catch (error) {
    console.error('Error fetching maps:', error);
    return [];
  }
} 