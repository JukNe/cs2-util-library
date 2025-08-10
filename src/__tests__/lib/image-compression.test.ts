import {
    compressImage,
    getImageMetadata,
    getOptimalCompressionSettings,
    shouldCompressImage
} from '@/lib/image-compression';

// Mock sharp to avoid actual image processing in tests
jest.mock('sharp', () => {
    return jest.fn().mockImplementation(() => ({
        resize: jest.fn().mockReturnThis(),
        jpeg: jest.fn().mockReturnThis(),
        png: jest.fn().mockReturnThis(),
        webp: jest.fn().mockReturnThis(),
        toBuffer: jest.fn().mockResolvedValue(Buffer.from('compressed')), // Smaller buffer to simulate compression
        metadata: jest.fn().mockResolvedValue({
            width: 1920,
            height: 1080,
            format: 'jpeg',
            hasAlpha: false
        })
    }));
});

describe('Image Compression', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getImageMetadata', () => {
        it('should return image metadata', async () => {
            const mockBuffer = Buffer.from('fake-image-data');
            const metadata = await getImageMetadata(mockBuffer);

            expect(metadata).toEqual({
                width: 1920,
                height: 1080,
                format: 'jpeg',
                size: mockBuffer.length,
                hasAlpha: false
            });
        });
    });

    describe('shouldCompressImage', () => {
        it('should return true for large images', () => {
            const result = shouldCompressImage(1920, 1080, 'jpeg', 1024 * 1024); // 1MB
            expect(result).toBe(true);
        });

        it('should return true for images with large dimensions', () => {
            const result = shouldCompressImage(2560, 1440, 'jpeg', 100 * 1024); // 100KB but large dimensions
            expect(result).toBe(true);
        });

        it('should return true for non-webp formats', () => {
            const result = shouldCompressImage(800, 600, 'jpeg', 100 * 1024); // Small JPEG
            expect(result).toBe(true);
        });

        it('should return false for small webp images', () => {
            const result = shouldCompressImage(800, 600, 'webp', 100 * 1024); // Small WebP
            expect(result).toBe(false);
        });
    });

    describe('getOptimalCompressionSettings', () => {
        it('should return aggressive settings for very large images', () => {
            const settings = getOptimalCompressionSettings(1920, 1080, 'jpeg', 15 * 1024 * 1024); // 15MB
            expect(settings.quality).toBe(70);
            expect(settings.maxWidth).toBe(1600);
            expect(settings.maxHeight).toBe(900);
            expect(settings.format).toBe('webp');
        });

        it('should return moderate settings for large images', () => {
            const settings = getOptimalCompressionSettings(1920, 1080, 'jpeg', 7 * 1024 * 1024); // 7MB
            expect(settings.quality).toBe(75);
            expect(settings.maxWidth).toBe(1920);
            expect(settings.maxHeight).toBe(1080);
            expect(settings.format).toBe('webp');
        });

        it('should return standard settings for medium images', () => {
            const settings = getOptimalCompressionSettings(1920, 1080, 'jpeg', 2 * 1024 * 1024); // 2MB
            expect(settings.quality).toBe(80);
            expect(settings.maxWidth).toBe(1920);
            expect(settings.maxHeight).toBe(1080);
            expect(settings.format).toBe('webp');
        });

        it('should return high quality settings for small images', () => {
            const settings = getOptimalCompressionSettings(800, 600, 'jpeg', 500 * 1024); // 500KB
            expect(settings.quality).toBe(85);
            expect(settings.maxWidth).toBe(1920);
            expect(settings.maxHeight).toBe(1080);
            expect(settings.format).toBe('webp');
        });
    });

    describe('compressImage', () => {
        it('should compress image with default settings', async () => {
            const mockBuffer = Buffer.from('original-image-data');
            const result = await compressImage(mockBuffer);

            expect(result.buffer).toBeInstanceOf(Buffer);
            expect(result.originalSize).toBe(mockBuffer.length);
            expect(result.compressedSize).toBe(result.buffer.length);
            expect(result.compressionRatio).toBeGreaterThan(0);
            expect(result.format).toBe('webp');
        });

        it('should compress image with custom settings', async () => {
            const mockBuffer = Buffer.from('original-image-data');
            const result = await compressImage(mockBuffer, {
                quality: 90,
                maxWidth: 800,
                maxHeight: 600,
                format: 'jpeg'
            });

            expect(result.buffer).toBeInstanceOf(Buffer);
            expect(result.format).toBe('jpeg');
        });
    });
});
