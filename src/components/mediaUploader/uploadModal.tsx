import { useState } from 'react';
import { Media } from '@/types/media';
import MediaUploader from './index';
import { BsX } from 'react-icons/bs';
import './style.scss';

interface UploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUploadComplete?: (media: Media) => void;
}

const UploadModal = ({ isOpen, onClose, onUploadComplete }: UploadModalProps) => {
    const [uploadedMedia, setUploadedMedia] = useState<Media | null>(null);

    const handleUploadComplete = (media: Media) => {
        setUploadedMedia(media);
        if (onUploadComplete) {
            onUploadComplete(media);
        }
        // Close modal after a short delay to show success
        setTimeout(() => {
            setUploadedMedia(null);
            onClose();
        }, 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="upload-modal-overlay" onClick={onClose}>
            <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
                <div className="upload-modal-header">
                    <h2>Upload New Media</h2>
                    <button
                        className="upload-modal-close"
                        onClick={onClose}
                        aria-label="Close upload modal"
                    >
                        <BsX size="1.5em" />
                    </button>
                </div>

                <div className="upload-modal-content">
                    {uploadedMedia ? (
                        <div className="upload-success-message">
                            <p>✅ Upload successful!</p>
                            <p>File: {uploadedMedia.title}</p>
                            <p>Type: {uploadedMedia.type}</p>
                            <p>Closing in 2 seconds...</p>
                        </div>
                    ) : (
                        <MediaUploader
                            variant="standalone"
                            onUploadComplete={handleUploadComplete}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default UploadModal; 