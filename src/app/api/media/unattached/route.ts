import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/session';
import { getUserUnattachedMedia } from '@/lib/blob-storage';

export async function GET(request: NextRequest) {
    try {
        // Validate session
        const sessionValidation = await validateSession(request);
        if (!sessionValidation.success) {
            return NextResponse.json({
                success: false,
                error: 'User not authenticated'
            }, { status: 401 });
        }

        // Get all media for the user that is not attached to any utility or throwing point
        const media = await getUserUnattachedMedia(sessionValidation.userId!);

        return NextResponse.json({
            success: true,
            media
        });
    } catch (error) {
        console.error('Error fetching unattached media:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch unattached media'
            },
            { status: 500 }
        );
    }
} 