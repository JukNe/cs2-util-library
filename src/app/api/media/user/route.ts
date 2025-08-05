import { NextRequest, NextResponse } from 'next/server';
import { getUserMedia } from '@/lib/blob-storage';
import { validateSession } from '@/lib/session';

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

        // Get all media for the user
        const media = await getUserMedia(sessionValidation.userId!);

        const response = NextResponse.json({
            success: true,
            data: media
        });

        // Add caching headers - cache for 5 minutes
        response.headers.set('Cache-Control', 'private, max-age=300, s-maxage=300');

        return response;
    } catch (error) {
        console.error('Error fetching user media:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch user media'
            },
            { status: 500 }
        );
    }
} 