import { NextRequest, NextResponse } from 'next/server';
import { deleteBlobFromDatabase } from '@/lib/blob-storage';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const mediaId = searchParams.get('mediaId');

        if (!mediaId) {
            return NextResponse.json({ error: 'Media ID is required' }, { status: 400 });
        }

        // Get the current user session
        const session = await auth.api.getSession({ headers: request.headers });
        const userId = session?.user?.id;

        if (!userId) {
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
        if (media.utility && media.utility.createdBy === userId) {
            userOwnsMedia = true;
        } else if (media.throwingPoint && media.throwingPoint.utility.createdBy === userId) {
            userOwnsMedia = true;
        }

        if (!userOwnsMedia) {
            return NextResponse.json({
                success: false,
                error: 'You can only delete media for your own utilities'
            }, { status: 403 });
        }

        await deleteBlobFromDatabase(mediaId);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting media:', error);
        return NextResponse.json(
            { error: 'Failed to delete media' },
            { status: 500 }
        );
    }
} 