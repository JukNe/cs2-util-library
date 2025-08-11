'use client'

import { Media } from '@/types/media';
import Image from 'next/image';
import { useState, useEffect, useCallback } from 'react';
import { BsTrash, BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import './style.scss';

interface MediaDisplayProps {
    media: Media[];
    onMediaDeleted?: (mediaId: string) => void;
}

const MediaDisplay = ({ media, onMediaDeleted }: MediaDisplayProps) => {
    const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
    const [selectedMediaIndex, setSelectedMediaIndex] = useState<number>(-1);
    const [deletingMedia, setDeletingMedia] = useState<string | null>(null);

    const getMediaContext = (mediaItem: Media) => {
        if (mediaItem.utility) {
            return `${mediaItem.utility.map.displayName} - ${mediaItem.utility.title}`;
        }
        if (mediaItem.throwingPoint) {
            return `${mediaItem.throwingPoint.utility.map.displayName} - ${mediaItem.throwingPoint.utility.title} - ${mediaItem.throwingPoint.title}`;
        }
        return 'Unattached media';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleMediaClick = (mediaItem: Media) => {
        const index = media.findIndex(item => item.id === mediaItem.id);
        setSelectedMedia(mediaItem);
        setSelectedMediaIndex(index);
    };

    const closeModal = useCallback(() => {
        setSelectedMedia(null);
        setSelectedMediaIndex(-1);
    }, []);

    const navigateToPrevious = useCallback(() => {
        if (selectedMediaIndex > 0) {
            const newIndex = selectedMediaIndex - 1;
            setSelectedMediaIndex(newIndex);
            setSelectedMedia(media[newIndex]);
        }
    }, [selectedMediaIndex, media]);

    const navigateToNext = useCallback(() => {
        if (selectedMediaIndex < media.length - 1) {
            const newIndex = selectedMediaIndex + 1;
            setSelectedMediaIndex(newIndex);
            setSelectedMedia(media[newIndex]);
        }
    }, [selectedMediaIndex, media]);

    // Handle keyboard navigation
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!selectedMedia) return;

            switch (event.key) {
                case 'ArrowLeft':
                    event.preventDefault();
                    navigateToPrevious();
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    navigateToNext();
                    break;
                case 'Escape':
                    event.preventDefault();
                    closeModal();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedMedia, selectedMediaIndex, media, navigateToPrevious, navigateToNext, closeModal]);

    const handleDeleteMedia = async (mediaId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent modal from opening

        if (!confirm('Are you sure you want to delete this media? This action cannot be undone.')) {
            return;
        }

        setDeletingMedia(mediaId);
        try {
            const response = await fetch(`/api/media/delete?mediaId=${mediaId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                // Call the callback to update the parent component
                if (onMediaDeleted) {
                    onMediaDeleted(mediaId);
                }
            } else {
                const result = await response.json();
                alert(result.error || 'Failed to delete media');
            }
        } catch (error) {
            console.error('Error deleting media:', error);
            alert('Failed to delete media');
        } finally {
            setDeletingMedia(null);
        }
    };

    if (media.length === 0) {
        return (
            <div className="media-empty-state">
                <h3>No media found</h3>
                <p>You haven&apos;t uploaded any media yet. Start by adding utilities to maps!</p>
            </div>
        );
    }

    return (
        <div className="media-display">
            <div className="media-grid">
                {media.map((mediaItem) => (
                    <div
                        key={mediaItem.id}
                        className="media-item"
                        onClick={() => handleMediaClick(mediaItem)}
                    >
                        <div className="media-preview">
                            {mediaItem.type === 'video' ? (
                                <video
                                    src={mediaItem.url}
                                    className="media-thumbnail"
                                    muted
                                    onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                                    onMouseLeave={(e) => (e.target as HTMLVideoElement).pause()}
                                />
                            ) : (
                                <Image
                                    src={mediaItem.url}
                                    alt={mediaItem.title || 'Media'}
                                    width={200}
                                    height={150}
                                    className="media-thumbnail"
                                />
                            )}
                            <button
                                className="delete-media-btn"
                                onClick={(e) => handleDeleteMedia(mediaItem.id, e)}
                                disabled={deletingMedia === mediaItem.id}
                                title="Delete media"
                            >
                                <BsTrash size="1em" />
                            </button>
                        </div>
                        <div className="media-info">
                            <h4>{mediaItem.title || 'Untitled'}</h4>
                            <p className="media-context">{getMediaContext(mediaItem)}</p>
                            <p className="media-date">{formatDate(mediaItem.createdAt)}</p>
                            {mediaItem.description && (
                                <p className="media-description">{mediaItem.description}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal for full-size view */}
            {selectedMedia && (
                <div className="media-modal" onClick={closeModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={closeModal}>×</button>
                        <button
                            className="modal-delete-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMedia(selectedMedia.id, e);
                                closeModal();
                            }}
                            disabled={deletingMedia === selectedMedia.id}
                            title="Delete media"
                        >
                            <BsTrash size="1.2em" />
                        </button>

                        {/* Navigation Arrows */}
                        {selectedMediaIndex > 0 && (
                            <button
                                className="modal-nav-btn modal-nav-left"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigateToPrevious();
                                }}
                                title="Previous media (&#8592;)"
                            >
                                <BsChevronLeft size="2em" />
                            </button>
                        )}

                        {selectedMediaIndex < media.length - 1 && (
                            <button
                                className="modal-nav-btn modal-nav-right"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigateToNext();
                                }}
                                title="Next media (&#8594;)"
                            >
                                <BsChevronRight size="2em" />
                            </button>
                        )}

                        <div className="modal-media">
                            {selectedMedia.type === 'video' ? (
                                <video
                                    src={selectedMedia.url}
                                    controls
                                    className="modal-video"
                                />
                            ) : (
                                <Image
                                    width={0}
                                    height={0}
                                    unoptimized
                                    layout="fill"
                                    src={selectedMedia.url}
                                    alt={selectedMedia.title || 'Media'}
                                    className="modal-image"
                                />
                            )}
                        </div>

                        {/* Media Counter */}
                        <div className="modal-counter">
                            {selectedMediaIndex + 1} / {media.length}
                        </div>

                        <div className="modal-info">
                            <h3>{selectedMedia.title || 'Untitled'}</h3>
                            <p className="modal-context">{getMediaContext(selectedMedia)}</p>
                            <p className="modal-date">{formatDate(selectedMedia.createdAt)}</p>
                            {selectedMedia.description && (
                                <p className="modal-description">{selectedMedia.description}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MediaDisplay; 