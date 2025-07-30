import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        // Get session token from cookies
        const sessionToken = request.cookies.get('session')?.value;

        if (sessionToken) {
            // Delete session from database
            await prisma.session.deleteMany({
                where: { token: sessionToken }
            });
        }

        // Create response
        const response = NextResponse.json({
            success: true,
            message: 'Logged out successfully'
        });

        // Clear session cookie
        response.cookies.set('session', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: new Date(0), // Expire immediately
            path: '/'
        });

        return response;

    } catch (error) {
        console.error('Logout error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 