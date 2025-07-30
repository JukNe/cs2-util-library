import { useRef, useState, useCallback, useMemo } from 'react';
import { Media } from '@/types/media';
import { BsCloudUpload, BsFileEarmarkImage, BsFileEarmarkPlay } from 'react-icons/bs';
import './style.scss';

// Constants
const VALID_EXTENSIONS = {
    image: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    video: ['mp4', 'webm', 'mov', 'avi'],
} as const;

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

interface MediaUploaderProps {
    utilityId?: string;
    throwingPointId?: string;
    onUploadComplete?: (media: Media) => void;
    maxFileSize?: number;
    allowedTypes?: ('image' | 'video')[];
}

// Utility functions
const getFileExtension = (fileName: string): string | undefined => {
    return fileName.split('.').pop()?.toLowerCase();
};

const getFileType = (extension: string): 'image' | 'video' | 'gif' => {
    if (extension === 'gif') return 'gif';
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

const validateFile = (file: File, maxFileSize: number): string | null => {
    const extension = getFileExtension(file.name);

    if (!extension) {
        return 'File must have a valid extension';
    }

    const validExtensions = [...VALID_EXTENSIONS.image, ...VALID_EXTENSIONS.video];
    if (!validExtensions.includes(extension as typeof validExtensions[number])) {
        return `Invalid file type. Allowed: ${validExtensions.join(', ')}`;
    }

    if (file.size > maxFileSize) {
        return `File size must be less than ${formatFileSize(maxFileSize)}`;
    }

    return null;
};

const MediaUploader = ({
    utilityId,
    throwingPointId,
    onUploadComplete,
    maxFileSize = MAX_FILE_SIZE,
    allowedTypes = ['image', 'video']
}: MediaUploaderProps) => {
    const inputFileRef = useRef<HTMLInputElement>(null);
    const dropZoneRef = useRef<HTMLDivElement>(null);

    const [uploading, setUploading] = useState(false);
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

        const validationError = validateFile(file, maxFileSize);
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

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const extension = getFileExtension(selectedFile.name);
            const type = extension ? getFileType(extension) : 'image';

            formData.append('type', type);
            formData.append('title', selectedFile.name);

            if (utilityId) {
                formData.append('utilityId', utilityId);
            }

            if (throwingPointId) {
                formData.append('throwingPointId', throwingPointId);
            }

            const response = await fetch('/api/media/upload-simple', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Upload failed: ${response.status}`);
            }

            const result = await response.json();
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
        <div className="media-uploader" role="region" aria-label="Media uploader">
            <div
                ref={dropZoneRef}
                className={`drop-zone ${isDragOver ? 'drag-over' : ''} ${selectedFile ? 'file-selected' : ''}`}
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
                    <div className="upload-prompt">
                        <BsCloudUpload size="3em" className="upload-icon" aria-hidden="true" />
                        <p className="upload-text">Click or drag files here to upload</p>
                        <p className="upload-hint">
                            Supports {allowedTypes.join(' and ')} files up to {formatFileSize(maxFileSize)}
                        </p>
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
                )}
            </div>

            {error && (
                <div className="upload-error" role="alert" id="upload-error">
                    <p>❌ {error}</p>
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