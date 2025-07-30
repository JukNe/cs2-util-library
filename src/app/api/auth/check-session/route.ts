import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        // Get session token from cookies
        const sessionToken = request.cookies.get('session')?.value;

        if (!sessionToken) {
            return NextResponse.json({
                success: false,
                session: null
            });
        }

        // Find session in database
        const dbSession = await prisma.session.findUnique({
            where: { token: sessionToken },
            include: { user: true }
        });

        // Check if session exists and is not expired
        if (!dbSession || dbSession.expiresAt <= new Date()) {
            return NextResponse.json({
                success: false,
                session: null
            });
        }

        return NextResponse.json({
            success: true,
            session: {
                user: {
                    id: dbSession.user.id,
                    name: dbSession.user.name,
                    email: dbSession.user.email,
                    emailVerified: dbSession.user.emailVerified,
                    image: dbSession.user.image
                }
            }
        });

    } catch (error) {
        console.error('Check session error:', error);
        return NextResponse.json({
            success: false,
            session: null,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 