import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/session';
import prisma from '@/lib/prisma';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        // Validate session
        const sessionValidation = await validateSession(request);
        if (!sessionValidation.success) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { id: utilityId } = await params;

        // Check if utility exists
        const utility = await prisma.utility.findUnique({
            where: { id: utilityId },
            include: {
                throwingPoints: {
                    include: {
                        media: true
                    }
                }
            }
        });

        if (!utility) {
            return NextResponse.json({ success: false, error: 'Utility not found' }, { status: 404 });
        }

        // Delete all media associated with throwing points first
        for (const throwingPoint of utility.throwingPoints) {
            await prisma.media.deleteMany({
                where: { throwingPointId: throwingPoint.id }
            });
        }

        // Delete all throwing points
        await prisma.throwingPoint.deleteMany({
            where: { utilityId: utilityId }
        });

        // Delete the utility
        await prisma.utility.delete({
            where: { id: utilityId }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Error deleting utility:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 