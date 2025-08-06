import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/session';
import prisma from '@/lib/prisma';

// PATCH - Update a utility (partial update)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const body = await request.json();
        const { title, description } = body;
        const { id: utilityId } = await params;

        if (!utilityId) {
            return NextResponse.json({
                success: false,
                error: 'Utility ID is required'
            }, { status: 400 });
        }

        // Validate session
        const sessionValidation = await validateSession(request);
        if (!sessionValidation.success) {
            return NextResponse.json({
                success: false,
                error: 'User not authenticated'
            }, { status: 401 });
        }

        // Verify the utility exists and belongs to the current user
        const existingUtility = await prisma.utility.findUnique({
            where: { id: utilityId },
            select: { createdBy: true }
        });

        if (!existingUtility) {
            return NextResponse.json({
                success: false,
                error: 'Utility not found'
            }, { status: 404 });
        }

        if (existingUtility.createdBy !== sessionValidation.userId) {
            return NextResponse.json({
                success: false,
                error: 'You can only update utilities you created'
            }, { status: 403 });
        }

        // Prepare update data
        const updateData: {
            title?: string;
            description?: string | null;
        } = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;

        // Update the utility
        const updatedUtility = await prisma.utility.update({
            where: { id: utilityId },
            data: updateData
        });

        return NextResponse.json({
            success: true,
            data: updatedUtility
        });
    } catch (error) {
        console.error('Error updating utility:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

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
            where: { id: utilityId }
        });

        if (!utility) {
            return NextResponse.json({ success: false, error: 'Utility not found' }, { status: 404 });
        }

        // Delete the utility (this will cascade delete throwing points and set media foreign keys to null)
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