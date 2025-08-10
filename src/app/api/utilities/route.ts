import { NextRequest, NextResponse } from 'next/server';
import { validateSessionWithVerification, checkUnverifiedUserLimits } from '@/lib/session';
import prisma from '@/lib/prisma';

// GET - Fetch utilities for a specific map
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const mapName = searchParams.get('mapName');

        if (!mapName) {
            return NextResponse.json({
                success: false,
                error: 'Map name is required'
            }, { status: 400 });
        }

        // Validate session
        const sessionValidation = await validateSessionWithVerification(request);
        if (!sessionValidation.success) {
            return NextResponse.json({
                success: false,
                error: 'User not authenticated'
            }, { status: 401 });
        }

        // Get the map first
        const map = await prisma.map.findUnique({
            where: { name: mapName }
        });

        if (!map) {
            return NextResponse.json({
                success: false,
                error: 'Map not found'
            }, { status: 404 });
        }

        // Get utilities for this map and user
        const utilities = await prisma.utility.findMany({
            where: {
                mapId: map.id,
                createdBy: sessionValidation.userId
            },
            include: {
                throwingPoints: {
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Transform to match the expected format
        const transformedUtilities = utilities.map(utility => ({
            id: utility.id,
            map: mapName,
            utilityType: utility.utilityType,
            team: utility.team,
            position: {
                X: utility.landingPointX,
                Y: utility.landingPointY
            },
            throwingPoints: utility.throwingPoints.map(tp => ({
                id: tp.id,
                position: {
                    X: tp.positionX,
                    Y: tp.positionY
                },
                title: tp.title,
                description: tp.description || '',
                url: '' // This would need to be added if you want to store URLs
            }))
        }));

        return NextResponse.json({
            success: true,
            data: transformedUtilities
        });
    } catch (error) {
        console.error('Error fetching utilities:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// POST - Create a new utility (landing point)
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { mapName, utilityType, position, team } = body;

        if (!mapName || !utilityType || !position) {
            return NextResponse.json({
                success: false,
                error: 'Map name, utility type, and position are required'
            }, { status: 400 });
        }

        // Validate session with verification status
        const sessionValidation = await validateSessionWithVerification(request);
        if (!sessionValidation.success) {
            return NextResponse.json({
                success: false,
                error: 'User not authenticated'
            }, { status: 401 });
        }

        // Check unverified user limits
        if (!sessionValidation.isEmailVerified) {
            const limits = await checkUnverifiedUserLimits(sessionValidation.userId!);

            if (!limits.canCreateUtility) {
                return NextResponse.json({
                    success: false,
                    error: 'Unverified users can only create one utility. Please verify your email to create more utilities.',
                    requiresVerification: true
                }, { status: 403 });
            }
        }

        // Get the map first
        const map = await prisma.map.findUnique({
            where: { name: mapName }
        });

        if (!map) {
            return NextResponse.json({
                success: false,
                error: 'Map not found'
            }, { status: 404 });
        }

        // Normalize utility type to lowercase for consistency with filters
        const normalizedUtilityType = utilityType.toLowerCase();

        // Validate team value
        const validTeams = ['T', 'CT'];
        const normalizedTeam = team && validTeams.includes(team.toUpperCase()) ? team.toUpperCase() : 'T';

        // Create the utility
        const utility = await prisma.utility.create({
            data: {
                mapId: map.id,
                utilityType: normalizedUtilityType,
                team: normalizedTeam,
                landingPointX: position.X,
                landingPointY: position.Y,
                title: `${utilityType} landingpoint`,
                description: ``,
                createdBy: sessionValidation.userId!
            },
            include: {
                throwingPoints: true
            }
        });

        // Transform to match the expected format
        const transformedUtility = {
            id: utility.id,
            map: mapName,
            utilityType: utility.utilityType,
            team: utility.team,
            position: {
                X: utility.landingPointX,
                Y: utility.landingPointY
            },
            throwingPoints: utility.throwingPoints.map(tp => ({
                id: tp.id,
                position: {
                    X: tp.positionX,
                    Y: tp.positionY
                },
                title: tp.title,
                description: tp.description || '',
                url: ''
            }))
        };

        return NextResponse.json({
            success: true,
            data: transformedUtility
        });
    } catch (error) {
        console.error('Error creating utility:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// DELETE - Delete a utility (landing point) and all its throwing points
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const utilityId = searchParams.get('utilityId');

        if (!utilityId) {
            return NextResponse.json({
                success: false,
                error: 'Utility ID is required'
            }, { status: 400 });
        }

        // Validate session with verification status
        const sessionValidation = await validateSessionWithVerification(request);
        if (!sessionValidation.success) {
            return NextResponse.json({
                success: false,
                error: 'User not authenticated'
            }, { status: 401 });
        }

        // Check if utility exists and belongs to the user
        const utility = await prisma.utility.findFirst({
            where: {
                id: utilityId,
                createdBy: sessionValidation.userId!
            }
        });

        if (!utility) {
            return NextResponse.json({
                success: false,
                error: 'Utility not found or access denied'
            }, { status: 404 });
        }

        // Delete the utility (this will cascade delete throwing points)
        await prisma.utility.delete({
            where: { id: utilityId }
        });

        return NextResponse.json({
            success: true,
            message: 'Utility deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting utility:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 