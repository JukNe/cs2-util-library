export interface Media {
    id: string;
    url: string;
    type: string;
    title?: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    utilityId?: string;
    throwingPointId?: string;
    utility?: {
        id: string;
        title: string;
        map: {
            name: string;
            displayName: string;
        };
    };
    throwingPoint?: {
        id: string;
        title: string;
        utility: {
            id: string;
            title: string;
            map: {
                name: string;
                displayName: string;
            };
        };
    };
} 