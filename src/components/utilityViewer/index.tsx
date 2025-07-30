import './style.scss'
import MediaCarousel, { MediaCarouselRef } from '../mediaCarousel';
import { useRef, forwardRef, useImperativeHandle } from 'react';

interface UtilityViewerProps {
    utilityId?: string;
    throwingPointId?: string;
    isEditingDescription?: boolean;
    onMediaDescriptionChange?: (mediaId: string, description: string) => void;
    pendingMediaChanges?: Record<string, string>;
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

UtilityViewer.displayName = 'UtilityViewer';

export default UtilityViewer;