import { useRef, useState, useCallback, useMemo } from 'react';
import { Media } from '@/types/media';
import { BsCloudUpload, BsFileEarmarkImage, BsFileEarmarkPlay } from 'react-icons/bs';
import './style.scss';

// Constants
const VALID_EXTENSIONS = {
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    video: ['mp4', 'webm', 'mov', 'avi'],
} as const;

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

interface MediaUploaderProps {
    utilityId?: string;
    throwingPointId?: string;
    onUploadComplete?: (media: Media) => void;
    maxFileSize?: number; // Deprecated: kept for backward compatibility
    allowedTypes?: ('image' | 'video')[];
    variant?: 'default' | 'standalone';
}

// Utility functions
const getFileExtension = (fileName: string): string | undefined => {
    return fileName.split('.').pop()?.toLowerCase();
};

const getFileType = (extension: string): 'image' | 'video' => {
    if (VALID_EXTENSIONS.video.includes(extension as typeof VALID_EXTENSIONS.video[number])) return 'video';
    return 'image';
};

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileSizeLimit = (fileType: 'image' | 'video'): number => {
    return fileType === 'video' ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
};

const validateFile = (file: File): string | null => {
    const extension = getFileExtension(file.name);

    if (!extension) {
        return 'File must have a valid extension';
    }

    const validExtensions = [...VALID_EXTENSIONS.image, ...VALID_EXTENSIONS.video];
    if (!validExtensions.includes(extension as typeof validExtensions[number])) {
        return `Invalid file type. Allowed: ${validExtensions.join(', ')}`;
    }

    // Determine file type and apply appropriate size limit
    const fileType = getFileType(extension);
    const maxSize = getFileSizeLimit(fileType);

    if (file.size > maxSize) {
        const maxSizeFormatted = formatFileSize(maxSize);
        const fileTypeName = fileType === 'video' ? 'video' : 'image';
        return `${fileTypeName.charAt(0).toUpperCase() + fileTypeName.slice(1)} files must be less than ${maxSizeFormatted}`;
    }

    return null;
};

const MediaUploader = ({
    utilityId,
    throwingPointId,
    onUploadComplete,
    maxFileSize, // Keep for backward compatibility but not used
    allowedTypes = ['image', 'video'],
    variant = 'default'
}: MediaUploaderProps) => {
    const inputFileRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);

    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedMedia, setUploadedMedia] = useState<Media | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Memoized values
    const fileIcon = useMemo(() => {
        if (!selectedFile) return null;
        const extension = getFileExtension(selectedFile.name);
        const isVideo = extension ? VALID_EXTENSIONS.video.includes(extension as typeof VALID_EXTENSIONS.video[number]) : false;
        return isVideo ? <BsFileEarmarkPlay size="2em" /> : <BsFileEarmarkImage size="2em" />;
    }, [selectedFile]);

    const fileSize = useMemo(() => {
        return selectedFile ? formatFileSize(selectedFile.size) : '';
    }, [selectedFile]);

    const handleFileSelect = useCallback((file: File) => {
        setError(null);

        const validationError = validateFile(file);
        if (validationError) {
            setError(validationError);
            return;
        }

        setSelectedFile(file);
    }, [maxFileSize]);

    const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    }, [handleFileSelect]);

    const handleDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        // Only set to false if we're leaving the drop zone entirely
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
            setIsDragOver(false);
        }
    }, []);

    const handleDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        setIsDragOver(false);

        const files = event.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    }, [handleFileSelect]);

    const handleUpload = useCallback(async () => {
        if (!selectedFile) {
            setError("No file selected");
            return;
        }

        setUploading(true);
        setError(null);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const extension = getFileExtension(selectedFile.name);
            const fileType = extension ? getFileType(extension) : 'image';
            const type = extension === 'gif' ? 'gif' : fileType;

            formData.append('type', type);
            formData.append('title', selectedFile.name);

            if (utilityId) {
                formData.append('utilityId', utilityId);
            }

            if (throwingPointId) {
                formData.append('throwingPointId', throwingPointId);
            }

            const response = await fetch('/api/media/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Upload failed: ${response.status}`);
            }

            const result = await response.json();
            setUploadProgress(100);
            setUploadedMedia(result.media);

            if (onUploadComplete) {
                onUploadComplete(result.media);
            }

            // Reset form
            setSelectedFile(null);
            if (inputFileRef.current) {
                inputFileRef.current.value = '';
            }
        } catch (error) {
            console.error('Upload error:', error);
            setError(error instanceof Error ? error.message : 'Upload failed. Please try again.');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    }, [selectedFile, utilityId, throwingPointId, onUploadComplete]);

    const handleClickUpload = useCallback(() => {
        inputFileRef.current?.click();
    }, []);

    const handleRemoveFile = useCallback((event: React.MouseEvent) => {
        event.stopPropagation();
        setSelectedFile(null);
        setError(null);
        if (inputFileRef.current) {
            inputFileRef.current.value = '';
        }
    }, []);

    const handleUploadClick = useCallback((event: React.MouseEvent) => {
        event.stopPropagation();
        handleUpload();
    }, [handleUpload]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            if (selectedFile) {
                handleUpload();
            } else {
                handleClickUpload();
            }
        }
    }, [selectedFile, handleUpload, handleClickUpload]);

    return (
        <div className={`media-uploader ${variant === 'standalone' ? 'standalone-media-uploader' : ''}`} role="region" aria-label="Media uploader">
            <div
                ref={dropZoneRef}
                className={`${variant === 'standalone' ? 'upload-area' : 'drop-zone'} ${isDragOver ? 'drag-over' : ''} ${selectedFile ? 'file-selected' : ''} ${uploading ? 'uploading' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleClickUpload}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                role="button"
                aria-label={selectedFile ? `Selected file: ${selectedFile.name}` : "Click or drag files here to upload"}
                aria-describedby={error ? "upload-error" : undefined}
            >
                <input
                    ref={inputFileRef}
                    type="file"
                    accept={allowedTypes.map(type =>
                        type === 'image' ? 'image/*' : 'video/*'
                    ).join(',') + ',.gif'}
                    onChange={handleFileInputChange}
                    style={{ display: 'none' }}
                    aria-hidden="true"
                />

                {!selectedFile ? (
                    <div className={variant === 'standalone' ? 'upload-content' : 'upload-prompt'}>
                        <BsCloudUpload size="3em" className="upload-icon" aria-hidden="true" />
                        {variant === 'standalone' ? (
                            <>
                                <h3>Upload Media</h3>
                                <p>Drag and drop files here or click to browse</p>
                                <div className="file-types">
                                    <p>Supported formats:</p>
                                    <div className="type-icons">
                                        <span className="type-icon">
                                            <BsFileEarmarkImage size="1.2em" />
                                            Images (JPG, PNG, WebP, GIF)
                                        </span>
                                        <span className="type-icon">
                                            <BsFileEarmarkPlay size="1.2em" />
                                            Videos (MP4, WebM, MOV, AVI)
                                        </span>
                                    </div>
                                </div>
                                <p className="file-size-limit">
                                    Maximum file size: Images 10MB, Videos 50MB
                                </p>
                            </>
                        ) : (
                            <>
                                <p className="upload-text">Click or drag files here to upload</p>
                                <p className="upload-hint">
                                    Supports {allowedTypes.join(' and ')} files (Images: 10MB, Videos: 50MB)
                                </p>
                            </>
                        )}
                    </div>
                ) : (
                    variant === 'standalone' && uploading ? (
                        <div className="upload-progress">
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <p>Uploading... {uploadProgress}%</p>
                        </div>
                    ) : (
                        <div className="file-preview">
                            {fileIcon}
                            <p className="file-name" title={selectedFile.name}>{selectedFile.name}</p>
                            <p className="file-size">{fileSize}</p>
                            <button
                                className="upload-button"
                                onClick={handleUploadClick}
                                disabled={uploading}
                                aria-label={uploading ? 'Uploading file...' : 'Upload file'}
                            >
                                {uploading ? 'Uploading...' : 'Upload File'}
                            </button>
                            <button
                                className="remove-button"
                                onClick={handleRemoveFile}
                                aria-label="Remove selected file"
                            >
                                Remove
                            </button>
                        </div>
                    )
                )}
            </div>

            {error && (
                <div className="upload-error" role="alert" id="upload-error">
                    <p>{variant === 'standalone' ? error : `❌ ${error}`}</p>
                    {variant === 'standalone' && (
                        <button onClick={() => setError(null)}>Dismiss</button>
                    )}
                </div>
            )}

            {uploadedMedia && (
                <div className="upload-success" role="status">
                    <p>✅ Upload successful!</p>
                    <p>File: {uploadedMedia.title}</p>
                    <p>Type: {uploadedMedia.type}</p>
                    <a
                        href={uploadedMedia.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`View uploaded ${uploadedMedia.type} file`}
                    >
                        View File
                    </a>
                </div>
            )}
        </div>
    );
};

export default MediaUploader;