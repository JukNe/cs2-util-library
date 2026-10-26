import './style.scss'
import MediaCarousel, { MediaCarouselRef } from '../mediaCarousel';
import { useRef, forwardRef, useImperativeHandle } from 'react';

interface UtilityViewerProps {
    utilityId?: string;
    throwingPointId?: string;
    isEditingDescription?: boolean;
    onMediaDescriptionChange?: (mediaId: string, description: string) => void;
    pendingMediaChanges?: Record<string, string>;
    onMediaUploaded?: () => void;
    onRequestEdit?: () => void;
}

export interface UtilityViewerRef {
    fetchMedia: () => void;
}

const UtilityViewer = forwardRef<UtilityViewerRef, UtilityViewerProps>((props, ref) => {
    const {
        utilityId,
        throwingPointId,
        isEditingDescription = false,
        onMediaDescriptionChange,
        pendingMediaChanges,
        onMediaUploaded,
        onRequestEdit
    } = props;
    const mediaCarouselRef = useRef<MediaCarouselRef | null>(null);

    useImperativeHandle(ref, () => ({
        fetchMedia: () => {
            mediaCarouselRef.current?.fetchMedia();
        }
    }));

    return (
        <div className={`utility-preview ${isEditingDescription ? 'is-editing' : ''}`}>
            <div className="preview-content">
                <div className="media-carousel-section">
                    <MediaCarousel
                        ref={mediaCarouselRef}
                        utilityId={utilityId}
                        throwingPointId={throwingPointId}
                        showUploadSection={isEditingDescription}
                        isEditing={isEditingDescription}
                        onMediaDescriptionChange={onMediaDescriptionChange}
                        pendingMediaChanges={pendingMediaChanges}
                        onMediaUploaded={onMediaUploaded}
                        onRequestEdit={onRequestEdit}
                    />
                </div>
            </div>
        </div>
    );
});

UtilityViewer.displayName = 'UtilityViewer';

export default UtilityViewer;
