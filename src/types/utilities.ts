export type TUtilityLandingPoint = {
    id?: string; // Database ID
    map: string;
    utilityType: string // Type of utility
    team: string // 'T' for Terrorist, 'CT' for Counter-Terrorist
    position: { X: number, Y: number } // Coordinates of utility landing point
    throwingPoints: TUtilityThrowingPoint[] // Single utility can have multiple throwing points
}

export type TUtilityThrowingPoint = {
    id?: string; // Database ID
    position: { X: number, Y: number }
    title: string
    description: string
    url: string
}

