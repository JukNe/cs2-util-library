import { NextRequest, NextResponse } from 'next/server';
import { getUtilityMedia, getThrowingPointMedia } from '@/lib/blob-storage';
import { validateSession } from '@/lib/session';
import prisma from '@/lib/prisma';

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