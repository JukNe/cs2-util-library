import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/session';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        // Validate session
        const sessionValidation = await validateSession(request);
        const userId = sessionValidation.success ? sessionValidation.userId : null;

        if (!userId) {
            return NextResponse.json({
                success: false,
                error: 'User not authenticated'
            }, { status: 401 });
        }

        // Get all maps with utility counts for the current user only
        const mapsWithCounts = await prisma.map.findMany({
            include: {
                _count: {
                    select: {
                        utilities: {
                            where: {
                                createdBy: userId
                            }
                        }
                    }
                }
            },
            orderBy: { displayName: 'asc' }
        });

        const mapData = mapsWithCounts.map(map => ({
            mapName: map.name,
            totalUtilities: map._count.utilities
        }));

        return NextResponse.json({
            success: true,
            data: mapData
        });
    } catch (error) {
        console.error('Error fetching maps data:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 