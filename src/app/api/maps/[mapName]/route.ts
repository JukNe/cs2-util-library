import { NextRequest, NextResponse } from 'next/server';
import { getMapData } from '@/lib/map-data';
import { validateSession } from '@/lib/session';

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