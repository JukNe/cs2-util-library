import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/session';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const { mediaId, utilityId, throwingPointId } = await request.json();

        if (!mediaId) {
            return NextResponse.json({ error: 'Media ID is required' }, { status: 400 });
        }

        if (!utilityId && !throwingPointId) {
            return NextResponse.json({ error: 'Either utilityId or throwingPointId is required' }, { status: 400 });
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

        // Check if the user owns the media (directly via userId, or through a utility/throwing point)
        let userOwnsMedia = false;

        // Check direct ownership via userId field
        if (media.userId === sessionValidation.userId) {
            userOwnsMedia = true;
        }
        // Check ownership through utility
        else if (media.utility && media.utility.createdBy === sessionValidation.userId) {
            userOwnsMedia = true;
        }
        // Check ownership through throwing point
        else if (media.throwingPoint && media.throwingPoint.utility.createdBy === sessionValidation.userId) {
            userOwnsMedia = true;
        }

        if (!userOwnsMedia) {
            return NextResponse.json({
                success: false,
                error: 'You can only attach media that you own'
            }, { status: 403 });
        }

        // Verify the user owns the target utility or throwing point
        if (utilityId) {
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
                    error: 'You can only attach media to your own utilities'
                }, { status: 403 });
            }
        } else if (throwingPointId) {
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
                    error: 'You can only attach media to your own throwing points'
                }, { status: 403 });
            }
        }

        // Update the media to attach it to the target
        const updatedMedia = await prisma.media.update({
            where: { id: mediaId },
            data: {
                utilityId: utilityId || null,
                throwingPointId: throwingPointId || null,
            },
        });

        return NextResponse.json({ success: true, media: updatedMedia });
    } catch (error) {
        console.error('Error attaching media:', error);
        return NextResponse.json({ error: 'Failed to attach media' }, { status: 500 });
    }
} 