'use client'

import './style.scss'
import { TUtilityThrowingPoint, TUtilityLandingPoint } from '@/types/utilities';
import { Media } from '@/types/media';
import Image from 'next/image'
import { useContext, useEffect, useState, useRef, useCallback } from 'react';
import Sidebar from '../sidebar';
import { BsPlus, BsX, BsTrash, BsPencil, BsCheck, BsZoomIn, BsZoomOut, BsArrowClockwise, BsChevronUp, BsChevronDown } from 'react-icons/bs';
import UtilityPreview from '../utilityViewer';
import { UtilityFilterContext } from '@/utils/contexts';
import { UtilityViewerRef } from '../utilityViewer';
import { ShareButton, ImportButton } from '../utilitySharing';
import { useTutorial, TutorialOverlay, getUtilityTutorialSteps } from '../tutorial';


interface MapViewerProps {
    mapName: string;
    data: TUtilityLandingPoint[];
}

// Inner component that uses the context
const MapViewerInner = (props: MapViewerProps) => {
    const { mapName, data } = props;
    const [utility, setUtility] = useState<TUtilityLandingPoint[]>(data || [])
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [selectedNade, setSelectedNade] = useState<TUtilityLandingPoint['utilityType']>()
    const [selectedTeam, setSelectedTeam] = useState<string>('T') // Default to Terrorist team
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
    const [isClient, setIsClient] = useState(false)

    // Set client flag after hydration
    useEffect(() => {
        setIsClient(true);
    }, []);
    const [selectedTP, setSelectedTP] = useState<TUtilityThrowingPoint>()
    const [selectedLP, setSelectedLP] = useState<TUtilityLandingPoint>()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLPModalOpen, setIsLPModalOpen] = useState(false)
    const [isLPModalMinimized, setIsLPModalMinimized] = useState(true)
    const [isAddingThrowingPoint, setIsAddingThrowingPoint] = useState(false)
    const [hoveredTP, setHoveredTP] = useState<TUtilityThrowingPoint | null>(null)
    const [hoveredLP, setHoveredLP] = useState<TUtilityLandingPoint | null>(null)
    const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })
    const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null)
    const [loading, setLoading] = useState(false)
    const [isEditingDescription, setIsEditingDescription] = useState(false)
    const [editedDescription, setEditedDescription] = useState('')
    const [isSavingDescription, setIsSavingDescription] = useState(false)
    const [isEditingTitle, setIsEditingTitle] = useState(false)
    const [editedTitle, setEditedTitle] = useState('')
    const [isSavingTitle, setIsSavingTitle] = useState(false)
    const [pendingMediaChanges, setPendingMediaChanges] = useState<Record<string, string>>({})
    const [hoveredTPMedia, setHoveredTPMedia] = useState<Media[]>([])
    const [hoveredLPMedia, setHoveredLPMedia] = useState<Media[]>([])
    const [mediaCache, setMediaCache] = useState<Record<string, Media[]>>({})
    const [isLoadingMedia, setIsLoadingMedia] = useState(false)
    const [isAddingLandingPoint, setIsAddingLandingPoint] = useState(false)
    const [isAddingThrowingPointLoading, setIsAddingThrowingPointLoading] = useState(false)
    const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 })
    const { utilityFilter } = useContext(UtilityFilterContext)
    const utilityViewerRef = useRef<UtilityViewerRef>(null)

    // Tutorial system
    const tutorial = useTutorial();

    // Initialize tutorial for first-time users
    useEffect(() => {
        if (isClient && !tutorial.hasSeenTutorial) {
            // Longer delay to ensure UI is fully loaded and all elements are rendered
            const timer = setTimeout(() => {
                tutorial.startTutorial(getUtilityTutorialSteps());
            }, 2000);

            return () => clearTimeout(timer);
        }
    }, [isClient, tutorial.hasSeenTutorial, tutorial.startTutorial]);



    // Helper function to map utility types to icon file names
    const getUtilityIconSrc = (utilityType: string) => {
        const iconMapping: Record<string, string> = {
            'he': 'HE'
        };
        const iconName = iconMapping[utilityType] || utilityType;
        return `/icons/${iconName}.svg`;
    };

    // Zoom and pan state
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const mapContainerRef = useRef<HTMLDivElement>(null)

    // Function to refresh utilities data
    const refreshUtilities = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/maps/${mapName}`, {
                credentials: 'include'
            });
            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    console.log('Refreshing utilities data:', result.data);
                    setUtility(result.data);

                    // Update selectedLP if it exists to point to the refreshed data
                    setSelectedLP(currentSelectedLP => {
                        if (currentSelectedLP) {
                            const updatedLP = result.data.find((lp: TUtilityLandingPoint) => lp.id === currentSelectedLP.id);
                            if (updatedLP) {
                                return updatedLP;
                            } else {
                                // If the selected LP no longer exists, clear the selection
                                return undefined;
                            }
                        }
                        return currentSelectedLP;
                    });
                } else {
                    console.error('Failed to refresh utilities:', result.error);
                }
            } else {
                console.error('Failed to fetch utilities:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('Error fetching utilities:', error);
        } finally {
            setLoading(false);
        }
    }, [mapName]);

    // Handle screen resize to update sidebar collapse state
    useEffect(() => {
        if (!isClient) return;

        // Set initial state based on screen size
        const shouldBeCollapsed = window.innerWidth < 1280;
        setIsSidebarCollapsed(shouldBeCollapsed);

        const handleResize = () => {
            const shouldBeCollapsed = window.innerWidth < 1280;
            if (isSidebarCollapsed !== shouldBeCollapsed) {
                setIsSidebarCollapsed(shouldBeCollapsed);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isClient, isSidebarCollapsed]);

    // Fetch utilities from database on component mount
    useEffect(() => {
        console.log('MapViewer: Initial load for map:', mapName);
        refreshUtilities();
    }, [refreshUtilities, mapName]);

    // Debug: Log utility data changes
    useEffect(() => {
        console.log('MapViewer: Utility data updated:', utility.length, 'utilities for map:', mapName);
    }, [utility, mapName]);

    const NewNadeDropDown = () => {
        return (
            <div className={'add-nade-dropdown'} onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={() => {
                        // If currently adding a landing point, cancel it
                        if (selectedNade) {
                            setSelectedNade(undefined);
                            setIsDropdownOpen(false);
                        } else {
                            // Otherwise toggle the dropdown
                            setIsDropdownOpen(!isDropdownOpen);
                        }
                    }}
                    className="main-add-button"
                    title={selectedNade ? "Cancel adding utility" : "Add new utility"}
                >
                    <BsPlus size={'2em'} />
                </button>
                <div className={`utility-dropdown-menu ${isDropdownOpen ? 'show' : ''}`}>
                    {/* Team Selection */}
                    <div className="team-selection">
                        <button
                            onClick={() => setSelectedTeam('T')}
                            className={`team-button ${selectedTeam === 'T' ? 'active' : ''}`}
                            title="Terrorist Team"
                        >
                            <span className="team-label">T</span>
                        </button>
                        <button
                            onClick={() => setSelectedTeam('CT')}
                            className={`team-button ${selectedTeam === 'CT' ? 'active' : ''}`}
                            title="Counter-Terrorist Team"
                        >
                            <span className="team-label">CT</span>
                        </button>
                    </div>
                    {/* Utility Type Selection */}
                    <div className="utility-selection">
                        <button
                            onClick={() => setSelectedNade('Smoke')}
                            className="utility-button"
                            title="Smoke Grenade"
                        >
                            <Image src="/icons/smoke.svg" alt="Smoke" width={24} height={24} />
                            <span>Smoke</span>
                        </button>
                        <button
                            onClick={() => setSelectedNade('Flash')}
                            className="utility-button"
                            title="Flash Grenade"
                        >
                            <Image src="/icons/flash.svg" alt="Flash" width={24} height={24} />
                            <span>Flash</span>
                        </button>
                        <button
                            onClick={() => setSelectedNade('Molotov')}
                            className="utility-button"
                            title="Molotov/Incendiary"
                        >
                            <Image src="/icons/molotov.svg" alt="Molotov" width={24} height={24} />
                            <span>Molotov</span>
                        </button>
                        <button
                            onClick={() => setSelectedNade('HE')}
                            className="utility-button"
                            title="HE Grenade"
                        >
                            <Image src="/icons/HE.svg" alt="HE" width={24} height={24} />
                            <span>HE</span>
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const handleAddNewUtil = async (e: React.MouseEvent) => {
        const img = document.getElementById('map-image') as HTMLImageElement

        if (!img || !selectedNade) return

        // Set loading state
        setIsAddingLandingPoint(true);

        // Calculate click position relative to the image, accounting for zoom and pan
        const imgRect = img.getBoundingClientRect()
        const clickX = (e.clientX - imgRect.left - pan.x) / zoom
        const clickY = (e.clientY - imgRect.top - pan.y) / zoom

        // Convert to percentages for responsive positioning
        const xPercent = (clickX / imgRect.width) * 100
        const yPercent = (clickY / imgRect.height) * 100

        try {
            // Save to database
            const response = await fetch('/api/utilities', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    mapName,
                    utilityType: selectedNade,
                    team: selectedTeam,
                    position: {
                        X: xPercent,
                        Y: yPercent
                    }
                }),
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // Add to local state
                    setUtility((previous) => [...previous, result.data]);

                } else {
                    console.error('Failed to save utility:', result.error);
                    alert('Failed to save utility. Please try again.');
                }
            } else {
                console.error('Failed to save utility');
                alert('Failed to save utility. Please try again.');
            }
        } catch (error) {
            console.error('Error saving utility:', error);
            alert('Error saving utility. Please try again.');
        } finally {
            setIsAddingLandingPoint(false);
            setSelectedNade(undefined);
        }
    }

    const handleAddThrowingPoint = async (e: React.MouseEvent) => {
        if (!selectedLP || !isAddingThrowingPoint) return

        const img = document.getElementById('map-image') as HTMLImageElement
        if (!img) return

        // Set loading state
        setIsAddingThrowingPointLoading(true);

        // Calculate click position relative to the image, accounting for zoom and pan
        const imgRect = img.getBoundingClientRect()
        const clickX = (e.clientX - imgRect.left - pan.x) / zoom
        const clickY = (e.clientY - imgRect.top - pan.y) / zoom

        // Convert to percentages for responsive positioning
        const xPercent = (clickX / imgRect.width) * 100
        const yPercent = (clickY / imgRect.height) * 100

        try {
            // Save to database
            const response = await fetch('/api/utilities/throwing-points', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    utilityId: selectedLP.id,
                    position: {
                        X: xPercent,
                        Y: yPercent
                    },
                    title: `Throwing Point ${selectedLP.throwingPoints.length + 1}`,
                    description: 'Placeholder description'
                }),
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // Add to local state
                    setUtility((previous) => {
                        return previous.map(item => {
                            if (item === selectedLP) {
                                const updatedLP = {
                                    ...item,
                                    throwingPoints: [...item.throwingPoints, result.data]
                                };
                                // Update the selectedLP reference to the updated landing point
                                setSelectedLP(updatedLP);
                                return updatedLP;
                            }
                            return item;
                        });
                    });

                } else {
                    console.error('Failed to save throwing point:', result.error);
                    alert('Failed to save throwing point. Please try again.');
                }
            } else {
                console.error('Failed to save throwing point');
                alert('Failed to save throwing point. Please try again.');
            }
        } catch (error) {
            console.error('Error saving throwing point:', error);
            alert('Error saving throwing point. Please try again.');
        } finally {
            setIsAddingThrowingPointLoading(false);
            setIsAddingThrowingPoint(false);
            // Ensure the landing point modal stays open after adding a throwing point
            if (selectedLP && !isLPModalOpen) {
                setIsLPModalOpen(true);
            }
        }
    }

    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newZoom = parseFloat(e.target.value);
        setZoom(newZoom);

        // Reset pan position when zoom returns to 100%
        if (newZoom === 1) {
            setPan({ x: 0, y: 0 });
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        // Only zoom if Shift key is held down
        if (e.shiftKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            const newZoom = Math.max(0.5, Math.min(5, zoom + delta));
            setZoom(newZoom);

            // Reset pan position when zoom returns to 100%
            if (newZoom === 1) {
                setPan({ x: 0, y: 0 });
            }
        }
    };

    const handleZoomIn = () => {
        const newZoom = Math.min(5, zoom + 0.1);
        setZoom(newZoom);
    };

    const handleZoomOut = () => {
        const newZoom = Math.max(0.5, zoom - 0.1);
        setZoom(newZoom);
    };

    const handleResetZoom = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0 && zoom > 1) { // Left mouse button and zoomed in
            setIsDragging(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        // Update cursor position for custom cursor
        setCursorPosition({ x: e.clientX, y: e.clientY });

        // Handle dragging for zoom
        if (isDragging) {
            setPan({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleLPClick = (data: TUtilityLandingPoint, e: React.MouseEvent) => {
        e.stopPropagation();
        // Toggle selection: if clicking the same landing point, deselect it
        if (selectedLP === data) {
            setSelectedLP(undefined);
            setIsLPModalOpen(false);
            // Reset throwing point mode when deselecting landing point
            setIsAddingThrowingPoint(false);
        } else {
            setSelectedLP(data);
            setIsLPModalOpen(true);
        }
        setSelectedTP(undefined);
        setIsModalOpen(false);
    };

    const handleAddThrowingPointClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsAddingThrowingPoint(true);
    };

    const handleDeleteLandingPoint = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedLP) return;

        // Show confirmation dialog
        const confirmed = window.confirm(
            `Are you sure you want to delete this ${selectedLP.utilityType} landing point?\n\nThis will also delete all ${selectedLP.throwingPoints.length} throwing point(s). Associated media will be unattached and can be reused.`
        );

        if (!confirmed) {
            return;
        }



        try {
            const response = await fetch(`/api/utilities/${selectedLP.id}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setUtility((previous) => previous.filter(item => item !== selectedLP))
                    setSelectedLP(undefined);
                    setSelectedTP(undefined);
                    setIsModalOpen(false);
                    setIsLPModalOpen(false);

                } else {
                    console.error('Failed to delete landing point:', result.error);
                    alert('Failed to delete landing point. Please try again.');
                }
            } else {
                const errorText = await response.text();
                console.error('Failed to delete landing point:', response.status, errorText);
                alert('Failed to delete landing point. Please try again.');
            }
        } catch (error) {
            console.error('Error deleting landing point:', error);
            alert('Error deleting landing point. Please try again.');
        }
    };

    const handleDeleteThrowingPoint = (tp: TUtilityThrowingPoint, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!selectedLP) return;

        // Show confirmation dialog
        const confirmed = window.confirm(
            `Are you sure you want to delete this throwing point?\n\nTitle: ${tp.title}\nAssociated media will be unattached and can be reused.`
        );

        if (!confirmed) {
            return;
        }

        try {
            fetch(`/api/utilities/throwing-points/${tp.id}`, {
                method: 'DELETE',
                credentials: 'include'
            }).then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Failed to delete throwing point');
            }).then(result => {
                if (result.success) {
                    setUtility((previous) => previous.map(item =>
                        item === selectedLP
                            ? { ...item, throwingPoints: item.throwingPoints.filter(t => t !== tp) }
                            : item
                    ));
                    if (selectedTP === tp) {
                        setSelectedTP(undefined);
                        setIsModalOpen(false);
                    }
                    // Also close landing point modal if it's open
                    if (selectedLP) {
                        setSelectedLP(undefined);
                        setIsLPModalOpen(false);
                    }
                } else {
                    console.error('Failed to delete throwing point:', result.error);
                    alert('Failed to delete throwing point. Please try again.');
                }
            }).catch(error => {
                console.error('Error deleting throwing point:', error);
                alert('Error deleting throwing point. Please try again.');
            });
        } catch (error) {
            console.error('Error deleting throwing point:', error);
            alert('Error deleting throwing point. Please try again.');
        }
    };

    const handleTPClick = (data: TUtilityThrowingPoint, e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedTP(data);
        setIsModalOpen(true);
    };

    const handleTPHover = (data: TUtilityThrowingPoint, e: React.MouseEvent) => {
        setHoveredTP(data);
        setHoverPosition({ x: e.clientX, y: e.clientY });

        // Clear existing timeout
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
        }

        // Set new timeout
        const timeout = setTimeout(() => {
            const throwingPointId = data.id;
            if (!throwingPointId) return;

            // Check if media is already cached
            if (mediaCache[throwingPointId]) {
                setHoveredTPMedia(mediaCache[throwingPointId]);
                return;
            }

            // Set loading state
            setIsLoadingMedia(true);

            // Fetch media for this throwing point
            fetch(`/api/media/get?throwingPointId=${throwingPointId}`, {
                credentials: 'include'
            }).then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Failed to fetch media');
            }).then(result => {
                const media = result.media || [];
                // Cache the media data
                setMediaCache(prev => ({
                    ...prev,
                    [throwingPointId]: media
                }));
                setHoveredTPMedia(media);
                setIsLoadingMedia(false);
            }).catch(error => {
                console.error('Error fetching media:', error);
                // Cache empty array to avoid repeated failed requests
                setMediaCache(prev => ({
                    ...prev,
                    [throwingPointId]: []
                }));
                setHoveredTPMedia([]);
                setIsLoadingMedia(false);
            });
        }, 500);

        setHoverTimeout(timeout);
    };

    const handleTPLeave = () => {
        setHoveredTP(null);
        setHoveredTPMedia([]);
        setIsLoadingMedia(false);
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            setHoverTimeout(null);
        }
    };

    const handleLPHover = (data: TUtilityLandingPoint, e: React.MouseEvent) => {
        setHoveredLP(data);
        setHoverPosition({ x: e.clientX, y: e.clientY });

        // Clear existing timeout
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
        }

        // Set new timeout
        const timeout = setTimeout(() => {
            const utilityId = data.id;
            if (!utilityId) return;

            // Check if media is already cached
            if (mediaCache[utilityId]) {
                setHoveredLPMedia(mediaCache[utilityId]);
                return;
            }

            // Set loading state
            setIsLoadingMedia(true);

            // Fetch media for this landing point
            fetch(`/api/media/get?utilityId=${utilityId}`, {
                credentials: 'include'
            }).then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Failed to fetch media');
            }).then(result => {
                const media = result.media || [];
                // Cache the media data
                setMediaCache(prev => ({
                    ...prev,
                    [utilityId]: media
                }));
                setHoveredLPMedia(media);
                setIsLoadingMedia(false);
            }).catch(error => {
                console.error('Error fetching media:', error);
                // Cache empty array to avoid repeated failed requests
                setMediaCache(prev => ({
                    ...prev,
                    [utilityId]: []
                }));
                setHoveredLPMedia([]);
                setIsLoadingMedia(false);
            });
        }, 500);

        setHoverTimeout(timeout);
    };

    const handleLPLeave = () => {
        setHoveredLP(null);
        setHoveredLPMedia([]);
        setIsLoadingMedia(false);
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            setHoverTimeout(null);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedTP(undefined);
        setIsEditingDescription(false);
        setIsEditingTitle(false);
        setEditedDescription('');
        setEditedTitle('');
        setPendingMediaChanges({});
    };

    const handleLPModalClose = () => {
        setIsLPModalOpen(false);
        setSelectedLP(undefined);
        setIsEditingDescription(false);
        setIsEditingTitle(false);
        setEditedDescription('');
        setEditedTitle('');
        setPendingMediaChanges({});
        setIsLPModalMinimized(true); // Reset to minimized when closing
    };

    const handleLPModalToggleMinimize = () => {
        setIsLPModalMinimized(!isLPModalMinimized);
    };

    const handleEditClick = () => {
        if (selectedTP) {
            setIsEditingDescription(true);
            setIsEditingTitle(true);
            setEditedDescription(selectedTP.description || '');
            setEditedTitle(selectedTP.title || '');
        } else if (selectedLP) {
            setIsEditingDescription(true);
            setIsEditingTitle(true);
            setEditedDescription(selectedLP.description || '');
            setEditedTitle(selectedLP.title || '');
        }
    };

    const handleCancelEdit = () => {
        setIsEditingDescription(false);
        setIsEditingTitle(false);
        setEditedDescription('');
        setEditedTitle('');
        setPendingMediaChanges({});
    };

    const handleMediaDescriptionChange = (mediaId: string, description: string) => {
        setPendingMediaChanges(prev => ({
            ...prev,
            [mediaId]: description
        }));
    };

    const handleSaveAll = async () => {
        if (!selectedTP && !selectedLP) return;

        setIsSavingDescription(true);
        setIsSavingTitle(true);

        try {
            let entityId: string;
            let entityType: 'throwing-point' | 'utility';

            if (selectedTP && selectedTP.id) {
                entityId = selectedTP.id;
                entityType = 'throwing-point';
            } else if (selectedLP && selectedLP.id) {
                entityId = selectedLP.id;
                entityType = 'utility';
            } else {
                return;
            }

            // Save title and description in a single request
            const endpoint = entityType === 'throwing-point'
                ? `/api/utilities/throwing-points/${entityId}`
                : `/api/utilities/${entityId}`;

            const response = await fetch(endpoint, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: editedTitle,
                    description: editedDescription
                }),
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error('Failed to save changes');
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.error || 'Failed to save changes');
            }

            // Save media descriptions
            const mediaPromises = Object.entries(pendingMediaChanges).map(([mediaId, description]) =>
                fetch(`/api/media/update-description`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        mediaId,
                        description
                    }),
                    credentials: 'include'
                }).then(response => response.json())
            );

            await Promise.all(mediaPromises);

            // Refresh media data in the carousel to reflect the updated descriptions
            if (utilityViewerRef.current) {
                utilityViewerRef.current.fetchMedia();
            }

            // Update local state
            if (selectedTP) {
                setSelectedTP({
                    ...selectedTP,
                    title: editedTitle,
                    description: editedDescription
                });
            } else if (selectedLP) {
                // Update the selectedLP with the new title and description
                setSelectedLP({
                    ...selectedLP,
                    title: editedTitle,
                    description: editedDescription
                });
            }

            // Reset edit states
            setIsEditingDescription(false);
            setIsEditingTitle(false);
            setPendingMediaChanges({});
            setEditedTitle('');
            setEditedDescription('');

            // Refresh utilities data to get the latest from database
            await refreshUtilities();

        } catch (error) {
            console.error('Error saving all changes:', error);
            alert('Error saving changes. Please try again.');
        } finally {
            setIsSavingDescription(false);
            setIsSavingTitle(false);
        }
    };

    // Function to invalidate media cache for a specific throwing point
    const invalidateMediaCache = (id: string) => {
        setMediaCache(prev => {
            const newCache = { ...prev };
            delete newCache[id];
            return newCache;
        });
    };

    const handleMapClick = (e: React.MouseEvent) => {
        // Close dropdown if clicking outside of it
        if (isDropdownOpen) {
            setIsDropdownOpen(false)
        }

        if (selectedNade) {
            handleAddNewUtil(e)
        } else if (isAddingThrowingPoint) {
            handleAddThrowingPoint(e)
        }
    }

    // Handle dropdown closing when utility is selected
    useEffect(() => {
        if (selectedNade && isDropdownOpen) {
            // Add a small delay to allow the user to see the selection
            const timer = setTimeout(() => {
                setIsDropdownOpen(false)
            }, 300)

            return () => clearTimeout(timer)
        }
    }, [selectedNade, isDropdownOpen])

    // Handle cursor changes
    useEffect(() => {
        const img = document.getElementById('map-image')
        if (img) {
            if (selectedNade != undefined && !isDropdownOpen) {
                // Add custom cursor class based on utility type only when dropdown is closed
                img.classList.add('custom-cursor');
                img.classList.add(`custom-cursor-${selectedNade.toLowerCase()}`);
                img.style.cursor = 'none';
            } else if (isAddingThrowingPoint) {
                img.style.cursor = 'none'
                // Remove custom cursor classes
                img.classList.remove('custom-cursor', 'custom-cursor-smoke', 'custom-cursor-flash', 'custom-cursor-molotov', 'custom-cursor-he');
            } else {
                img.style.cursor = zoom > 1 ? 'grab' : 'auto'
                // Remove custom cursor classes
                img.classList.remove('custom-cursor', 'custom-cursor-smoke', 'custom-cursor-flash', 'custom-cursor-molotov', 'custom-cursor-he');
            }
        }
    }, [selectedNade, zoom, isAddingThrowingPoint, isDropdownOpen])

    // Handle Escape key to cancel operations
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                // Cancel landing point mode
                if (selectedNade) {
                    setSelectedNade(undefined);
                    setIsDropdownOpen(false);
                }
                // Cancel throwing point mode
                if (isAddingThrowingPoint) {
                    setIsAddingThrowingPoint(false);
                }
                // Close dropdown if open
                if (isDropdownOpen) {
                    setIsDropdownOpen(false);
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedNade, isAddingThrowingPoint, isDropdownOpen]);

    return (
        <>
            {/* Custom cursor for utility icons */}
            {selectedNade && !isDropdownOpen && (
                <div
                    className={`custom-cursor custom-cursor-${selectedNade.toLowerCase()}`}
                    style={{
                        position: 'fixed',
                        left: cursorPosition.x,
                        top: cursorPosition.y,
                        width: '32px',
                        height: '32px',
                        backgroundImage: `url(${getUtilityIconSrc(selectedNade)})`,
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        pointerEvents: 'none',
                        zIndex: 9999,
                        transform: 'translate(-50%, -50%)'
                    }}
                />
            )}

            {/* Custom cursor for throwing point mode */}
            {isAddingThrowingPoint && !isAddingThrowingPointLoading && (
                <div
                    className="throwing-point-cursor"
                    style={{
                        position: 'fixed',
                        left: cursorPosition.x,
                        top: cursorPosition.y,
                        width: '32px',
                        height: '32px',
                        backgroundColor: 'lime',
                        borderRadius: '50%',
                        pointerEvents: 'none',
                        zIndex: 9999,
                        transform: 'translate(-50%, -50%)',
                        border: '2px solid white',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                    }}
                />
            )}

            {selectedTP && isModalOpen &&
                <div className={'throwing-point-modal-wrapper'}>
                    <div className='modal-header'>
                        <div className="header-content">
                            <div className="title-section">
                                {isEditingTitle ? (
                                    <div className="title-edit">
                                        <input
                                            type="text"
                                            value={editedTitle}
                                            onChange={(e) => setEditedTitle(e.target.value)}
                                            placeholder="Enter title..."
                                            className="title-input"
                                        />
                                    </div>
                                ) : (
                                    <div className="title-display">
                                        <h2 className="title-text">{selectedTP.title || 'No title available.'}</h2>
                                    </div>
                                )}
                            </div>
                            <div className="description-section">
                                {isEditingDescription ? (
                                    <div className="description-edit">
                                        <input
                                            type="text"
                                            value={editedDescription}
                                            onChange={(e) => setEditedDescription(e.target.value)}
                                            placeholder="Enter description..."
                                            className="description-input"
                                        />
                                    </div>
                                ) : (
                                    <div className="description-display">
                                        <p className="description-text">{selectedTP.description || 'No description available.'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="header-actions">
                            {!isEditingDescription && (
                                <button
                                    onClick={handleEditClick}
                                    className="edit-button"
                                    title="Edit title, description, and media"
                                >
                                    <BsPencil size="1.5em" />
                                </button>
                            )}
                            <button
                                onClick={handleModalClose}
                                className="close-button"
                            >
                                <BsX size={'2em'} />
                            </button>
                        </div>
                    </div>

                    {/* Modal Content */}
                    <div className="modal-content">
                        {/* Edit Actions Bar */}
                        {isEditingDescription && (
                            <div className="edit-actions-bar">
                                <div className="edit-actions">
                                    <button
                                        className="delete-button"
                                        onClick={(e) => handleDeleteThrowingPoint(selectedTP!, e)}
                                        disabled={isSavingTitle || isSavingDescription}
                                        title="Delete throwing point"
                                    >
                                        <BsTrash size="1.2em" />
                                        Delete
                                    </button>
                                    <div className="action-group">
                                        <button
                                            className="cancel-button"
                                            onClick={handleCancelEdit}
                                            disabled={isSavingTitle || isSavingDescription}
                                        >
                                            <BsX size="1em" />
                                            Cancel
                                        </button>
                                        <button
                                            className="save-button"
                                            onClick={handleSaveAll}
                                            disabled={isSavingTitle || isSavingDescription}
                                        >
                                            <BsCheck size="1em" />
                                            {isSavingTitle || isSavingDescription ? 'Saving...' : 'Save All'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Media Content */}
                        <div className="media-content">
                            <UtilityPreview
                                ref={utilityViewerRef}
                                throwingPointId={selectedTP.id}
                                onMediaDescriptionChange={handleMediaDescriptionChange}
                                pendingMediaChanges={pendingMediaChanges}
                                isEditingDescription={isEditingDescription}
                                onMediaUploaded={() => selectedTP.id && invalidateMediaCache(selectedTP.id)}
                            />
                        </div>
                    </div>
                </div>
            }

            {/* Landing Point Modal */}
            {selectedLP && isLPModalOpen &&
                <div className={'modal-wrapper'}>
                    {/* Modal Header */}
                    <div className='modal-header'>
                        <div className="header-content">
                            <div className="title-section">
                                {isEditingTitle ? (
                                    <div className="title-edit">
                                        <input
                                            type="text"
                                            value={editedTitle}
                                            onChange={(e) => setEditedTitle(e.target.value)}
                                            placeholder="Enter title..."
                                            className="title-input"
                                        />
                                    </div>
                                ) : (
                                    <h2 className="modal-title">
                                        {isEditingTitle
                                            ? (editedTitle && editedTitle.trim() !== '' ? editedTitle : 'No title available.')
                                            : (selectedLP.title && selectedLP.title.trim() !== ''
                                                ? selectedLP.title
                                                : `${selectedLP.utilityType} Utility (${selectedLP.team})`)
                                        }
                                    </h2>
                                )}
                            </div>

                            {!isLPModalMinimized && (
                                <div className="description-section">
                                    {isEditingDescription ? (
                                        <div className="description-edit">
                                            <input
                                                type="text"
                                                value={editedDescription}
                                                onChange={(e) => setEditedDescription(e.target.value)}
                                                placeholder="Enter description..."
                                                className="description-input"
                                            />
                                        </div>
                                    ) : (
                                        <div className="description-display">
                                            <p className="description-text">
                                                {isEditingDescription
                                                    ? (editedDescription && editedDescription.trim() !== '' ? editedDescription : 'No description available.')
                                                    : (selectedLP?.description && selectedLP.description.trim() !== ''
                                                        ? selectedLP.description
                                                        : `${selectedLP?.throwingPoints?.length ?? 0} throwing point${(selectedLP?.throwingPoints?.length ?? 0) !== 1 ? 's' : ''} attached`)
                                                }
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="header-actions">
                            {!isEditingDescription && !isLPModalMinimized && (
                                <button
                                    onClick={handleEditClick}
                                    className="edit-button"
                                    title="Edit title, description, and media"
                                >
                                    <BsPencil size="1.5em" />
                                </button>
                            )}
                            <button
                                onClick={handleLPModalToggleMinimize}
                                className="minimize-button"
                                title={isLPModalMinimized ? "Expand" : "Minimize"}
                            >
                                {isLPModalMinimized ? <BsChevronUp size={'1.5em'} /> : <BsChevronDown size={'1.5em'} />}
                            </button>
                            <button
                                onClick={handleLPModalClose}
                                className="close-button"
                            >
                                <BsX size={'2em'} />
                            </button>
                        </div>
                    </div>

                    {/* Modal Content */}
                    {!isLPModalMinimized && (
                        <div className="modal-content">
                            {/* Edit Actions Bar */}
                            {isEditingDescription && (
                                <div className="edit-actions-bar">
                                    <div className="edit-actions">
                                        <button
                                            className="delete-button"
                                            onClick={(e) => handleDeleteLandingPoint(e)}
                                            disabled={isSavingTitle || isSavingDescription}
                                            title="Delete landing point"
                                        >
                                            <BsTrash size="1.2em" />
                                            Delete
                                        </button>
                                        <div className="action-group">
                                            <button
                                                className="cancel-button"
                                                onClick={handleCancelEdit}
                                                disabled={isSavingTitle || isSavingDescription}
                                            >
                                                <BsX size="1em" />
                                                Cancel
                                            </button>
                                            <button
                                                className="save-button"
                                                onClick={handleSaveAll}
                                                disabled={isSavingTitle || isSavingDescription}
                                            >
                                                <BsCheck size="1em" />
                                                Save All
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Utility Preview */}
                            <UtilityPreview
                                ref={utilityViewerRef}
                                utilityId={selectedLP?.id ?? ''}
                                onMediaDescriptionChange={handleMediaDescriptionChange}
                                pendingMediaChanges={pendingMediaChanges}
                                isEditingDescription={isEditingDescription || isEditingTitle}
                                onMediaUploaded={() => selectedLP?.id && invalidateMediaCache(selectedLP.id)}
                            />
                        </div>
                    )}
                </div>
            }

            {/* Hover Preview */}
            {hoveredTP && (
                <div
                    className="hover-preview"
                    style={{
                        position: 'fixed',
                        left: hoverPosition.x + 10,
                        top: hoverPosition.y - 10,
                        zIndex: 1000,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        borderRadius: '8px',
                        padding: '8px',
                        maxWidth: '200px',
                        pointerEvents: 'none'
                    }}
                >
                    {/* Throwing Point Info */}
                    <div style={{ marginBottom: '8px' }}>
                        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>
                            {hoveredTP.title}
                        </div>
                        {hoveredTP.description && (
                            <div style={{ color: '#ccc', fontSize: '12px', marginTop: '4px' }}>
                                {hoveredTP.description}
                            </div>
                        )}
                    </div>

                    {/* Media Preview (if any) */}
                    {hoveredTPMedia.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {/* Show first media file */}
                            {(() => {
                                const firstMedia = hoveredTPMedia[0];
                                if (firstMedia && firstMedia.url) {
                                    if (firstMedia.type === 'image') {
                                        return (
                                            <div
                                                style={{
                                                    width: '120px',
                                                    height: '80px',
                                                    borderRadius: '4px',
                                                    overflow: 'hidden',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <Image
                                                    src={firstMedia.url}
                                                    alt="Media preview"
                                                    width={120}
                                                    height={80}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                            </div>
                                        );
                                    } else if (firstMedia.type === 'video') {
                                        return (
                                            <div
                                                style={{
                                                    width: '120px',
                                                    height: '80px',
                                                    backgroundColor: '#333',
                                                    borderRadius: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    position: 'relative'
                                                }}
                                            >
                                                <video
                                                    src={firstMedia.url}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                    muted
                                                    loop
                                                    autoPlay
                                                />
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        top: '4px',
                                                        right: '4px',
                                                        backgroundColor: 'rgba(0,0,0,0.7)',
                                                        color: '#fff',
                                                        fontSize: '10px',
                                                        padding: '2px 4px',
                                                        borderRadius: '2px'
                                                    }}
                                                >
                                                    VID
                                                </div>
                                            </div>
                                        );
                                    }
                                }
                                return null;
                            })()}

                            {/* Show remaining media count if more than 1 */}
                            {hoveredTPMedia.length > 1 && (
                                <div
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        backgroundColor: '#333',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '12px',
                                        color: '#fff'
                                    }}
                                >
                                    +{hoveredTPMedia.length - 1}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Media Status Message */}
                    {isLoadingMedia ? (
                        <div style={{ color: '#999', fontSize: '12px', fontStyle: 'italic' }}>
                            Loading...
                        </div>
                    ) : hoveredTPMedia.length === 0 && (
                        <div style={{ color: '#999', fontSize: '12px', fontStyle: 'italic' }}>
                            No media attached
                        </div>
                    )}
                </div>
            )}

            {/* Landing Point Hover Preview */}
            {hoveredLP && (
                <div
                    className="hover-preview"
                    style={{
                        position: 'fixed',
                        left: hoverPosition.x + 10,
                        top: hoverPosition.y - 10,
                        zIndex: 1000,
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        borderRadius: '8px',
                        padding: '8px',
                        maxWidth: '200px',
                        pointerEvents: 'none'
                    }}
                >
                    {/* Landing Point Info */}
                    <div style={{ marginBottom: '8px' }}>
                        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>
                            {hoveredLP.title && hoveredLP.title.trim() !== ''
                                ? hoveredLP.title
                                : `${hoveredLP.utilityType} Utility (${hoveredLP.team})`}
                        </div>
                        {hoveredLP.description && hoveredLP.description.trim() !== '' && (
                            <div style={{ color: '#ccc', fontSize: '12px', marginTop: '4px' }}>
                                {hoveredLP.description}
                            </div>
                        )}
                        {(!hoveredLP.description || hoveredLP.description.trim() === '') && (
                            <div style={{ color: '#aaa', fontSize: '11px', marginTop: '4px' }}>
                                {hoveredLP.throwingPoints.length} throwing point{hoveredLP.throwingPoints.length !== 1 ? 's' : ''} attached
                            </div>
                        )}
                    </div>

                    {/* Media Preview (if any) */}
                    {hoveredLPMedia.length > 0 && (
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {/* Show first media file */}
                            {(() => {
                                const firstMedia = hoveredLPMedia[0];
                                if (firstMedia && firstMedia.url) {
                                    if (firstMedia.type === 'image') {
                                        return (
                                            <div
                                                style={{
                                                    width: '120px',
                                                    height: '80px',
                                                    borderRadius: '4px',
                                                    overflow: 'hidden',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <Image
                                                    src={firstMedia.url}
                                                    alt="Media preview"
                                                    width={120}
                                                    height={80}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                />
                                            </div>
                                        );
                                    } else if (firstMedia.type === 'video') {
                                        return (
                                            <div
                                                style={{
                                                    width: '120px',
                                                    height: '80px',
                                                    backgroundColor: '#333',
                                                    borderRadius: '4px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    position: 'relative'
                                                }}
                                            >
                                                <video
                                                    src={firstMedia.url}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover'
                                                    }}
                                                    muted
                                                    loop
                                                    autoPlay
                                                />
                                                <div
                                                    style={{
                                                        position: 'absolute',
                                                        top: '4px',
                                                        right: '4px',
                                                        backgroundColor: 'rgba(0,0,0,0.7)',
                                                        color: '#fff',
                                                        fontSize: '10px',
                                                        padding: '2px 4px',
                                                        borderRadius: '2px'
                                                    }}
                                                >
                                                    VID
                                                </div>
                                            </div>
                                        );
                                    }
                                }
                                return null;
                            })()}

                            {/* Show count if more than one media */}
                            {hoveredLPMedia.length > 1 && (
                                <div
                                    style={{
                                        width: '120px',
                                        height: '80px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#fff',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    +{hoveredLPMedia.length - 1}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Media Status Message */}
                    {isLoadingMedia ? (
                        <div style={{ color: '#999', fontSize: '12px', fontStyle: 'italic' }}>
                            Loading...
                        </div>
                    ) : hoveredLPMedia.length === 0 && (
                        <div style={{ color: '#999', fontSize: '12px', fontStyle: 'italic' }}>
                            No media attached
                        </div>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
                <Sidebar onCollapseChange={setIsSidebarCollapsed} />
                <div className='map-controls-container'>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        zIndex: 100,
                        height: 'fit-content',
                        position: 'relative',
                        transition: 'left 0.3s ease'
                    }}  >
                        <NewNadeDropDown />

                        {/* Zoom Controls */}
                        <div className="zoom-controls">
                            <div className="zoom-buttons">
                                <button
                                    onClick={handleZoomOut}
                                    className="zoom-button"
                                    title="Zoom Out"
                                    disabled={zoom <= 0.5}
                                >
                                    <BsZoomOut size="16" />
                                </button>
                                <button
                                    onClick={handleResetZoom}
                                    className="zoom-button reset-button"
                                    title="Reset to 100%"
                                >
                                    <BsArrowClockwise size="16" />
                                </button>
                                <button
                                    onClick={handleZoomIn}
                                    className="zoom-button"
                                    title="Zoom In"
                                    disabled={zoom >= 5}
                                >
                                    <BsZoomIn size="16" />
                                </button>
                            </div>
                            <input
                                type="range"
                                min="0.5"
                                max="5"
                                step="0.1"
                                value={zoom}
                                onChange={handleZoomChange}
                                className="zoom-slider"
                                style={{ width: '100px', height: '8px' }}
                            />
                            <span className="zoom-value">{Math.round(zoom * 100)}%</span>
                        </div>


                    </div>
                    {/* Utility Sharing Controls */}
                    <div className="sharing-controls">
                        <ShareButton
                            mapName={mapName}
                            utilities={utility.filter(item => item.map === mapName)}
                            className="map-share-button"
                        />
                        <ImportButton
                            onImportSuccess={refreshUtilities}
                            className="map-import-button"
                        />

                    </div>
                </div>
                <div
                    ref={mapContainerRef}
                    onClick={handleMapClick}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                    id='map-overview'
                    className="map-overview"
                    style={{
                        cursor: isDragging ? 'grabbing' : (zoom > 1 ? 'grab' : 'auto'),
                        transition: 'padding-left 0.3s ease'
                    }}
                >
                    {loading && (
                        <div className="loading-overlay">
                            <div className="loading-spinner">Loading utilities...</div>
                        </div>
                    )}

                    {/* Loading indicator for adding landing point */}
                    {isAddingLandingPoint && (
                        <div className="loading-overlay">
                            <div className="loading-spinner">Adding landing point...</div>
                        </div>
                    )}

                    {/* Loading indicator for adding throwing point */}
                    {isAddingThrowingPointLoading && (
                        <div className="loading-overlay">
                            <div className="loading-spinner">Adding throwing point...</div>
                        </div>
                    )}
                    <div
                        className='map-image-container'
                        style={{
                            position: 'relative',
                            display: 'inline-block',
                            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                            transformOrigin: 'center center',
                            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                        }}
                    >
                        <Image id='map-image' unoptimized priority width={0} height={0} src={`/maps/${mapName}.webp`} alt={mapName} />
                        {utility?.filter(item => item.map === mapName)
                            .filter(item => {
                                // Apply utility type filtering based on sidebar selections
                                const utilityTypeKey = item.utilityType.toLowerCase();
                                const teamKey = item.team;

                                // Check if utility type is filtered out
                                if (utilityFilter[utilityTypeKey as keyof typeof utilityFilter] === false) {
                                    return false;
                                }

                                // Check if team is filtered out
                                if (utilityFilter[teamKey as keyof typeof utilityFilter] === false) {
                                    return false;
                                }

                                return true;
                            })
                            .map((item) => {
                                const isSelected = selectedLP === item
                                return (
                                    <div key={item.id || `${item.position.X}-${item.position.Y}`}>
                                        <button
                                            className={`utility-lp-button ${isSelected ? 'selected' : ''}`}
                                            onClick={(e) => handleLPClick(item, e)}
                                            onMouseEnter={(e) => handleLPHover(item, e)}
                                            onMouseLeave={handleLPLeave}
                                            style={{
                                                left: `${item.position.X}%`,
                                                top: `${item.position.Y}%`,
                                                backgroundImage: `url(${getUtilityIconSrc(item.utilityType)})`,
                                                transform: `translate(-50%, -50%) scale(${1 / zoom})`
                                            }}
                                            key={item.position.X.toString() + item.position.Y.toString()}
                                            title={`${item.utilityType} (${item.team})`}
                                        >
                                            <div className="utility-info">
                                                <span className="utility-count">{item.throwingPoints.length}</span>
                                                <span className="team-indicator">{item.team}</span>
                                            </div>
                                        </button>
                                        {isSelected && (
                                            <>
                                                <button
                                                    className="add-throwing-point-button"
                                                    onClick={handleAddThrowingPointClick}
                                                    style={{
                                                        left: `${item.position.X + (2 / zoom)}%`,
                                                        top: `${item.position.Y - (2 / zoom)}%`,
                                                        transform: `translate(-50%, -50%) scale(${1 / zoom})`
                                                    }}
                                                    title="Add throwing point"
                                                >
                                                    <BsPlus size="1em" />
                                                </button>
                                                <button
                                                    className="delete-landing-point-button"
                                                    onClick={handleDeleteLandingPoint}
                                                    style={{
                                                        left: `${item.position.X - (2 / zoom)}%`,
                                                        top: `${item.position.Y - (2 / zoom)}%`,
                                                        transform: `translate(-50%, -50%) scale(${1 / zoom})`
                                                    }}
                                                    title="Delete landing point"
                                                >
                                                    <BsTrash size="1em" />
                                                </button>
                                            </>
                                        )}
                                        {isSelected && (
                                            <>
                                                {/* Dashed lines connecting landing point to throwing points */}
                                                <svg
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        pointerEvents: 'none',
                                                        zIndex: 5
                                                    }}
                                                >
                                                    {item.throwingPoints.map((tp) => (
                                                        <line
                                                            key={`line-${tp.id || `${tp.position.X}-${tp.position.Y}`}`}
                                                            x1={`${item.position.X}%`}
                                                            y1={`${item.position.Y}%`}
                                                            x2={`${tp.position.X}%`}
                                                            y2={`${tp.position.Y}%`}
                                                            stroke="#4CAF50"
                                                            strokeWidth="2"
                                                            strokeDasharray="5,5"
                                                            opacity="0.8"
                                                        />
                                                    ))}
                                                </svg>
                                                {/* Throwing point buttons */}
                                                {item.throwingPoints.map((tp) => (
                                                    <button
                                                        key={tp.id || `${tp.position.X}-${tp.position.Y}`}
                                                        className={'utility-tp-button'}
                                                        onClick={(e) => handleTPClick(tp, e)}
                                                        onMouseEnter={(e) => handleTPHover(tp, e)}
                                                        onMouseLeave={handleTPLeave}
                                                        style={{
                                                            left: `${tp.position.X}%`,
                                                            top: `${tp.position.Y}%`,
                                                            transform: `translate(-50%, -50%) scale(${1 / zoom})`
                                                        }}
                                                    />
                                                ))}
                                            </>
                                        )}
                                    </div>)
                            })}
                    </div>

                </div>
            </div>

            {/* Tutorial Overlay - rendered at document body level */}
            <TutorialOverlay
                isActive={tutorial.isActive}
                currentStep={tutorial.getCurrentStep()}
                currentStepIndex={tutorial.currentStep}
                totalSteps={tutorial.steps.length}
                onNext={tutorial.nextStep}
                onPrevious={tutorial.previousStep}
                onSkip={tutorial.skipTutorial}
            />
        </>
    )
}

// Wrapper component that provides the context
const MapViewer = (props: MapViewerProps) => {
    const [utilityFilter, setUtilityFilter] = useState({
        smoke: true,
        flash: true,
        molotov: true,
        he: true,
        T: true,
        CT: true
    });

    return (
        <UtilityFilterContext.Provider value={{ utilityFilter, setUtilityFilter }}>
            <MapViewerInner {...props} />
        </UtilityFilterContext.Provider>
    );
}

export default MapViewer;