import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ 
        success: false, 
        error: 'Verification token is required' 
      }, { status: 400 });
    }

    // Find the verification record
    const verification = await prisma.verification.findUnique({
      where: { id: token }
    });

    if (!verification) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid or expired verification token' 
      }, { status: 400 });
    }

    // Check if token has expired (24 hours)
    const now = new Date();
    const tokenAge = now.getTime() - verification.createdAt!.getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    if (tokenAge > maxAge) {
      // Delete expired verification
      await prisma.verification.delete({
        where: { id: token }
      });

      return NextResponse.json({ 
        success: false, 
        error: 'Verification token has expired. Please request a new one.' 
      }, { status: 400 });
    }

    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: verification.identifier }
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

    // Update user to verified
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: now
      }
    });

    // Delete the verification record
    await prisma.verification.delete({
      where: { id: token }
    });

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name);

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! Welcome to CS2 Utility Library!'
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 