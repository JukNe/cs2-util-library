import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/session';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        // Validate user session
        const sessionValidation = await validateSession(request);
        if (!sessionValidation.success) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const throwingPointId = searchParams.get('throwingPointId');

        if (!throwingPointId) {
            return NextResponse.json({ success: false, error: 'Throwing point ID is required' }, { status: 400 });
        }

        // Get the throwing point and check if user has access
        const throwingPoint = await prisma.throwingPoint.findUnique({
            where: { id: throwingPointId },
            include: {
                utility: {
                    select: {
                        createdBy: true
                    }
                }
            }
        });

        if (!throwingPoint) {
            return NextResponse.json({ success: false, error: 'Throwing point not found' }, { status: 404 });
        }

        // Check if user has access to this throwing point (owns the utility)
        if (throwingPoint.utility.createdBy !== sessionValidation.userId) {
            return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
        }

        // Get media associated with this throwing point
        const media = await prisma.media.findMany({
            where: {
                throwingPointId: throwingPointId
            },
            select: {
                id: true,
                url: true,
                type: true,
                description: true
            }
        });

        return NextResponse.json({
            success: true,
            media: media
        });

    } catch (error) {
        console.error('Error fetching media for learn page:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
