'use client'

import { UtilityFilterContext } from "@/utils/contexts"
import Image from 'next/image'
import { useContext, useState, useEffect } from "react"

interface FilterButtonProps {
    type: string
    title: string
    iconType?: 'svg' | 'png' // Optional prop to specify icon type
}

const FilterButton = (props: FilterButtonProps) => {
    const { utilityFilter, setUtilityFilter } = useContext(UtilityFilterContext)
    const { type, title, iconType = 'svg' } = props
    const [isActive, setIsActive] = useState(true)

    // Sync local state with context on mount
    useEffect(() => {
        //@ts-expect-error - Dynamic key access to utilityFilter object
        setIsActive(utilityFilter[type] !== false)
    }, [utilityFilter, type])

    const handleClick = () => {
        const newActiveState = !isActive;
        setIsActive(newActiveState);

        // Update the context with the new filter state
        setUtilityFilter({
            ...utilityFilter,
            [type]: newActiveState
        });
    }

    // Determine the icon source based on iconType
    const getIconSrc = () => {
        if (iconType === 'png') {
            // Map filter types to actual icon file names
            const iconMapping: Record<string, string> = {
                'T': 'terrorist',
                'CT': 'ct'
            };
            const iconName = iconMapping[type] || type;
            return `/icons/${iconName}.png`
        }

        // Map filter types to actual icon file names for SVG
        const iconMapping: Record<string, string> = {
            'smoke': 'smoke_filter',
            'molotov': 'molotov_filter',
            'flash': 'flashbang_filter',
            'he': 'he_filter'
        };
        const iconName = iconMapping[type] || type;
        return `/icons/${iconName}.svg`
    }

    return (
        <>
            <button onClick={handleClick} className={isActive ? 'sidebar-filter-button active' : 'sidebar-filter-button'}>
                <div style={{ height: '1.5em' }}>
                    <Image unoptimized alt={''} height={0} width={0} src={getIconSrc()} style={{ height: '100%', width: 'auto' }} />
                </div>
                <div style={{ textTransform: 'capitalize', height: '1.5em', display: 'flex', alignItems: 'center' }}>
                    {title}
                    {isActive && <span style={{ marginLeft: '0.25em' }}>&#x2713;</span>}
                </div>
            </button>
        </>

    )
}

export default FilterButton;