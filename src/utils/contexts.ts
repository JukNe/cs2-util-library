import { createContext } from 'react'

interface UtilityFilter {
    smoke: boolean;
    flash: boolean;
    molotov: boolean;
    he: boolean;
    T: boolean;
    CT: boolean;
}

interface UtilityFilterContextType {
    utilityFilter: UtilityFilter;
    setUtilityFilter: (filter: UtilityFilter) => void;
}

export const UtilityFilterContext = createContext<UtilityFilterContextType>({
    utilityFilter: {
        smoke: true,
        flash: true,
        molotov: true,
        he: true,
        T: true,
        CT: true
    },
    setUtilityFilter: () => { }
})