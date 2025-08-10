import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { sendVerificationEmail } from '@/lib/email';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, password } = body;

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({
                success: false,
                error: "User already exists"
            }, { status: 409 });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user with hashed password
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
            }
        });



        // Create verification token
        const verificationToken = randomUUID();
        const verificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await prisma.verification.create({
            data: {
                id: verificationToken,
                identifier: email,
                value: verificationToken,
                expiresAt: verificationExpiresAt,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        // Send verification email
        const emailSent = await sendVerificationEmail({
            email: user.email,
            name: user.name,
            verificationToken
        });

        if (!emailSent) {
            console.error('Failed to send verification email to:', user.email);
        }

        // Create session for automatic sign-in
        const sessionToken = crypto.randomUUID();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Default to 7 days

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
                image: user.image,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            }
        });

        // Set session cookie for automatic sign-in
        response.cookies.set('session', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            expires: expiresAt,
            path: '/',
            maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
        });

        return response;

    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}