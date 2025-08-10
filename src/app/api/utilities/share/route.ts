import { NextRequest, NextResponse } from 'next/server';
import { validateSessionWithVerification } from '@/lib/session';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        // Validate session with verification status
        const sessionValidation = await validateSessionWithVerification(request);
        if (!sessionValidation.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Block unverified users from sharing
        if (!sessionValidation.isEmailVerified) {
            return NextResponse.json({
                success: false,
                error: 'Please verify your email address to share utilities.',
                requiresVerification: true
            }, { status: 403 });
        }

        const { mapName, shareCode, description } = await request.json();

        // Save the share record to database
        const shareRecord = await prisma.utilityShare.create({
            data: {
                shareCode,
                mapName,
                description: description || null,
                sharedBy: sessionValidation.userId!,
                sharedAt: new Date()
            }
        });

        return NextResponse.json({
            success: true,
            shareId: shareRecord.id
        });
    } catch (error) {
        console.error('Error sharing utilities:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    try {
        // Validate session with verification status
        const sessionValidation = await validateSessionWithVerification(request);
        if (!sessionValidation.success) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's shared utilities
        const sharedUtilities = await prisma.utilityShare.findMany({
            where: {
                sharedBy: sessionValidation.userId!
            },
            orderBy: {
                sharedAt: 'desc'
            }
        });

        return NextResponse.json({
            success: true,
            data: sharedUtilities
        });
    } catch (error) {
        console.error('Error fetching shared utilities:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 