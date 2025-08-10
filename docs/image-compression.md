# Image Compression

This document describes the image compression feature implemented to reduce database storage usage and improve upload performance.

## Overview

The image compression system automatically compresses uploaded images before storing them in the database. This helps prevent database storage limits from being reached and improves overall application performance.

## Features

### Automatic Compression
- Images are automatically compressed during upload
- Compression is applied based on image characteristics (size, dimensions, format)
- Original images are preserved if compression fails

### Smart Compression Settings
The system uses different compression settings based on image size:

- **Very Large Images (>10MB)**: Aggressive compression (70% quality, max 1600x900)
- **Large Images (5-10MB)**: Moderate compression (75% quality, max 1920x1080)
- **Medium Images (1-5MB)**: Standard compression (80% quality, max 1920x1080)
- **Small Images (<1MB)**: High quality compression (85% quality, max 1920x1080)

### Format Optimization
- Images are converted to WebP format for better compression
- Maintains quality while significantly reducing file size
- Supports JPEG, PNG, and WebP input formats

### Compression Criteria
Images are compressed if they meet any of these criteria:
- File size > 500KB
- Dimensions > 1920x1080
- Format is not WebP

## Implementation

### Files Modified
- `src/lib/image-compression.ts` - Core compression logic
- `src/lib/blob-storage.ts` - Integration with upload process
- `src/app/api/media/upload/route.ts` - Upload endpoint (transparent integration)

### Dependencies
- `sharp` - High-performance image processing library

## Benefits

1. **Reduced Storage Usage**: Significantly smaller file sizes
2. **Faster Uploads**: Smaller files upload faster
3. **Better Performance**: Faster page loads due to smaller images
4. **Cost Savings**: Reduced storage costs
5. **Database Protection**: Prevents storage limit issues

## Monitoring

The system logs compression information including:
- Original file size
- Compressed file size
- Compression ratio
- Original and compressed formats

## Testing

Run the image compression tests:
```bash
yarn test src/__tests__/lib/image-compression.test.ts
```

## Configuration

Compression settings can be adjusted in `src/lib/image-compression.ts`:
- Quality levels
- Maximum dimensions
- Compression thresholds
- Output formats

## Error Handling

- If compression fails, the original image is uploaded
- Detailed error logging for debugging
- Graceful fallback to prevent upload failures
