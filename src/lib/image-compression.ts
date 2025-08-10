import sharp from 'sharp';

export interface ImageCompressionOptions {
    quality?: number; // 1-100, default 80
    maxWidth?: number; // default 1920
    maxHeight?: number; // default 1080
    format?: 'jpeg' | 'webp' | 'png'; // default 'webp'
}

export interface CompressedImageResult {
    buffer: Buffer;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    format: string;
}

/**
 * Compress an image using Sharp
 */
export async function compressImage(
    inputBuffer: Buffer,
    options: ImageCompressionOptions = {}
): Promise<CompressedImageResult> {
    const {
        quality = 80,
        maxWidth = 1920,
        maxHeight = 1080,
        format = 'webp'
    } = options;

    const originalSize = inputBuffer.length;

    // Create sharp instance
    let sharpInstance = sharp(inputBuffer);

    // Resize if needed while maintaining aspect ratio
    sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
    });

    // Apply format-specific compression
    let compressedBuffer: Buffer;
    let outputFormat: string;

    switch (format) {
        case 'jpeg':
            compressedBuffer = await sharpInstance
                .jpeg({ quality, progressive: true })
                .toBuffer();
            outputFormat = 'jpeg';
            break;
        case 'png':
            compressedBuffer = await sharpInstance
                .png({ quality, progressive: true })
                .toBuffer();
            outputFormat = 'png';
            break;
        case 'webp':
        default:
            compressedBuffer = await sharpInstance
                .webp({ quality, effort: 6 })
                .toBuffer();
            outputFormat = 'webp';
            break;
    }

    const compressedSize = compressedBuffer.length;
    const compressionRatio = ((originalSize - compressedSize) / originalSize) * 100;

    return {
        buffer: compressedBuffer,
        originalSize,
        compressedSize,
        compressionRatio,
        format: outputFormat
    };
}

/**
 * Get image metadata without processing
 */
export async function getImageMetadata(inputBuffer: Buffer) {
    const metadata = await sharp(inputBuffer).metadata();
    return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: inputBuffer.length,
        hasAlpha: metadata.hasAlpha
    };
}

/**
 * Determine optimal compression settings based on image characteristics
 */
export function getOptimalCompressionSettings(
    width: number,
    height: number,
    format: string,
    size: number
): ImageCompressionOptions {
    // For very large images, be more aggressive with compression
    if (size > 10 * 1024 * 1024) { // > 10MB
        return {
            quality: 70,
            maxWidth: 1600,
            maxHeight: 900,
            format: 'webp'
        };
    }

    // For large images
    if (size > 5 * 1024 * 1024) { // > 5MB
        return {
            quality: 75,
            maxWidth: 1920,
            maxHeight: 1080,
            format: 'webp'
        };
    }

    // For medium images
    if (size > 1 * 1024 * 1024) { // > 1MB
        return {
            quality: 80,
            maxWidth: 1920,
            maxHeight: 1080,
            format: 'webp'
        };
    }

    // For small images, just convert to webp for better compression
    return {
        quality: 85,
        maxWidth: 1920,
        maxHeight: 1080,
        format: 'webp'
    };
}

/**
 * Check if an image should be compressed based on its characteristics
 */
export function shouldCompressImage(
    width: number,
    height: number,
    format: string,
    size: number
): boolean {
    // Always compress if image is larger than 500KB
    if (size > 500 * 1024) {
        return true;
    }

    // Compress if dimensions are very large
    if (width > 1920 || height > 1080) {
        return true;
    }

    // Compress if format is not webp (convert to webp for better compression)
    if (format !== 'webp') {
        return true;
    }

    return false;
}
