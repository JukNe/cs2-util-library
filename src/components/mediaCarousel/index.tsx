import { useState, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { Media } from '@/types/media';
import { BsChevronLeft, BsChevronRight, BsTrash, BsFullscreen, BsX, BsLink } from 'react-icons/bs';
import MediaUploader from '../mediaUploader';
import MediaAttacher from '../mediaAttacher';
import Image from 'next/image';
import './style.scss';

interface MediaCarouselProps {
    utilityId?: string;
    throwingPointId?: string;
    onMediaDeleted?: (mediaId: string) => void;
    showUploadSection?: boolean;
    isEditing?: boolean;
    onMediaDescriptionChange?: (mediaId: string, description: string) => void;
    pendingMediaChanges?: Record<string, string>;
    onMediaUploaded?: () => void;
}

export interface MediaCarouselRef {
    fetchMedia: () => void;
}

const MediaCarousel = forwardRef<MediaCarouselRef, MediaCarouselProps>(({
    utilityId,
    throwingPointId,
    onMediaDeleted,
    showUploadSection = false,
    isEditing = false,
    onMediaDescriptionChange,
    pendingMediaChanges,
    onMediaUploaded
}, ref) => {
    const [media, setMedia] = useState<Media[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isAttacherVisible, setIsAttacherVisible] = useState(false);

    const fetchMedia = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (utilityId) params.append('utilityId', utilityId);
            if (throwingPointId) params.append('throwingPointId', throwingPointId);

            const response = await fetch(`/api/media/get?${params}`);
            if (response.ok) {
                const data = await response.json();
                setMedia(data.media || []);
            }
        } catch (error) {
            console.error('Error fetching media:', error);
        } finally {
            setLoading(false);
        }
    }, [utilityId, throwingPointId]);

    // Expose fetchMedia function to parent component
    useImperativeHandle(ref, () => ({
        fetchMedia
    }));

    const handleMediaUploaded = () => {
        // Refresh the media carousel when new media is uploaded
        fetchMedia();
        // Notify parent component to invalidate cache
        if (onMediaUploaded) {
            onMediaUploaded();
        }

    };

    const handleDelete = async (mediaId: string) => {
        if (!confirm('Are you sure you want to delete this media?')) {
            return;
        }

        setDeleting(mediaId);
        try {
            const response = await fetch(`/api/media/delete?mediaId=${mediaId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                setMedia(prev => prev.filter(m => m.id !== mediaId));
                if (onMediaDeleted) {
                    onMediaDeleted(mediaId);
                }
                // Adjust current index if we deleted the current item
                if (currentIndex >= media.length - 1) {
                    setCurrentIndex(Math.max(0, media.length - 2));
                }
            } else {
                alert('Failed to delete media');
            }
        } catch (error) {
            console.error('Error deleting media:', error);
            alert('Failed to delete media');
        } finally {
            setDeleting(null);
        }
    };

    const nextSlide = useCallback(() => {
        setCurrentIndex((prevIndex) =>
            prevIndex === media.length - 1 ? 0 : prevIndex + 1
        );
    }, [media.length]);

    const prevSlide = useCallback(() => {
        setCurrentIndex((prevIndex) =>
            prevIndex === 0 ? media.length - 1 : prevIndex - 1
        );
    }, [media.length]);

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
    };

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!isFullscreen) return;

        switch (e.key) {
            case 'Escape':
                setIsFullscreen(false);
                break;
            case 'ArrowLeft':
                prevSlide();
                break;
            case 'ArrowRight':
                nextSlide();
                break;
        }
    }, [isFullscreen, prevSlide, nextSlide]);

    useEffect(() => {
        fetchMedia();
    }, [fetchMedia]);

    useEffect(() => {
        // Reset current index when media changes
        setCurrentIndex(0);
    }, [media.length]);

    useEffect(() => {
        if (isFullscreen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        } else {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isFullscreen, handleKeyDown]);

    if (loading) {
        return <div className="carousel-loading">Loading media...</div>;
    }

    const handleMediaDescriptionChange = (mediaId: string, description: string) => {
        // Only call the parent callback to store changes locally
        if (onMediaDescriptionChange) {
            onMediaDescriptionChange(mediaId, description);
        }
    };

    const renderMedia = (mediaItem: Media, isFullscreenMode: boolean = false) => (
        <div className={`carousel-media ${isFullscreenMode ? 'fullscreen-media' : ''}`}>
            {mediaItem.type === 'image' || mediaItem.type === 'gif' ? (
                <Image
                    src={mediaItem.url}
                    alt={mediaItem.title || 'Media'}
                    width={0}
                    height={0}
                    unoptimized
                    className={`carousel-image ${isFullscreenMode ? 'fullscreen-image' : ''}`}
                />
            ) : (
                <video
                    src={mediaItem.url}
                    controls
                    className={`carousel-video ${isFullscreenMode ? 'fullscreen-video' : ''}`}
                />
            )}

            {/* Media description overlay on the bottom of the image */}
            {!isFullscreenMode && (
                <div className="carousel-description-overlay">
                    {isEditing ? (
                        <div className="description-edit-overlay">
                            <input
                                type="text"
                                value={(pendingMediaChanges?.[mediaItem.id] ?? mediaItem.description) || ''}
                                onChange={(e) => handleMediaDescriptionChange(mediaItem.id, e.target.value)}
                                placeholder="Enter media description..."
                                className="description-input-overlay"
                            />
                        </div>
                    ) : (
                        (pendingMediaChanges?.[mediaItem.id] ?? mediaItem.description) && (
                            <div className="description-display-overlay">
                                <p className="description-text-overlay">
                                    {pendingMediaChanges?.[mediaItem.id] ?? mediaItem.description}
                                </p>
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );

    return (
        <>
            <div className="media-carousel">
                {media.length === 0 ? (
                    // Show uploader when no media exists
                    <div className="carousel-upload-section">
                        <div className="upload-header">
                            <h4>📷 Media Gallery</h4>
                            <p>No media uploaded yet. Upload your first image or video!</p>
                        </div>
                        <div className="upload-actions">
                            <MediaUploader
                                utilityId={utilityId}
                                throwingPointId={throwingPointId}
                                onUploadComplete={handleMediaUploaded}
                            />
                            <div className="attach-media-section">
                                <p>Or attach existing media:</p>
                                <button
                                    className="attach-existing-button"
                                    onClick={() => setIsAttacherVisible(true)}
                                >
                                    <BsLink size="1em" />
                                    Attach Existing Media
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    // Show carousel with media
                    <>
                        <div className="carousel-container">
                            {/* Previous button */}
                            {media.length > 1 && (
                                <button
                                    className="carousel-button prev-button"
                                    onClick={prevSlide}
                                    aria-label="Previous media"
                                >
                                    <BsChevronLeft size="1.5em" />
                                </button>
                            )}

                            {/* Main media display */}
                            {renderMedia(media[currentIndex])}

                            {/* Next button */}
                            {media.length > 1 && (
                                <button
                                    className="carousel-button next-button"
                                    onClick={nextSlide}
                                    aria-label="Next media"
                                >
                                    <BsChevronRight size="1.5em" />
                                </button>
                            )}

                            {/* Fullscreen button */}
                            <button
                                className="carousel-fullscreen-button"
                                onClick={toggleFullscreen}
                                title="Toggle fullscreen"
                            >
                                <BsFullscreen size="1em" />
                            </button>

                            {/* Attach Media button */}
                            <button
                                className="carousel-attach-button"
                                onClick={() => setIsAttacherVisible(true)}
                                title="Attach existing media"
                            >
                                <BsLink size="1em" />
                            </button>

                            {/* Delete button */}
                            <button
                                className="carousel-delete-button"
                                onClick={() => handleDelete(media[currentIndex].id)}
                                disabled={deleting === media[currentIndex].id}
                                title="Delete media"
                            >
                                <BsTrash size="1em" />
                            </button>
                        </div>

                        {/* Dots indicator */}
                        {media.length > 1 && (
                            <div className="carousel-dots">
                                {media.map((_, index) => (
                                    <button
                                        key={index}
                                        className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
                                        onClick={() => goToSlide(index)}
                                        aria-label={`Go to slide ${index + 1}`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Counter */}
                        {media.length > 1 && (
                            <div className="carousel-counter">
                                {currentIndex + 1} / {media.length}
                            </div>
                        )}
                    </>
                )}

                {/* Conditionally visible upload section below carousel */}
                {showUploadSection && (
                    <div className="carousel-upload-section">
                        <div className="upload-header">
                            <h4>📤 Add Media</h4>
                            <p>Drag and drop or click to upload new images or videos</p>
                        </div>
                        <MediaUploader
                            utilityId={utilityId}
                            throwingPointId={throwingPointId}
                            onUploadComplete={handleMediaUploaded}
                        />
                    </div>
                )}

                {/* Media Attacher Modal */}
                <MediaAttacher
                    utilityId={utilityId}
                    throwingPointId={throwingPointId}
                    isVisible={isAttacherVisible}
                    onClose={() => setIsAttacherVisible(false)}
                    onMediaAttached={() => {
                        fetchMedia();
                        setIsAttacherVisible(false);
                    }}
                />
            </div>

            {/* Fullscreen Modal */}
            {isFullscreen && media.length > 0 && (
                <div className="fullscreen-overlay" onClick={toggleFullscreen}>
                    <div className="fullscreen-content" onClick={(e) => e.stopPropagation()}>
                        {/* Close button */}
                        <button
                            className="fullscreen-close-button"
                            onClick={toggleFullscreen}
                            title="Close fullscreen"
                        >
                            <BsX size="2em" />
                        </button>

                        {/* Attach Media button */}
                        <button
                            className="fullscreen-attach-button"
                            onClick={() => setIsAttacherVisible(true)}
                            title="Attach existing media"
                        >
                            <BsLink size="1.5em" />
                        </button>

                        {/* Fullscreen media container */}
                        <div className="fullscreen-container">
                            {/* Previous button */}
                            {media.length > 1 && (
                                <button
                                    className="fullscreen-button prev-button"
                                    onClick={prevSlide}
                                    aria-label="Previous media"
                                >
                                    <BsChevronLeft size="2em" />
                                </button>
                            )}

                            {/* Fullscreen media */}
                            {renderMedia(media[currentIndex], true)}

                            {/* Next button */}
                            {media.length > 1 && (
                                <button
                                    className="fullscreen-button next-button"
                                    onClick={nextSlide}
                                    aria-label="Next media"
                                >
                                    <BsChevronRight size="2em" />
                                </button>
                            )}
                        </div>

                        {/* Fullscreen info */}
                        <div className="fullscreen-info">
                            <h4 className="fullscreen-title">{media[currentIndex].title}</h4>
                            {media[currentIndex].description && (
                                <p className="fullscreen-description">{media[currentIndex].description}</p>
                            )}
                            <p className="fullscreen-counter">
                                {currentIndex + 1} / {media.length}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
});

MediaCarousel.displayName = 'MediaCarousel';

export default MediaCarousel; 