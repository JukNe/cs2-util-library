import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, rememberMe, callbackURL } = body;

        console.log('=== CUSTOM SIGNIN DEBUG ===');
        console.log('Signin attempt for email:', email);

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            console.log('User not found');
            return NextResponse.json({
                success: false,
                error: "Invalid email or password"
            }, { status: 401 });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            console.log('Invalid password');
            return NextResponse.json({
                success: false,
                error: "Invalid email or password"
            }, { status: 401 });
        }

        console.log('Password verified successfully');

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
            path: '/'
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