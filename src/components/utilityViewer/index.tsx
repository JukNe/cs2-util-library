import './style.scss'
import { TUtilityThrowingPoint } from '@/types/utilities';
import MediaCarousel, { MediaCarouselRef } from '../mediaCarousel';
import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { BsPencil, BsCheck, BsX } from 'react-icons/bs';

interface UtilityViewerProps {
    position: {
        X: number;
        Y: number;
    };
    url: string;
    description: string;
    utilityId?: string;
    throwingPointId?: string;
    onDescriptionUpdate?: (newDescription: string) => void;
    isEditingDescription?: boolean;
    editedDescription?: string;
    onDescriptionChange?: (description: string) => void;
    onEditClick?: () => void;
    onSaveDescription?: () => void;
    onCancelEdit?: () => void;
    isSavingDescription?: boolean;
    onMediaDescriptionChange?: (mediaId: string, description: string) => void;
    pendingMediaChanges?: Record<string, string>;
}

export interface UtilityViewerRef {
    fetchMedia: () => void;
}

const UtilityViewer = forwardRef<UtilityViewerRef, UtilityViewerProps>((props, ref) => {
    const {
        position,
        url,
        description,
        utilityId,
        throwingPointId,
        onDescriptionUpdate,
        isEditingDescription = false,
        editedDescription = '',
        onDescriptionChange,
        onEditClick,
        onSaveDescription,
        onCancelEdit,
        isSavingDescription = false,
        onMediaDescriptionChange,
        pendingMediaChanges
    } = props;
    const mediaCarouselRef = useRef<MediaCarouselRef | null>(null);

    // Expose fetchMedia function to parent component
    useImperativeHandle(ref, () => ({
        fetchMedia: () => {
            if (mediaCarouselRef.current) {
                mediaCarouselRef.current.fetchMedia();
            }
        }
    }));

    return (
        <div className="utility-preview">
            <div className="preview-header">
            </div>
            <div className="preview-content">
                {/* Media Carousel with integrated upload and media description overlay */}
                <div className="media-carousel-section">
                    <MediaCarousel
                        ref={mediaCarouselRef}
                        utilityId={utilityId}
                        throwingPointId={throwingPointId}
                        showUploadSection={isEditingDescription}
                        isEditing={isEditingDescription}
                        onMediaDescriptionChange={onMediaDescriptionChange}
                        pendingMediaChanges={pendingMediaChanges}
                    />
                </div>
            </div>
        </div>
    );
});

export default UtilityViewer;