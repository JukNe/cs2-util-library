import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
    try {
        console.log('Media upload request received');

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const type = formData.get('type') as 'image' | 'video' | 'gif';
        const title = formData.get('title') as string;
        const description = formData.get('description') as string;
        const utilityId = formData.get('utilityId') as string;
        const throwingPointId = formData.get('throwingPointId') as string;

        console.log('Form data parsed:', {
            fileName: file?.name,
            fileSize: file?.size,
            type,
            title,
            utilityId,
            throwingPointId
        });

        if (!file) {
            console.error('No file provided');
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!type) {
            console.error('Media type is required');
            return NextResponse.json({ error: 'Media type is required' }, { status: 400 });
        }

        // Validate file type
        const allowedTypes = ['image', 'video', 'gif'];
        if (!allowedTypes.includes(type)) {
            console.error('Invalid media type:', type);
            return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
        }

        // Generate a unique filename
        const timestamp = Date.now();
        const extension = file.name.split('.').pop();
        const filename = `${type}/${timestamp}-${Math.random().toString(36).substring(2)}.${extension}`;

        console.log('Starting blob upload with filename:', filename);

        // Upload to Vercel Blob
        const blob = await put(filename, file, {
            access: 'public',
        });

        console.log('Blob uploaded successfully:', blob.url);

        // Save to database using Prisma client
        const media = await prisma.media.create({
            data: {
                url: blob.url,
                type: type,
                title: title,
                description: description,
                utilityId: utilityId || undefined,
                throwingPointId: throwingPointId || undefined,
            },
        });

        console.log('Media saved to database:', media);

        return NextResponse.json({
            success: true,
            blob: blob,
            media: media,
        });
    } catch (error) {
        console.error('Error uploading media:', error);
        console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

        return NextResponse.json(
            {
                error: 'Failed to upload media',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 