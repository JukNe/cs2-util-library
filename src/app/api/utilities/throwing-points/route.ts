import { NextRequest, NextResponse } from 'next/server';
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

// POST - Create a new throwing point
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { utilityId, position, title, description } = body;

        if (!utilityId || !position) {
            return NextResponse.json({
                success: false,
                error: 'Utility ID and position are required'
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
        const utility = await prisma.utility.findUnique({
            where: { id: utilityId },
            select: { id: true, createdBy: true }
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
                error: 'You can only add throwing points to your own utilities'
            }, { status: 403 });
        }

        // Create the throwing point
        const throwingPoint = await prisma.throwingPoint.create({
            data: {
                utilityId,
                positionX: position.X,
                positionY: position.Y,
                title: title || `Throwing Point at ${position.X.toFixed(1)}%, ${position.Y.toFixed(1)}%`,
                description: description || ''
            }
        });

        // Transform to match the expected format
        const transformedThrowingPoint = {
            id: throwingPoint.id,
            position: {
                X: throwingPoint.positionX,
                Y: throwingPoint.positionY
            },
            title: throwingPoint.title,
            description: throwingPoint.description || '',
            url: ''
        };

        return NextResponse.json({
            success: true,
            data: transformedThrowingPoint
        });
    } catch (error) {
        console.error('Error creating throwing point:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// PUT - Update a throwing point
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, title, description } = body;

        if (!id) {
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
            where: { id },
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

        // Update the throwing point
        const updatedThrowingPoint = await prisma.throwingPoint.update({
            where: { id },
            data: {
                title: title !== undefined ? title : existingThrowingPoint.title,
                description: description !== undefined ? description : existingThrowingPoint.description
            }
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