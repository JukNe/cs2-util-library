'use client'

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUtilitySharing } from '@/hooks/useUtilitySharing';
import { TUtilityLandingPoint } from '@/types/utilities';
import { BsShare, BsClipboard, BsCheck } from 'react-icons/bs';
import './style.scss';

interface ShareButtonProps {
    mapName: string;
    utilities: TUtilityLandingPoint[];
    className?: string;
}

export const ShareButton = ({ mapName, utilities, className = '' }: ShareButtonProps) => {
    const { exportToClipboard, isExporting, error } = useUtilitySharing();
    const [showModal, setShowModal] = useState(false);
    const [description, setDescription] = useState('');
    const [copied, setCopied] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleShare = async () => {
        if (utilities.length === 0) {
            alert('No utilities to share');
            return;
        }

        try {
            await exportToClipboard(mapName, utilities, description);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
            setShowModal(false);
            setDescription('');
        } catch (err) {
            console.error('Failed to share utilities:', err);
            // Show user-friendly error message
            if (err instanceof Error && err.message.includes('not authenticated')) {
                alert('Please log in to share utilities. Your session may have expired.');
            } else {
                alert('Failed to share utilities. Please try again.');
            }
        }
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className={`share-button ${className}`}
                disabled={isExporting || utilities.length === 0}
                title="Share utilities"
            >
                <BsShare size="1.2em" />
                {isExporting ? 'Sharing...' : 'Share'}
            </button>

            {showModal && mounted && createPortal(
                <div className="share-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="share-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="share-modal-header">
                            <h3>Share Utilities</h3>
                            <button
                                className="close-button"
                                onClick={() => setShowModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="share-modal-content">
                            <p>Share your {mapName} utilities with other users</p>

                            <div className="share-stats">
                                <span>Utilities to share: {utilities.length}</span>
                                <span>Map: {mapName}</span>
                            </div>

                            <div className="description-input">
                                <label htmlFor="share-description">Description (optional):</label>
                                <textarea
                                    id="share-description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe your utility setup..."
                                    rows={3}
                                />
                            </div>

                            {error && (
                                <div className="error-message">
                                    {error}
                                </div>
                            )}
                        </div>

                        <div className="share-modal-actions">
                            <button
                                onClick={() => setShowModal(false)}
                                className="cancel-button"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleShare}
                                className="share-confirm-button"
                                disabled={isExporting}
                            >
                                {isExporting ? (
                                    <>
                                        <BsClipboard size="1em" />
                                        Sharing...
                                    </>
                                ) : copied ? (
                                    <>
                                        <BsCheck size="1em" />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <BsClipboard size="1em" />
                                        Copy Link
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}; 