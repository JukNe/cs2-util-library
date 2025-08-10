import { put, del, head, PutBlobResult } from '@vercel/blob';
import prisma from './prisma';
import { Media } from '@/generated/prisma/index';
import {
  compressImage,
  getImageMetadata,
  getOptimalCompressionSettings,
  shouldCompressImage
} from './image-compression';

export interface UploadBlobOptions {
  filename: string;
  file: File | Buffer;
  type: 'image' | 'video' | 'gif';
  title?: string;
  description?: string;
  userId?: string;
  utilityId?: string;
  throwingPointId?: string;
}

export interface BlobUploadResult {
  blob: PutBlobResult; // Vercel blob result
  media: Media; // Prisma media record
}

/**
 * Upload a file to Vercel Blob storage and save the reference to the database
 */
export async function uploadBlobToDatabase(options: UploadBlobOptions): Promise<BlobUploadResult> {
  try {
    console.log('Starting uploadBlobToDatabase...');
    console.log('Prisma client:', prisma);
    console.log('Prisma client type:', typeof prisma);
    console.log('Prisma media model:', prisma?.media);
    console.log('Prisma media model type:', typeof prisma?.media);

    if (!prisma) {
      throw new Error('Prisma client is undefined');
    }

    if (!prisma.media) {
      throw new Error('Prisma media model is undefined');
    }

    let fileToUpload: File | Buffer = options.file;
    let filename = options.filename;
    let compressionInfo = null;

    // Apply image compression for image types
    if (options.type === 'image' || options.type === 'gif') {
      try {
        // Convert File to Buffer for processing
        const fileBuffer = options.file instanceof File
          ? Buffer.from(await options.file.arrayBuffer())
          : options.file;

        // Get image metadata
        const metadata = await getImageMetadata(fileBuffer);
        console.log('Image metadata:', metadata);

        // Check if compression is needed
        if (shouldCompressImage(metadata.width!, metadata.height!, metadata.format!, metadata.size)) {
          console.log('Compressing image...');

          // Get optimal compression settings
          const compressionSettings = getOptimalCompressionSettings(
            metadata.width!,
            metadata.height!,
            metadata.format!,
            metadata.size
          );

          // Compress the image
          const compressedResult = await compressImage(fileBuffer, compressionSettings);

          console.log(`Image compressed: ${compressedResult.originalSize} -> ${compressedResult.compressedSize} bytes (${compressedResult.compressionRatio.toFixed(1)}% reduction)`);

          // Update file to upload and filename
          fileToUpload = compressedResult.buffer;

          // Update filename extension to match new format
          const baseName = filename.split('.')[0];
          filename = `${baseName}.${compressedResult.format}`;

          compressionInfo = {
            originalSize: compressedResult.originalSize,
            compressedSize: compressedResult.compressedSize,
            compressionRatio: compressedResult.compressionRatio,
            originalFormat: metadata.format,
            compressedFormat: compressedResult.format
          };
        } else {
          console.log('Image does not need compression');
        }
      } catch (compressionError) {
        console.warn('Image compression failed, uploading original:', compressionError);
        // Continue with original file if compression fails
      }
    }

    // Upload to Vercel Blob
    const blob = await put(filename, fileToUpload, {
      access: 'public',
    });

    console.log('Blob uploaded successfully:', blob.url);
    if (compressionInfo) {
      console.log('Compression info:', compressionInfo);
    }

    // Save to database
    const media = await prisma.media.create({
      data: {
        url: blob.url,
        type: options.type,
        title: options.title,
        description: options.description,
        userId: options.userId,
        utilityId: options.utilityId,
        throwingPointId: options.throwingPointId,
      },
    });

    console.log('Media saved to database:', media);

    return { blob, media };
  } catch (error) {
    console.error('Error uploading blob:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    throw error;
  }
}

/**
 * Delete a blob from Vercel Blob storage and remove from database
 */
export async function deleteBlobFromDatabase(mediaId: string): Promise<void> {
  try {
    // Get the media record from database
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
    });

    if (!media) {
      throw new Error('Media record not found');
    }

    // Delete from Vercel Blob
    await del(media.url);

    // Delete from database
    await prisma.media.delete({
      where: { id: mediaId },
    });
  } catch (error) {
    console.error('Error deleting blob:', error);
    throw error;
  }
}

/**
 * Get blob details from Vercel Blob storage
 */
export async function getBlobDetails(url: string) {
  try {
    return await head(url);
  } catch (error) {
    console.error('Error getting blob details:', error);
    throw error;
  }
}

/**
 * Get all media for a utility
 */
export async function getUtilityMedia(utilityId: string): Promise<Media[]> {
  return await prisma.media.findMany({
    where: { utilityId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get all media for a throwing point
 */
export async function getThrowingPointMedia(throwingPointId: string): Promise<Media[]> {
  return await prisma.media.findMany({
    where: { throwingPointId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Update media metadata in database
 */
export async function updateMediaMetadata(
  mediaId: string,
  updates: { title?: string; description?: string }
): Promise<Media> {
  return await prisma.media.update({
    where: { id: mediaId },
    data: updates,
  });
}

/**
 * Get all media for a user
 */
export async function getUserMedia(userId: string): Promise<Media[]> {
  return await prisma.media.findMany({
    where: {
      OR: [
        {
          utility: {
            createdBy: userId
          }
        },
        {
          throwingPoint: {
            utility: {
              createdBy: userId
            }
          }
        }
      ]
    },
    include: {
      utility: {
        select: {
          id: true,
          title: true,
          map: {
            select: {
              name: true,
              displayName: true
            }
          }
        }
      },
      throwingPoint: {
        select: {
          id: true,
          title: true,
          utility: {
            select: {
              id: true,
              title: true,
              map: {
                select: {
                  name: true,
                  displayName: true
                }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get all unattached media for a user (media that is not linked to any utility or throwing point)
 */
export async function getUserUnattachedMedia(userId: string): Promise<Media[]> {
  return await prisma.media.findMany({
    where: {
      userId: userId,
      utilityId: null,
      throwingPointId: null
    },
    orderBy: { createdAt: 'desc' },
  });
} 