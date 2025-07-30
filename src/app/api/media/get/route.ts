import { NextRequest, NextResponse } from 'next/server';
import { getUtilityMedia, getThrowingPointMedia } from '@/lib/blob-storage';
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
        const { searchParams } = new URL(request.url);
        const utilityId = searchParams.get('utilityId');
        const throwingPointId = searchParams.get('throwingPointId');

        if (!utilityId && !throwingPointId) {
            return NextResponse.json(
                { error: 'Either utilityId or throwingPointId is required' },
                { status: 400 }
            );
        }

        // Validate session
        const sessionValidation = await validateSession(request);
        if (!sessionValidation.success) {
            return NextResponse.json({
                success: false,
                error: 'User not authenticated'
            }, { status: 401 });
        }

        let media;
        if (utilityId) {
            // Verify the user owns the utility
            const utility = await prisma.utility.findUnique({
                where: { id: utilityId },
                select: { createdBy: true }
            });

            if (!utility) {
                return NextResponse.json({
                    success: false,
                    error: 'Utility not found'
                }, { status: 404 });
            }

            if (utility.createdBy !== sessionValidation.userId) {
                return NextResponse.json({
                    success: false,
                    error: 'You can only access media for your own utilities'
                }, { status: 403 });
            }

            media = await getUtilityMedia(utilityId);
        } else if (throwingPointId) {
            // Verify the user owns the throwing point
            const throwingPoint = await prisma.throwingPoint.findUnique({
                where: { id: throwingPointId },
                include: {
                    utility: {
                        select: { createdBy: true }
                    }
                }
            });

            if (!throwingPoint) {
                return NextResponse.json({
                    success: false,
                    error: 'Throwing point not found'
                }, { status: 404 });
            }

            if (throwingPoint.utility.createdBy !== sessionValidation.userId) {
                return NextResponse.json({
                    success: false,
                    error: 'You can only access media for your own throwing points'
                }, { status: 403 });
            }

            media = await getThrowingPointMedia(throwingPointId);
        }

        return NextResponse.json({ media });
    } catch (error) {
        console.error('Error fetching media:', error);
        return NextResponse.json(
            { error: 'Failed to fetch media' },
            { status: 500 }
        );
    }
} 