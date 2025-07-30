import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/session';
import prisma from '@/lib/prisma';

export async function PUT(request: NextRequest) {
    try {
        const { mediaId, description } = await request.json();

        if (!mediaId) {
            return NextResponse.json({ error: 'Media ID is required' }, { status: 400 });
        }

        // Validate session
        const sessionValidation = await validateSession(request);
        if (!sessionValidation.success) {
            return NextResponse.json({
                success: false,
                error: 'User not authenticated'
            }, { status: 401 });
        }

        // Get the media and verify the user owns it
        const media = await prisma.media.findUnique({
            where: { id: mediaId },
            include: {
                utility: {
                    select: { createdBy: true }
                },
                throwingPoint: {
                    include: {
                        utility: {
                            select: { createdBy: true }
                        }
                    }
                }
            }
        });

        if (!media) {
            return NextResponse.json({
                success: false,
                error: 'Media not found'
            }, { status: 404 });
        }

        // Check if the user owns the utility or throwing point
        let userOwnsMedia = false;
        if (media.utility && media.utility.createdBy === sessionValidation.userId) {
            userOwnsMedia = true;
        } else if (media.throwingPoint && media.throwingPoint.utility.createdBy === sessionValidation.userId) {
            userOwnsMedia = true;
        }

        if (!userOwnsMedia) {
            return NextResponse.json({
                success: false,
                error: 'You can only update media for your own utilities'
            }, { status: 403 });
        }

        const updatedMedia = await prisma.media.update({
            where: { id: mediaId },
            data: { description },
        });

        return NextResponse.json({ success: true, media: updatedMedia });
    } catch (error) {
        console.error('Error updating media description:', error);
        return NextResponse.json({ error: 'Failed to update media description' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    try {
        const { mediaId, description } = await request.json();

        if (!mediaId) {
            return NextResponse.json({ error: 'Media ID is required' }, { status: 400 });
        }

        // Validate session
        const sessionValidation = await validateSession(request);
        if (!sessionValidation.success) {
            return NextResponse.json({
                success: false,
                error: 'User not authenticated'
            }, { status: 401 });
        }

        // Get the media and verify the user owns it
        const media = await prisma.media.findUnique({
            where: { id: mediaId },
            include: {
                utility: {
                    select: { createdBy: true }
                },
                throwingPoint: {
                    include: {
                        utility: {
                            select: { createdBy: true }
                        }
                    }
                }
            }
        });

        if (!media) {
            return NextResponse.json({
                success: false,
                error: 'Media not found'
            }, { status: 404 });
        }

        // Check if the user owns the utility or throwing point
        let userOwnsMedia = false;
        if (media.utility && media.utility.createdBy === sessionValidation.userId) {
            userOwnsMedia = true;
        } else if (media.throwingPoint && media.throwingPoint.utility.createdBy === sessionValidation.userId) {
            userOwnsMedia = true;
        }

        if (!userOwnsMedia) {
            return NextResponse.json({
                success: false,
                error: 'You can only update media for your own utilities'
            }, { status: 403 });
        }

        const updatedMedia = await prisma.media.update({
            where: { id: mediaId },
            data: { description },
        });

        return NextResponse.json({ success: true, media: updatedMedia });
    } catch (error) {
        console.error('Error updating media description:', error);
        return NextResponse.json({ error: 'Failed to update media description' }, { status: 500 });
    }
} 