import { useState, useCallback } from 'react';
import { TUtilityLandingPoint } from '@/types/utilities';

interface SharedUtilityData {
    mapName: string;
    utilities: TUtilityLandingPoint[];
    sharedBy: string;
    sharedAt: string;
    description?: string;
}

interface UseUtilitySharingReturn {
    // Export functionality
    exportUtilities: (mapName: string, utilities: TUtilityLandingPoint[], description?: string) => Promise<string>;
    exportToClipboard: (mapName: string, utilities: TUtilityLandingPoint[], description?: string) => Promise<void>;

    // Import functionality
    importUtilities: (shareCode: string) => Promise<SharedUtilityData>;
    validateShareCode: (shareCode: string) => boolean;

    // State
    isExporting: boolean;
    isImporting: boolean;
    error: string | null;

    // Utility functions
    generateShareCode: (data: SharedUtilityData) => string;
    parseShareCode: (shareCode: string) => SharedUtilityData | null;
}

export const useUtilitySharing = (): UseUtilitySharingReturn => {
    const [isExporting, setIsExporting] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Generate a share code from utility data
    const generateShareCode = useCallback((data: SharedUtilityData): string => {
        const compressedData = JSON.stringify(data);
        // Use base64 encoding for the share code
        return btoa(compressedData);
    }, []);

    // Parse a share code back to utility data
    const parseShareCode = useCallback((shareCode: string): SharedUtilityData | null => {
        try {
            const decodedData = atob(shareCode);
            const parsedData = JSON.parse(decodedData);

            // Validate the parsed data structure
            if (!parsedData.mapName || !parsedData.utilities || !Array.isArray(parsedData.utilities)) {
                throw new Error('Invalid share code format');
            }

            return parsedData as SharedUtilityData;
        } catch (error) {
            return null;
        }
    }, []);

    // Validate if a share code is valid
    const validateShareCode = useCallback((shareCode: string): boolean => {
        return parseShareCode(shareCode) !== null;
    }, [parseShareCode]);

    // Export utilities and return a share code
    const exportUtilities = useCallback(async (
        mapName: string,
        utilities: TUtilityLandingPoint[],
        description?: string
    ): Promise<string> => {
        setIsExporting(true);
        setError(null);

        try {
            // Get current user info from session
            const sessionResponse = await fetch('/api/auth/check-session', {
                credentials: 'include'
            });

            if (!sessionResponse.ok) {
                throw new Error('User not authenticated');
            }

            const sessionData = await sessionResponse.json();

            if (!sessionData.success || !sessionData.session) {
                throw new Error('User not authenticated');
            }

            const userData = sessionData.session.user;

            const sharedData: SharedUtilityData = {
                mapName,
                utilities,
                sharedBy: userData.email || 'Unknown User',
                sharedAt: new Date().toISOString(),
                description
            };

            const shareCode = generateShareCode(sharedData);

            // Optionally save to database for tracking
            await fetch('/api/utilities/share', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    mapName,
                    shareCode,
                    description
                })
            });

            return shareCode;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to export utilities';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsExporting(false);
        }
    }, [generateShareCode]);

    // Export utilities and copy to clipboard
    const exportToClipboard = useCallback(async (
        mapName: string,
        utilities: TUtilityLandingPoint[],
        description?: string
    ): Promise<void> => {
        try {
            const shareCode = await exportUtilities(mapName, utilities, description);

            // Create a shareable URL
            const shareUrl = `${window.location.origin}/share/${shareCode}`;

            // Copy to clipboard
            await navigator.clipboard.writeText(shareUrl);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to copy to clipboard';
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, [exportUtilities]);

    // Import utilities from a share code
    const importUtilities = useCallback(async (shareCode: string): Promise<SharedUtilityData> => {
        setIsImporting(true);
        setError(null);

        try {
            const sharedData = parseShareCode(shareCode);

            if (!sharedData) {
                throw new Error('Invalid share code');
            }

            // Import the utilities to the current user's account
            const response = await fetch('/api/utilities/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    mapName: sharedData.mapName,
                    utilities: sharedData.utilities
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to import utilities');
            }

            return sharedData;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to import utilities';
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setIsImporting(false);
        }
    }, [parseShareCode]);

    return {
        exportUtilities,
        exportToClipboard,
        importUtilities,
        validateShareCode,
        isExporting,
        isImporting,
        error,
        generateShareCode,
        parseShareCode
    };
}; 