import { createContext } from 'react'

export const UtilityFilterContext = createContext<{
    utilityFilter: {}, setUtilityFilter: any
}>({
    utilityFilter: {
        smoke: true,
        flash: true,
        molotov: true,
        he: true
    }, setUtilityFilter: () => { }
})