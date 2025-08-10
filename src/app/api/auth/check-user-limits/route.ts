import { NextRequest, NextResponse } from 'next/server';
import { validateSessionWithVerification, checkUnverifiedUserLimits } from '@/lib/session';

export async function GET(request: NextRequest) {
    try {
        // Validate session with verification status
        const sessionValidation = await validateSessionWithVerification(request);
        if (!sessionValidation.success) {
            return NextResponse.json({
                success: false,
                error: 'User not authenticated'
            }, { status: 401 });
        }

        // If user is verified, they have no limits
        if (sessionValidation.isEmailVerified) {
            return NextResponse.json({
                success: true,
                limits: {
                    canCreateUtility: true,
                    canCreateThrowingPoint: true,
                    utilityCount: -1, // No limit
                    throwingPointCount: -1 // No limit
                }
            });
        }

        // Check limits for unverified users
        const limits = await checkUnverifiedUserLimits(sessionValidation.userId!);

        return NextResponse.json({
            success: true,
            limits
        });
    } catch (error) {
        console.error('Error checking user limits:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
