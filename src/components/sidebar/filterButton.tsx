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
        //@ts-ignore
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
            return `/icons/${type}.png`
        }
        return `/icons/${type}.svg`
    }

    return (
        <>
            <button onClick={handleClick} className={isActive ? 'sidebar-filter-button active' : 'sidebar-filter-button'}>
                <div style={{ height: '1.5em' }}>
                    <Image unoptimized alt={''} height={0} width={0} src={getIconSrc()} style={{ height: '100%', width: 'auto' }} />
                </div>
                <div style={{ textTransform: 'capitalize' }}>{title + ' '}{isActive && <>&#x2713;</>}</div>
            </button>
        </>

    )
}

export default FilterButton;