import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email } = body;
        
        const user = await prisma.user.findUnique({
            where: { email }
        });
        
        if (!user) {
            return NextResponse.json({ 
                success: false, 
                error: 'User not found'
            }, { status: 404 });
        }
        
        // Return user info without password for security
        const { password, ...userInfo } = user;
        
        return NextResponse.json({ 
            success: true, 
            user: userInfo,
            passwordLength: password?.length || 0,
            passwordStartsWith: password?.substring(0, 10) || 'N/A'
        });
    } catch (error) {
        console.error('Check user error:', error);
        return NextResponse.json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 