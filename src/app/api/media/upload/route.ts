import { NextRequest, NextResponse } from 'next/server';
import { uploadBlobToDatabase } from '@/lib/blob-storage';
import { validateSession } from '@/lib/session';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as 'image' | 'video' | 'gif';
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const utilityId = formData.get('utilityId') as string;
    const throwingPointId = formData.get('throwingPointId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ error: 'Media type is required' }, { status: 400 });
    }

    // Validate session
    const sessionValidation = await validateSession(request);
    if (!sessionValidation.success) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }

    // Validate file type
    const allowedTypes = ['image', 'video', 'gif'];
    if (!allowedTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
    }

    // If utilityId is provided, verify the user owns the utility
    if (utilityId) {
      const utility = await prisma.utility.findUnique({
        where: { id: utilityId },
        select: { createdBy: true }
      });

      if (!utility) {
        return NextResponse.json({
          success: false,
          error: 'Utility not found'
        }, { status: 404 });
      }

      if (utility.createdBy !== sessionValidation.userId) {
        return NextResponse.json({
          success: false,
          error: 'You can only upload media for your own utilities'
        }, { status: 403 });
      }
    }

    // If throwingPointId is provided, verify the user owns the throwing point
    if (throwingPointId) {
      const throwingPoint = await prisma.throwingPoint.findUnique({
        where: { id: throwingPointId },
        include: {
          utility: {
            select: { createdBy: true }
          }
        }
      });

      if (!throwingPoint) {
        return NextResponse.json({
          success: false,
          error: 'Throwing point not found'
        }, { status: 404 });
      }

      if (throwingPoint.utility.createdBy !== sessionValidation.userId) {
        return NextResponse.json({
          success: false,
          error: 'You can only upload media for your own throwing points'
        }, { status: 403 });
      }
    }

    // If neither utilityId nor throwingPointId is provided, this creates unattached media
    // No additional validation needed - the media will be owned by the user but not attached to anything

    // Generate a unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const filename = `${type}/${timestamp}-${Math.random().toString(36).substring(2)}.${extension}`;

    const result = await uploadBlobToDatabase({
      filename,
      file,
      type,
      title,
      description,
      userId: sessionValidation.userId!,
      utilityId: utilityId || undefined,
      throwingPointId: throwingPointId || undefined,
    });

    return NextResponse.json({
      success: true,
      blob: result.blob,
      media: result.media,
    });
  } catch (error) {
    console.error('Error uploading media:', error);
    return NextResponse.json(
      { error: 'Failed to upload media' },
      { status: 500 }
    );
  }
} 