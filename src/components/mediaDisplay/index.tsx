import { useState, useEffect } from 'react';
import { Media } from '@/types/media';
import { BsTrash } from 'react-icons/bs';
import Image from 'next/image';
import './style.scss';

interface MediaDisplayProps {
    utilityId?: string;
    throwingPointId?: string;
    onMediaDeleted?: (mediaId: string) => void;
}

const MediaDisplay = ({ utilityId, throwingPointId, onMediaDeleted }: MediaDisplayProps) => {
    const [media, setMedia] = useState<Media[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);

    const fetchMedia = async () => {
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

    useEffect(() => {
        fetchMedia();
    }, [utilityId, throwingPointId]);

    if (loading) {
        return <div>Loading media...</div>;
    }

    if (media.length === 0) {
        return <div>No media uploaded yet.</div>;
    }

    return (
        <div className="media-display">
            <h4>Media Files</h4>
            <div className="media-grid">
                {media.map((item) => (
                    <div key={item.id} className="media-item">
                        {item.type === 'image' || item.type === 'gif' ? (
                            <div className="media-preview-container">
                                <Image
                                    src={item.url}
                                    alt={item.title || 'Media'}
                                    className="media-preview"
                                    unoptimized
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                            </div>
                        ) : (
                            <video
                                src={item.url}
                                controls
                                className="media-preview"
                            />
                        )}

                        <div className="media-info">
                            <p className="media-title">{item.title}</p>
                            {item.description && (
                                <p className="media-description">{item.description}</p>
                            )}
                            <p className="media-type">{item.type}</p>
                        </div>

                        <button
                            className="delete-media-btn"
                            onClick={() => handleDelete(item.id)}
                            disabled={deleting === item.id}
                            title="Delete media"
                        >
                            <BsTrash size="1em" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MediaDisplay; 