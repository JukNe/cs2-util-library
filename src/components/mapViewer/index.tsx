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
    const [throwingPointsVisible, setThrowingPointsVisible] = useState(false)
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
    const [hoveredTPMedia, setHoveredTPMedia] = useState<any[]>([])
    const { utilityFilter, setUtilityFilter } = useContext(UtilityFilterContext)
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
                        <button
                            onClick={() => setSelectedNade('Smoke')}
                            className="utility-dropdown-item"
                            title="Smoke Grenade"
                        >
                            <Image className={'utility-dropdown-icon'} unoptimized alt={'Smoke'} height={0} width={0} src={`/icons/smoke.svg`} />
                            <span className="utility-label">Smoke</span>
                        </button>
                        <button
                            onClick={() => setSelectedNade('Molotov')}
                            className="utility-dropdown-item"
                            title="Molotov Cocktail"
                        >
                            <Image className={'utility-dropdown-icon'} unoptimized alt={'Molotov'} height={0} width={0} src={`/icons/molotov.svg`} />
                            <span className="utility-label">Molotov</span>
                        </button>
                        <button
                            onClick={() => setSelectedNade('Flash')}
                            className="utility-dropdown-item"
                            title="Flashbang"
                        >
                            <Image className={'utility-dropdown-icon'} unoptimized alt={'Flash'} height={0} width={0} src={`/icons/flash.svg`} />
                            <span className="utility-label">Flash</span>
                        </button>
                        <button
                            onClick={() => setSelectedNade('HE')}
                            className="utility-dropdown-item"
                            title="HE Grenade"
                        >
                            <Image className={'utility-dropdown-icon'} unoptimized alt={'HE'} height={0} width={0} src={`/icons/HE.svg`} />
                            <span className="utility-label">HE</span>
                        </button>
                    </div>
                }
            </div>
        )
    }

    const handleAddNewUtil = async (e: any) => {
        const bounds = e.currentTarget.getBoundingClientRect()
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

    const handleAddThrowingPoint = async (e: any) => {
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
                        const updatedUtilities = previous.map(item =>
                            item.id === selectedLP.id
                                ? { ...item, throwingPoints: [...item.throwingPoints, result.data] }
                                : item
                        )

                        // Update the selectedLP reference to the new object
                        const updatedSelectedLP = updatedUtilities.find(item => item.id === selectedLP.id)

                        if (updatedSelectedLP) {
                            setSelectedLP(updatedSelectedLP)
                        }

                        return updatedUtilities
                    })

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
    }

    // Handle zoom slider change
    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newZoom = parseFloat(e.target.value)
        setZoom(newZoom)

        // Reset pan when zooming out to 1x
        if (newZoom <= 1) {
            setPan({ x: 0, y: 0 })
        }
    }

    // Handle wheel zoom with shift key
    const handleWheel = (e: React.WheelEvent) => {
        if (e.shiftKey) {
            e.preventDefault()
            const delta = e.deltaY > 0 ? -0.1 : 0.1
            const newZoom = Math.max(0.5, Math.min(5, zoom + delta))
            setZoom(newZoom)

            // Reset pan when zooming out to 1x
            if (newZoom <= 1) {
                setPan({ x: 0, y: 0 })
            }
        }
    }

    // Handle mouse drag for panning
    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom > 1) {
            setIsDragging(true)
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
        }
    }

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && zoom > 1) {
            setPan({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            })
        }
    }

    const handleMouseUp = () => {
        setIsDragging(false)
    }

    // Reset zoom and pan when map changes
    useEffect(() => {
        setZoom(1)
        setPan({ x: 0, y: 0 })
    }, [mapName])


    const handleLPClick = (data: TUtilityLandingPoint, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent the map click handler from firing
        if (selectedLP === data) {
            // If clicking the same landing point, deselect it
            setSelectedLP(undefined)
            setIsAddingThrowingPoint(false)
        } else {
            // Select new landing point
            setSelectedLP(data)
            setIsAddingThrowingPoint(false)
        }
    }

    const handleAddThrowingPointClick = (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent the map click handler from firing
        setIsAddingThrowingPoint(true)
    }

    const handleDeleteLandingPoint = async (e: React.MouseEvent) => {
        e.stopPropagation() // Prevent the map click handler from firing
        if (selectedLP) {
            try {
                // Delete from database
                const response = await fetch(`/api/utilities?utilityId=${selectedLP.id}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include'
                });

                if (response.ok) {
                    const result = await response.json();
                    if (result.success) {
                        // Remove from local state
                        setUtility((previous) => previous.filter(item => item !== selectedLP))
                        setSelectedLP(undefined)
                        setIsAddingThrowingPoint(false)
                        console.log('Landing point deleted successfully');
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
        }
    }

    const handleDeleteThrowingPoint = (tp: TUtilityThrowingPoint, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent the map click handler from firing
        if (selectedLP) {
            setUtility((previous) =>
                previous.map(item =>
                    item === selectedLP
                        ? { ...item, throwingPoints: item.throwingPoints.filter(t => t !== tp) }
                        : item
                )
            )
            // Close the modal after deleting the throwing point
            setIsModalOpen(false)
            setSelectedTP(undefined)
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

    const handleTPClick = (data: TUtilityThrowingPoint, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent the map click handler from firing
        setSelectedTP(data)
        setIsModalOpen(true)
        setIsEditingDescription(false)
        setEditedDescription(data.description || '')
    }

    const handleTPHover = (data: TUtilityThrowingPoint, e: React.MouseEvent) => {
        // Clear any existing timeout
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
        }

        // Set a timeout to show the modal after a short delay
        const timeout = setTimeout(async () => {
            // Calculate position to prevent going off-screen
            const modalWidth = 300; // Approximate width of mini modal
            const modalHeight = 200; // Increased height to accommodate image
            const padding = 20;

            let x = e.clientX + 10;
            let y = e.clientY - 10;

            // Check if modal would go off the right edge
            if (x + modalWidth > window.innerWidth - padding) {
                x = e.clientX - modalWidth - 10;
            }

            // Check if modal would go off the bottom edge
            if (y + modalHeight > window.innerHeight - padding) {
                y = e.clientY - modalHeight - 10;
            }

            // Ensure modal doesn't go off the left or top edges
            x = Math.max(padding, x);
            y = Math.max(padding, y);

            setHoverPosition({ x, y });
            setHoveredTP(data);

            // Fetch media for the hovered throwing point
            if (data.id) {
                try {
                    const params = new URLSearchParams();
                    params.append('throwingPointId', data.id);

                    const response = await fetch(`/api/media/get?${params}`, {
                        credentials: 'include'
                    });
                    if (response.ok) {
                        const result = await response.json();
                        setHoveredTPMedia(result.media || []);
                    }
                } catch (error) {
                    console.error('Error fetching media for hover:', error);
                    setHoveredTPMedia([]);
                }
            }
        }, 300); // 300ms delay

        setHoverTimeout(timeout);
    }

    const handleTPLeave = () => {
        // Clear the timeout if it exists
        if (hoverTimeout) {
            clearTimeout(hoverTimeout);
            setHoverTimeout(null);
        }
        setHoveredTP(null);
        setHoveredTPMedia([]);
    }

    const handleModalClose = () => {
        setIsModalOpen(false)
        setSelectedTP(undefined)
        setIsEditingDescription(false)
        setEditedDescription('')
        setIsSavingDescription(false)
        setIsEditingTitle(false)
        setEditedTitle('')
        setIsSavingTitle(false)
    }

    const handleDescriptionUpdate = (newDescription: string) => {
        if (selectedTP) {
            // Update the selectedTP with the new description
            setSelectedTP({ ...selectedTP, description: newDescription });

            // Update the utility state to reflect the change
            setUtility((previous) =>
                previous.map(item =>
                    item.throwingPoints.some(tp => tp.id === selectedTP.id)
                        ? {
                            ...item,
                            throwingPoints: item.throwingPoints.map(tp =>
                                tp.id === selectedTP.id
                                    ? { ...tp, description: newDescription }
                                    : tp
                            )
                        }
                        : item
                )
            );
        }
    }

    const handleEditClick = () => {
        setIsEditingDescription(true);
        setIsEditingTitle(true);
        setEditedDescription(selectedTP?.description || '');
        setEditedTitle(selectedTP?.title || '');
    };

    const handleCancelEdit = () => {
        setIsEditingDescription(false);
        setIsEditingTitle(false);
        setEditedDescription(selectedTP?.description || '');
        setEditedTitle(selectedTP?.title || '');
        setPendingMediaChanges({});
    };

    const handleSaveDescription = async () => {
        if (!selectedTP) {
            console.error('No throwing point selected for update');
            return;
        }

        setIsSavingDescription(true);
        try {
            const response = await fetch('/api/utilities/throwing-points', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: selectedTP.id,
                    description: editedDescription
                }),
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setIsEditingDescription(false);
                    handleDescriptionUpdate(editedDescription);
                    console.log('Description updated successfully');
                } else {
                    console.error('Failed to update description:', result.error);
                    alert('Failed to update description. Please try again.');
                }
            } else {
                console.error('Failed to update description');
                alert('Failed to update description. Please try again.');
            }
        } catch (error) {
            console.error('Error updating description:', error);
            alert('Error updating description. Please try again.');
        } finally {
            setIsSavingDescription(false);
        }
    };

    const handleEditTitleClick = () => {
        setIsEditingTitle(true);
        setEditedTitle(selectedTP?.title || '');
    };

    const handleCancelEditTitle = () => {
        setIsEditingTitle(false);
        setEditedTitle(selectedTP?.title || '');
    };

    const handleSaveTitle = async () => {
        if (!selectedTP) {
            console.error('No throwing point selected for update');
            return;
        }

        setIsSavingTitle(true);
        try {
            const response = await fetch('/api/utilities/throwing-points', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: selectedTP.id,
                    title: editedTitle
                }),
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                if (result.success) {
                    setIsEditingTitle(false);
                    // Update the selectedTP with new title
                    setSelectedTP(prev => prev ? { ...prev, title: editedTitle } : undefined);
                    // Update the utility state to reflect the change
                    setUtility(prev => prev.map(item =>
                        item.throwingPoints.some(tp => tp.id === selectedTP.id)
                            ? {
                                ...item,
                                throwingPoints: item.throwingPoints.map(tp =>
                                    tp.id === selectedTP.id
                                        ? { ...tp, title: editedTitle }
                                        : tp
                                )
                            }
                            : item
                    ));
                    console.log('Title updated successfully');
                } else {
                    console.error('Failed to update title:', result.error);
                    alert('Failed to update title. Please try again.');
                }
            } else {
                console.error('Failed to update title');
                alert('Failed to update title. Please try again.');
            }
        } catch (error) {
            console.error('Error updating title:', error);
            alert('Error updating title. Please try again.');
        } finally {
            setIsSavingTitle(false);
        }
    };

    const handleMediaDescriptionChange = (mediaId: string, description: string) => {
        // Store the change locally until save is clicked
        setPendingMediaChanges(prev => ({
            ...prev,
            [mediaId]: description
        }));
    };

    const handleSaveAll = async () => {
        setIsSavingDescription(true);
        setIsSavingTitle(true);

        try {
            // Save title changes
            if (isEditingTitle) {
                await handleSaveTitle();
            }

            // Save description changes
            if (isEditingDescription) {
                await handleSaveDescription();
            }

            // Save media description changes
            const mediaUpdatePromises = Object.entries(pendingMediaChanges).map(async ([mediaId, description]) => {
                try {
                    const response = await fetch(`/api/media/update-description`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            mediaId,
                            description,
                        }),
                        credentials: 'include'
                    });

                    if (!response.ok) {
                        console.error(`Failed to update media description for ${mediaId}`);
                        throw new Error(`Failed to update media description for ${mediaId}`);
                    }
                } catch (error) {
                    console.error(`Error updating media description for ${mediaId}:`, error);
                    throw error;
                }
            });

            await Promise.all(mediaUpdatePromises);

            // Refresh media carousel to show updated descriptions
            if (utilityViewerRef.current) {
                utilityViewerRef.current.fetchMedia();
            }

            // Clear pending changes and exit edit mode
            setPendingMediaChanges({});
            setIsEditingDescription(false);
            setIsEditingTitle(false);

            console.log('All changes saved successfully');
        } catch (error) {
            console.error('Error saving changes:', error);
            alert('Error saving changes. Please try again.');
        } finally {
            setIsSavingDescription(false);
            setIsSavingTitle(false);
        }
    };

    const handleMapClick = (e: any) => {
        if (selectedNade) {
            handleAddNewUtil(e)
        } else if (isAddingThrowingPoint) {
            handleAddThrowingPoint(e)
        }
    }

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
                        isEditingDescription={isEditingDescription}
                        editedDescription={editedDescription}
                        onDescriptionChange={setEditedDescription}
                        onEditClick={handleEditClick}
                        onSaveDescription={handleSaveDescription}
                        onCancelEdit={handleCancelEdit}
                        isSavingDescription={isSavingDescription}
                        onMediaDescriptionChange={handleMediaDescriptionChange}
                        pendingMediaChanges={pendingMediaChanges}
                    />
                </div>}

            {/* Mini Preview Modal on Hover */}
            {hoveredTP && (
                <div
                    className="mini-preview-modal"
                    style={{
                        position: 'fixed',
                        left: hoverPosition.x + 10,
                        top: hoverPosition.y - 10,
                        zIndex: 1000
                    }}
                >
                    <div className="mini-preview-content">
                        <div className="mini-preview-header">
                            <h4>{hoveredTP.title}</h4>
                        </div>
                        <div className="mini-preview-body">
                            {hoveredTPMedia.length > 0 && (
                                <div className="mini-preview-image">
                                    {hoveredTPMedia[0].type === 'image' || hoveredTPMedia[0].type === 'gif' ? (
                                        <Image
                                            src={hoveredTPMedia[0].url}
                                            alt={hoveredTPMedia[0].title || 'Media'}
                                            className="mini-preview-img"
                                            unoptimized
                                            fill
                                            sizes="300px"
                                        />
                                    ) : (
                                        <video
                                            src={hoveredTPMedia[0].url}
                                            className="mini-preview-video"
                                            muted
                                            autoPlay
                                            loop
                                        />
                                    )}
                                </div>
                            )}
                            <div className="mini-description">
                                {hoveredTP.description}
                            </div>
                        </div>
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
                                if ((utilityFilter as any)[utilityTypeKey] === false) {
                                    return false;
                                }

                                // Check if team is filtered out
                                if ((utilityFilter as any)[teamKey] === false) {
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
                                        {isSelected && item.throwingPoints.map((tp, index) => (
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