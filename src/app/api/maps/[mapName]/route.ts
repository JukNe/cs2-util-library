import { NextRequest, NextResponse } from 'next/server';
import { getMapData } from '@/lib/map-data';
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

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ mapName: string }> }
) {
    try {
        const { mapName } = await params;

        // Validate session
        const sessionValidation = await validateSession(request);
        const userId = sessionValidation.success ? sessionValidation.userId || undefined : undefined;

        const data = await getMapData(mapName, userId);

        return NextResponse.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error fetching map data:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 