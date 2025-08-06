import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendVerificationEmail } from '@/lib/email';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email is required' 
      }, { status: 400 });
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }

    // Check if user is already verified
    if (user.emailVerified) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email is already verified' 
      }, { status: 400 });
    }

    // Delete any existing verification records for this user
    await prisma.verification.deleteMany({
      where: { identifier: email }
    });

    // Create new verification token
    const verificationToken = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.verification.create({
      data: {
        id: verificationToken,
        identifier: email,
        value: verificationToken,
        expiresAt,
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
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to send verification email' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully'
    });
  } catch (error) {
    console.error('Error resending verification email:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 