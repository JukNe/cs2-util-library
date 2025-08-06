import { useState, useEffect } from 'react';
import { Media } from '@/types/media';
import { BsLink, BsX } from 'react-icons/bs';
import Image from 'next/image';
import './style.scss';

interface MediaAttacherProps {
    utilityId?: string;
    throwingPointId?: string;
    onMediaAttached?: () => void;
    isVisible?: boolean;
    onClose?: () => void;
}

const MediaAttacher = ({
    utilityId,
    throwingPointId,
    onMediaAttached,
    isVisible = false,
    onClose
}: MediaAttacherProps) => {
    const [unattachedMedia, setUnattachedMedia] = useState<Media[]>([]);
    const [loading, setLoading] = useState(false);
    const [attaching, setAttaching] = useState<string | null>(null);

    const fetchUnattachedMedia = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/media/unattached', {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setUnattachedMedia(data.media || []);
                }
            }
        } catch (error) {
            console.error('Error fetching unattached media:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAttachMedia = async (mediaId: string) => {
        try {
            setAttaching(mediaId);
            const response = await fetch('/api/media/attach', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mediaId,
                    utilityId,
                    throwingPointId
                }),
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Remove the media from the unattached list
                    setUnattachedMedia(prev => prev.filter(m => m.id !== mediaId));

                    // Notify parent component
                    if (onMediaAttached) {
                        onMediaAttached();
                    }
                } else {
                    alert('Failed to attach media: ' + (data.error || 'Unknown error'));
                }
            } else {
                alert('Failed to attach media. Please try again.');
            }
        } catch (error) {
            console.error('Error attaching media:', error);
            alert('Error attaching media. Please try again.');
        } finally {
            setAttaching(null);
        }
    };

    useEffect(() => {
        if (isVisible) {
            fetchUnattachedMedia();
        }
    }, [isVisible]);

    if (!isVisible) {
        return null;
    }

    return (
        <div className="media-attacher-overlay">
            <div className="media-attacher-modal">
                <div className="media-attacher-header">
                    <h3>Attach Media</h3>
                    <button
                        className="close-button"
                        onClick={onClose}
                        title="Close"
                    >
                        <BsX size="1.5em" />
                    </button>
                </div>

                <div className="media-attacher-content">
                    {loading ? (
                        <div className="loading-message">Loading unattached media...</div>
                    ) : unattachedMedia.length === 0 ? (
                        <div className="no-media-message">
                            <p>No unattached media found.</p>
                            <p>Upload media first, then you can attach it to utilities or throwing points.</p>
                        </div>
                    ) : (
                        <div className="media-grid">
                            {unattachedMedia.map((media) => (
                                <div key={media.id} className="media-item">
                                    <div className="media-preview">
                                        {media.type === 'image' || media.type === 'gif' ? (
                                            <Image
                                                src={media.url}
                                                alt={media.title || 'Media'}
                                                width={120}
                                                height={90}
                                                className="media-image"
                                            />
                                        ) : (
                                            <div className="video-preview">
                                                <video
                                                    src={media.url}
                                                    className="media-video"
                                                    muted
                                                    loop
                                                    autoPlay
                                                />
                                                <div className="video-indicator">VID</div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="media-info">
                                        <div className="media-title">
                                            {media.title || 'Untitled'}
                                        </div>
                                        {media.description && (
                                            <div className="media-description">
                                                {media.description}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        className="attach-button"
                                        onClick={() => handleAttachMedia(media.id)}
                                        disabled={attaching === media.id}
                                        title="Attach to this point"
                                    >
                                        {attaching === media.id ? (
                                            'Attaching...'
                                        ) : (
                                            <>
                                                <BsLink size="1em" />
                                                Attach
                                            </>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MediaAttacher; 