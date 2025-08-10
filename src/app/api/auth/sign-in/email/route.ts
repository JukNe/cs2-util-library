import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, rememberMe } = body;

        

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
    
            return NextResponse.json({
                success: false,
                error: "Invalid email or password"
            }, { status: 401 });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
    
            return NextResponse.json({
                success: false,
                error: "Invalid email or password"
            }, { status: 401 });
        }



        // Create session manually in the database
        const sessionToken = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + (rememberMe ? 30 : 7)); // 30 days or 7 days

        await prisma.session.create({
            data: {
                token: sessionToken,
                userId: user.id,
                expiresAt,
                ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
                userAgent: request.headers.get('user-agent') || null,
            }
        });

        // Create response with session cookie
        const response = NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                emailVerified: user.emailVerified,
                image: user.image
            }
        });

        // Set session cookie
        response.cookies.set('session', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: expiresAt,
            path: '/',
            maxAge: (rememberMe ? 30 : 7) * 24 * 60 * 60 // Convert days to seconds
        });

        return response;

    } catch (error) {
        console.error('Signin error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            details: error
        }, { status: 500 });
    }
}