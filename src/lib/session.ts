import { NextRequest } from 'next/server';
import prisma from './prisma';

export async function validateSession(request: NextRequest) {
    const sessionToken = request.cookies.get('session')?.value;

    if (!sessionToken) {
        return { success: false, userId: null, user: null };
    }

    // Find session in database
    const dbSession = await prisma.session.findUnique({
        where: { token: sessionToken },
        include: { user: true }
    });

    // Check if session exists and is not expired
    if (!dbSession || dbSession.expiresAt <= new Date()) {
        return { success: false, userId: null, user: null };
    }

    return {
        success: true,
        userId: dbSession.user.id,
        user: dbSession.user
    };
}

export async function validateSessionWithVerification(request: NextRequest) {
    const sessionValidation = await validateSession(request);

    if (!sessionValidation.success) {
        return {
            success: false,
            userId: null,
            user: null,
            isEmailVerified: false
        };
    }

    return {
        ...sessionValidation,
        isEmailVerified: sessionValidation.user?.emailVerified || false
    };
}

export async function checkUnverifiedUserLimits(userId: string) {
    // Count existing utilities for this user
    const utilityCount = await prisma.utility.count({
        where: { createdBy: userId }
    });

    // Count existing throwing points for this user
    const throwingPointCount = await prisma.throwingPoint.count({
        where: {
            utility: {
                createdBy: userId
            }
        }
    });

    return {
        canCreateUtility: utilityCount < 1,
        canCreateThrowingPoint: throwingPointCount < 1,
        utilityCount,
        throwingPointCount
    };
} 