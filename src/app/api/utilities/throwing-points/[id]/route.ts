import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/session';
import prisma from '@/lib/prisma';

// PATCH - Update a throwing point (partial update)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const body = await request.json();
        const { title, description } = body;
        const { id: throwingPointId } = await params;

        if (!throwingPointId) {
            return NextResponse.json({
                success: false,
                error: 'Throwing point ID is required'
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

        // Verify the throwing point exists and belongs to the current user
        const existingThrowingPoint = await prisma.throwingPoint.findUnique({
            where: { id: throwingPointId },
            include: {
                utility: {
                    select: { createdBy: true }
                }
            }
        });

        if (!existingThrowingPoint) {
            return NextResponse.json({
                success: false,
                error: 'Throwing point not found'
            }, { status: 404 });
        }

        if (existingThrowingPoint.utility.createdBy !== sessionValidation.userId) {
            return NextResponse.json({
                success: false,
                error: 'You can only update throwing points for your own utilities'
            }, { status: 403 });
        }

        // Prepare update data
        const updateData: {
            title?: string;
            description?: string | null;
        } = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;

        // Update the throwing point
        const updatedThrowingPoint = await prisma.throwingPoint.update({
            where: { id: throwingPointId },
            data: updateData
        });

        // Transform to match the expected format
        const transformedThrowingPoint = {
            id: updatedThrowingPoint.id,
            position: {
                X: updatedThrowingPoint.positionX,
                Y: updatedThrowingPoint.positionY
            },
            title: updatedThrowingPoint.title,
            description: updatedThrowingPoint.description || '',
            url: ''
        };

        return NextResponse.json({
            success: true,
            data: transformedThrowingPoint
        });
    } catch (error) {
        console.error('Error updating throwing point:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// DELETE - Delete a throwing point
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: throwingPointId } = await params;

        if (!throwingPointId) {
            return NextResponse.json({
                success: false,
                error: 'Throwing point ID is required'
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

        // Verify the throwing point exists and belongs to the current user
        const existingThrowingPoint = await prisma.throwingPoint.findUnique({
            where: { id: throwingPointId },
            include: {
                utility: {
                    select: { createdBy: true }
                }
            }
        });

        if (!existingThrowingPoint) {
            return NextResponse.json({
                success: false,
                error: 'Throwing point not found'
            }, { status: 404 });
        }

        if (existingThrowingPoint.utility.createdBy !== sessionValidation.userId) {
            return NextResponse.json({
                success: false,
                error: 'You can only delete throwing points for your own utilities'
            }, { status: 403 });
        }

        // Delete the throwing point
        await prisma.throwingPoint.delete({
            where: { id: throwingPointId }
        });

        return NextResponse.json({
            success: true,
            message: 'Throwing point deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting throwing point:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 