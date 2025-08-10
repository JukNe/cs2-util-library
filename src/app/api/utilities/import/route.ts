import { NextRequest, NextResponse } from 'next/server';
import { validateSessionWithVerification } from '@/lib/session';
import prisma from '@/lib/prisma';
import { TUtilityLandingPoint, TUtilityThrowingPoint } from '@/types/utilities';

export async function POST(request: NextRequest) {
    try {
        // Validate session with verification status
        const sessionValidation = await validateSessionWithVerification(request);
        if (!sessionValidation.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Block unverified users from importing
        if (!sessionValidation.isEmailVerified) {
            return NextResponse.json({
                success: false,
                error: 'Please verify your email address to import utilities.',
                requiresVerification: true
            }, { status: 403 });
        }

        const { mapName, utilities } = await request.json();

        // Ensure the map exists
        let map = await prisma.map.findUnique({
            where: { name: mapName }
        });

        if (!map) {
            const displayName = mapName.charAt(0).toUpperCase() + mapName.slice(1);
            map = await prisma.map.create({
                data: {
                    name: mapName,
                    displayName: displayName,
                }
            });
        }

        const importedUtilities: TUtilityLandingPoint[] = [];

        // Import each utility
        for (const utility of utilities) {
            // Create the landing point
            const newUtility = await prisma.utility.create({
                data: {
                    mapId: map.id,
                    utilityType: utility.utilityType,
                    team: utility.team,
                    title: utility.title,
                    description: utility.description,
                    landingPointX: utility.position.X,
                    landingPointY: utility.position.Y,
                    createdBy: sessionValidation.userId!
                }
            });

            // Create throwing points for this utility
            for (const throwingPoint of utility.throwingPoints) {
                await prisma.throwingPoint.create({
                    data: {
                        utilityId: newUtility.id,
                        positionX: throwingPoint.position.X,
                        positionY: throwingPoint.position.Y,
                        title: throwingPoint.title,
                        description: throwingPoint.description
                    }
                });
            }

            // Transform back to the expected format
            const importedUtility: TUtilityLandingPoint = {
                id: newUtility.id,
                map: mapName,
                utilityType: newUtility.utilityType,
                team: newUtility.team,
                title: newUtility.title,
                description: newUtility.description || '',
                position: {
                    X: newUtility.landingPointX,
                    Y: newUtility.landingPointY
                },
                throwingPoints: utility.throwingPoints.map((tp: TUtilityThrowingPoint) => ({
                    id: tp.id,
                    position: tp.position,
                    title: tp.title,
                    description: tp.description || '',
                    url: tp.url
                }))
            };

            importedUtilities.push(importedUtility);
        }


        return NextResponse.json({
            success: true,
            data: importedUtilities,
            message: `Successfully imported ${importedUtilities.length} utilities`
        });
    } catch (error) {
        console.error('Error importing utilities:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 