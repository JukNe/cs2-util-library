'use client'

import { useState, useEffect, useCallback } from 'react';
import { Media } from '@/types/media';
import MediaDisplay from '@/components/mediaDisplay';
import UploadModal from '@/components/mediaUploader/uploadModal';

// Simple cache for media data
const mediaCache = {
    data: null as Media[] | null,
    timestamp: 0,
    userId: null as string | null
};

export default function MediaPage() {
    const [media, setMedia] = useState<Media[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    const fetchUserMedia = useCallback(async (forceRefresh = false) => {
        try {
            // Check cache first (5 minute cache)
            const now = Date.now();
            const cacheAge = now - mediaCache.timestamp;
            const cacheValid = cacheAge < 5 * 60 * 1000; // 5 minutes

            if (!forceRefresh && mediaCache.data && cacheValid) {
                setMedia(mediaCache.data);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            const response = await fetch('/api/media/user', {
                credentials: 'include',
                headers: {
                    'Cache-Control': 'max-age=300' // 5 minutes
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    setError('Please log in to view your media');
                } else {
                    setError('Failed to load media');
                }
                return;
            }

            const result = await response.json();
            if (result.success) {
                // Update cache
                mediaCache.data = result.data;
                mediaCache.timestamp = now;

                setMedia(result.data);
            } else {
                setError(result.error || 'Failed to load media');
            }
        } catch (error) {
            console.error('Error fetching user media:', error);
            setError('Failed to load media');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUserMedia();
    }, [fetchUserMedia]);

    if (loading) {
        return (
            <div style={{
                padding: '3em 1em',
                color: 'white',
                textAlign: 'center',
                minHeight: 'calc(100vh - 2.5em - 3.5em)'
            }}>
                <h1>Media Library</h1>
                <p>Loading your media...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                padding: '3em 1em',
                color: 'white',
                textAlign: 'center',
                minHeight: 'calc(100vh - 2.5em - 3.5em)'
            }}>
                <h1>Media Library</h1>
                <p style={{ color: '#ff6b6b' }}>{error}</p>
            </div>
        );
    }

    return (
        <div style={{
            padding: '3em 1em',
            color: 'white',
            minHeight: 'calc(100vh - 2.5em - 3.5em)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1>Media Library</h1>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
                        Upload and manage your media files
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        style={{
                            background: 'rgba(76, 175, 80, 0.2)',
                            border: '1px solid rgba(76, 175, 80, 0.3)',
                            color: '#4CAF50',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '500'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(76, 175, 80, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(76, 175, 80, 0.2)';
                        }}
                    >
                        Upload Media
                    </button>
                    <button
                        onClick={() => fetchUserMedia(true)}
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        }}
                    >
                        Refresh
                    </button>
                </div>
            </div>

            {/* Media Display Section */}
            <MediaDisplay
                media={media}
                onMediaDeleted={(mediaId) => {
                    // Remove from local state
                    setMedia(prev => prev.filter(item => item.id !== mediaId));
                    // Clear cache to force fresh data on next load
                    mediaCache.data = null;
                    mediaCache.timestamp = 0;
                }}
            />

            {/* Upload Modal */}
            <UploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onUploadComplete={(newMedia) => {
                    // Add new media to the list
                    setMedia(prev => [newMedia, ...prev]);
                    // Clear cache to force fresh data on next load
                    mediaCache.data = null;
                    mediaCache.timestamp = 0;
                }}
            />
        </div>
    );
} 