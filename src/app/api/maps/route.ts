import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Helper function to validate session
async function validateSession(request: NextRequest) {
    const sessionToken = request.cookies.get('session')?.value;

    if (!sessionToken) {
        return { success: false, userId: null };
    }

    // Find session in database
    const dbSession = await prisma.session.findUnique({
        where: { token: sessionToken },
        include: { user: true }
    });

    // Check if session exists and is not expired
    if (!dbSession || dbSession.expiresAt <= new Date()) {
        return { success: false, userId: null };
    }

    return { success: true, userId: dbSession.user.id };
}

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