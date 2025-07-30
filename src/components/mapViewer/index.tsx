'use client'

import './style.scss'
import { TUtilityThrowingPoint, TUtilityLandingPoint } from '@/types/utilities';
import Image from 'next/image'
import { useContext, useEffect, useState, useRef } from 'react';
import Sidebar from '../sidebar';
import { BsPlus, BsX, BsTrash, BsPencil, BsCheck } from 'react-icons/bs';
import UtilityPreview from '../utilityViewer';
import { UtilityFilterContext } from '@/utils/contexts';
import { UtilityViewerRef } from '../utilityViewer';


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

    const [selectedTP, setSelectedTP] = useState<TUtilityThrowingPoint>()
    const [selectedLP, setSelectedLP] = useState<TUtilityLandingPoint>()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isAddingThrowingPoint, setIsAddingThrowingPoint] = useState(false)
    const [hoveredTP, setHoveredTP] = useState<TUtilityThrowingPoint | null>(null)
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
    const [hoveredTPMedia, setHoveredTPMedia] = useState<unknown[]>([])
    const { utilityFilter } = useContext(UtilityFilterContext)
    const utilityViewerRef = useRef<UtilityViewerRef>(null)

    // Zoom and pan state
    const [zoom, setZoom] = useState(1)
    const [pan, setPan] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
    const mapContainerRef = useRef<HTMLDivElement>(null)

    // Fetch utilities from database on component mount
    useEffect(() => {
        const fetchUtilities = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/maps/${mapName}`, {
                    credentials: 'include'
                });
                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        setUtility(result.data);
                    }
                }
            } catch (error) {
                console.error('Error fetching utilities:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUtilities();
    }, [mapName]);

    const NewNadeDropDown = () => {
        return (
            <div className={'add-nade-dropdown'}>
                <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="main-add-button"
                    title="Add new utility"
                >
                    <BsPlus size={'2em'} />
                </button>
                {isDropdownOpen &&
                    <div className="utility-dropdown-menu">
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
                }
            </div>
        )
    }

    const handleAddNewUtil = async (e: React.MouseEvent) => {
        const img = document.getElementById('map-image') as HTMLImageElement

        if (!img || !selectedNade) return

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
                credentials: 'include' // <-- Ensure cookies/session are sent
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    // Add to local state
                    setUtility((previous) => [...previous, result.data]);
                    console.log(selectedNade, 'for team', selectedTeam, 'saved at', xPercent.toFixed(2) + '%, ' + yPercent.toFixed(2) + '%');
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
        }

        setSelectedNade(undefined)
    }

    const handleAddThrowingPoint = async (e: React.MouseEvent) => {
        if (!selectedLP || !isAddingThrowingPoint) return

        const img = document.getElementById('map-image') as HTMLImageElement
        if (!img) return

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
                    description: 'Click to edit description'
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
                                return {
                                    ...item,
                                    throwingPoints: [...item.throwingPoints, result.data]
                                };
                            }
                            return item;
                        });
                    });
                    console.log('Throwing point saved at', xPercent.toFixed(2) + '%, ' + yPercent.toFixed(2) + '%');
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
        }

        setIsAddingThrowingPoint(false)
    }

    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newZoom = parseFloat(e.target.value);
        setZoom(newZoom);
    };

    const handleWheel = (e: React.WheelEvent) => {
        // Only zoom if Shift key is held down
        if (e.shiftKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            const newZoom = Math.max(0.5, Math.min(5, zoom + delta));
            setZoom(newZoom);
        }
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0 && zoom > 1) { // Left mouse button and zoomed in
            setIsDragging(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
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
        setSelectedLP(data);
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
                } else {
                    console.error('Failed to delete landing point:', result.error);
                    alert('Failed to delete landing point. Please try again.');
                }
            } else {
                console.error('Failed to delete landing point');
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
            // Fetch media for this throwing point
            fetch(`/api/media/get?throwingPointId=${data.id}`, {
                credentials: 'include'
            }).then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error('Failed to fetch media');
            }).then(result => {
                if (result.success) {
                    setHoveredTPMedia(result.data);
                }
            }).catch(error => {
                console.error('Error fetching media:', error);
                setHoveredTPMedia([]);
            });
        }, 500);

        setHoverTimeout(timeout);
    };

    const handleTPLeave = () => {
        setHoveredTP(null);
        setHoveredTPMedia([]);
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

    const handleDescriptionUpdate = (newDescription: string) => {
        if (selectedTP) {
            setSelectedTP({
                ...selectedTP,
                description: newDescription
            });
        }
    };

    const handleEditClick = () => {
        if (selectedTP) {
            setIsEditingDescription(true);
            setIsEditingTitle(true);
            setEditedDescription(selectedTP.description || '');
            setEditedTitle(selectedTP.title || '');
        }
    };

    const handleCancelEdit = () => {
        setIsEditingDescription(false);
        setIsEditingTitle(false);
        setEditedDescription('');
        setEditedTitle('');
        setPendingMediaChanges({});
    };

    const handleSaveDescription = async () => {
        if (!selectedTP) return;

        setIsSavingDescription(true);
        try {
            const response = await fetch(`/api/utilities/throwing-points/${selectedTP.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description: editedDescription
                }),
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setSelectedTP({
                        ...selectedTP,
                        description: editedDescription
                    });
                    setIsEditingDescription(false);
                } else {
                    console.error('Failed to save description:', result.error);
                    alert('Failed to save description. Please try again.');
                }
            } else {
                console.error('Failed to save description');
                alert('Failed to save description. Please try again.');
            }
        } catch (error) {
            console.error('Error saving description:', error);
            alert('Error saving description. Please try again.');
        } finally {
            setIsSavingDescription(false);
        }
    };

    const handleSaveTitle = async () => {
        if (!selectedTP) return;

        setIsSavingTitle(true);
        try {
            const response = await fetch(`/api/utilities/throwing-points/${selectedTP.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: editedTitle
                }),
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setSelectedTP({
                        ...selectedTP,
                        title: editedTitle
                    });
                    setIsEditingTitle(false);
                } else {
                    console.error('Failed to save title:', result.error);
                    alert('Failed to save title. Please try again.');
                }
            } else {
                console.error('Failed to save title');
                alert('Failed to save title. Please try again.');
            }
        } catch (error) {
            console.error('Error saving title:', error);
            alert('Error saving title. Please try again.');
        } finally {
            setIsSavingTitle(false);
        }
    };

    const handleMediaDescriptionChange = (mediaId: string, description: string) => {
        setPendingMediaChanges(prev => ({
            ...prev,
            [mediaId]: description
        }));
    };

    const handleSaveAll = async () => {
        if (!selectedTP) return;

        setIsSavingDescription(true);
        setIsSavingTitle(true);

        try {
            // Save title
            const titleResponse = await fetch(`/api/utilities/throwing-points/${selectedTP.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: editedTitle
                }),
                credentials: 'include'
            });

            if (!titleResponse.ok) {
                throw new Error('Failed to save title');
            }

            const titleResult = await titleResponse.json();
            if (!titleResult.success) {
                throw new Error(titleResult.error || 'Failed to save title');
            }

            // Save description
            const descResponse = await fetch(`/api/utilities/throwing-points/${selectedTP.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    description: editedDescription
                }),
                credentials: 'include'
            });

            if (!descResponse.ok) {
                throw new Error('Failed to save description');
            }

            const descResult = await descResponse.json();
            if (!descResult.success) {
                throw new Error(descResult.error || 'Failed to save description');
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
            setSelectedTP({
                ...selectedTP,
                title: editedTitle,
                description: editedDescription
            });
            setIsEditingDescription(false);
            setIsEditingTitle(false);
            setPendingMediaChanges({});

        } catch (error) {
            console.error('Error saving all changes:', error);
            alert('Error saving changes. Please try again.');
        } finally {
            setIsSavingDescription(false);
            setIsSavingTitle(false);
        }
    };

    const handleMapClick = (e: React.MouseEvent) => {
        if (selectedNade) {
            handleAddNewUtil(e)
        } else if (isAddingThrowingPoint) {
            handleAddThrowingPoint(e)
        }
    }

    useEffect(() => {
        setIsDropdownOpen(false)
        const img = document.getElementById('map-image')
        if (img) {
            if (selectedNade != undefined) {
                img.style.cursor = 'crosshair'
            } else if (isAddingThrowingPoint) {
                img.style.cursor = 'crosshair'
            } else {
                img.style.cursor = zoom > 1 ? 'grab' : 'auto'
            }
        }
    }, [selectedNade, zoom, isAddingThrowingPoint])

    return (
        <>
            {selectedTP && isModalOpen &&
                <div className={'modal-wrapper'}>
                    <div className='utility-modal-header'>
                        <div className="modal-header-content">
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
                                <h2 style={{ fontSize: '1.5em', padding: '1em' }}>
                                    {selectedTP.title}
                                </h2>
                            )}
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
                        <div style={{ display: 'flex', height: '100%', gap: '1em', alignItems: 'center' }}>
                            {!isEditingDescription && (
                                <button
                                    onClick={handleEditClick}
                                    className="edit-all-button"
                                    title="Edit title, description, and media"
                                >
                                    <BsPencil size="1.5em" />
                                </button>
                            )}
                            {isEditingDescription && (
                                <div className="unified-edit-actions">
                                    <button
                                        className="delete-throwing-point-button"
                                        onClick={(e) => handleDeleteThrowingPoint(selectedTP!, e)}
                                        disabled={isSavingTitle || isSavingDescription}
                                        title="Delete throwing point"
                                    >
                                        <BsTrash size="1.5em" />
                                    </button>
                                    <button
                                        className="cancel-all-button"
                                        onClick={handleCancelEdit}
                                        disabled={isSavingTitle || isSavingDescription}
                                    >
                                        <BsX size="1em" />
                                        Cancel
                                    </button>
                                    <button
                                        className="save-all-button"
                                        onClick={handleSaveAll}
                                        disabled={isSavingTitle || isSavingDescription}
                                    >
                                        <BsCheck size="1em" />
                                        {isSavingTitle || isSavingDescription ? 'Saving...' : 'Save All'}
                                    </button>
                                </div>
                            )}
                            <button onClick={handleModalClose} style={{ border: 'none', height: '100%', width: '5em' }}><BsX size={'2em'} />
                            </button>
                        </div>
                    </div>
                    <UtilityPreview
                        ref={utilityViewerRef}
                        position={
                            {
                                X: selectedTP.position.X,
                                Y: selectedTP.position.Y
                            }
                        }
                        url={selectedTP.url}
                        description={selectedTP.description}
                        throwingPointId={selectedTP.id}
                        onDescriptionUpdate={handleDescriptionUpdate}
                        onMediaDescriptionChange={handleMediaDescriptionChange}
                        pendingMediaChanges={pendingMediaChanges}
                        isEditingDescription={isEditingDescription}
                    />
                </div>
            }

            {/* Hover Preview */}
            {hoveredTP && hoveredTPMedia.length > 0 && (
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
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        {hoveredTPMedia.slice(0, 4).map((media: unknown, index: number) => (
                            <div
                                key={index}
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
                                {typeof media === 'object' && media && 'type' in media && media.type === 'image' ? 'IMG' : 'VID'}
                            </div>
                        ))}
                        {hoveredTPMedia.length > 4 && (
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
                                +{hoveredTPMedia.length - 4}
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'row', height: '100%' }}>
                <Sidebar />
                <div
                    ref={mapContainerRef}
                    onClick={handleMapClick}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                    id='map-overview'
                    className={'map-overview'}
                    style={{ cursor: isDragging ? 'grabbing' : (zoom > 1 ? 'grab' : 'auto') }}
                >
                    {loading && (
                        <div className="loading-overlay">
                            <div className="loading-spinner">Loading utilities...</div>
                        </div>
                    )}
                    <div
                        style={{
                            position: 'relative',
                            display: 'inline-block',
                            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                            transformOrigin: 'center center',
                            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                        }}
                    >
                        <Image id='map-image' unoptimized priority width={0} height={0} src={`maps//${mapName}.webp`} alt={mapName} />
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
                                            style={{
                                                left: `${item.position.X}%`,
                                                top: `${item.position.Y}%`,
                                                backgroundImage: `url(/icons/${item.utilityType}.svg)`,
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
                                        {isSelected && item.throwingPoints.map((tp) => (
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
                                    </div>)
                            })}
                    </div>
                    <NewNadeDropDown />

                    {/* Zoom Slider */}
                    <div className="zoom-controls">
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
            </div>
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