'use client'

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { TUtilityLandingPoint } from '@/types/utilities';
import { BsDownload, BsCheck, BsX, BsShare, BsArrowLeft } from 'react-icons/bs';
import { useUtilitySharing } from '@/hooks/useUtilitySharing';
import Link from 'next/link';
import './style.scss';

interface SharedUtilityData {
    mapName: string;
    utilities: TUtilityLandingPoint[];
    sharedBy: string;
    sharedAt: string;
    description?: string;
}

export default function SharePage() {
    const params = useParams<{ code: string }>();
    const router = useRouter();
    const { importUtilities, validateShareCode, isImporting, error } = useUtilitySharing();
    const [sharedData, setSharedData] = useState<SharedUtilityData | null>(null);
    const [isValidCode, setIsValidCode] = useState(false);
    const [importSuccess, setImportSuccess] = useState(false);
    const [loading, setLoading] = useState(true);

    const shareCode = params.code;

    useEffect(() => {
        if (shareCode) {
            const isValid = validateShareCode(shareCode);
            setIsValidCode(isValid);

            if (isValid) {
                try {
                    // Parse the share code to get the data
                    const decodedData = atob(shareCode);
                    const parsedData = JSON.parse(decodedData);
                    setSharedData(parsedData);
                } catch (error: unknown) {
                    console.error('Failed to parse share code:', error);
                    setIsValidCode(false);
                }
            }
            setLoading(false);
        }
    }, [shareCode, validateShareCode]);

    const handleImport = async () => {
        if (!isValidCode || !shareCode) return;

        try {
            await importUtilities(shareCode);
            setImportSuccess(true);

            // Redirect to the map after a delay
            setTimeout(() => {
                router.push(`/${sharedData?.mapName}`);
            }, 2000);
        } catch (error: unknown) {
            console.error('Failed to import utilities:', error);
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            // You could add a toast notification here
        } catch (error: unknown) {
            console.error('Failed to copy link:', error);
        }
    };

    if (loading) {
        return (
            <div className="share-page">
                <div className="share-container">
                    <div className="loading-message">
                        <div className="loading-spinner"></div>
                        <p>Loading shared utilities...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!isValidCode) {
        return (
            <div className="share-page">
                <div className="share-container">
                    <div className="error-message">
                        <BsX size="4rem" className="error-icon" />
                        <h1>Invalid Share Link</h1>
                        <p>The share link you&apos;re trying to access is invalid or has expired.</p>
                        <Link href="/" className="back-button">
                            <BsArrowLeft size="1em" />
                            Go to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!sharedData) {
        return (
            <div className="share-page">
                <div className="share-container">
                    <div className="error-message">
                        <BsX size="4rem" className="error-icon" />
                        <h1>Share Data Not Found</h1>
                        <p>Unable to load the shared utility data.</p>
                        <Link href="/" className="back-button">
                            <BsArrowLeft size="1em" />
                            Go to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="share-page">
            <div className="share-container">
                <div className="share-header">
                    <Link href="/" className="back-link">
                        <BsArrowLeft size="1.2em" />
                        Back to Home
                    </Link>
                    <h1>Shared Utilities</h1>
                </div>

                <div className="share-content">
                    <div className="share-info">
                        <div className="map-info">
                            <h2>{sharedData.mapName.charAt(0).toUpperCase() + sharedData.mapName.slice(1)}</h2>
                            <span className="utility-count">
                                {sharedData.utilities.length} utility{sharedData.utilities.length !== 1 ? 'ies' : ''}
                            </span>
                        </div>

                        {sharedData.description && (
                            <div className="description">
                                <p>{sharedData.description}</p>
                            </div>
                        )}

                        <div className="share-meta">
                            <span>Shared by: {sharedData.sharedBy}</span>
                            <span>Shared on: {new Date(sharedData.sharedAt).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className="utilities-preview">
                        <h3>Utilities Preview</h3>
                        <div className="utilities-grid">
                            {sharedData.utilities.slice(0, 6).map((utility, index) => (
                                <div key={index} className="utility-preview-item">
                                    <div className="utility-icon">
                                        <img
                                            src={`/icons/${utility.utilityType}.svg`}
                                            alt={utility.utilityType}
                                            onError={(e) => {
                                                e.currentTarget.src = '/icons/flash.svg';
                                            }}
                                        />
                                    </div>
                                    <div className="utility-info">
                                        <span className="utility-title">{utility.title}</span>
                                        <span className="utility-team">{utility.team}</span>
                                        <span className="throwing-points">
                                            {utility.throwingPoints.length} throwing point{utility.throwingPoints.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {sharedData.utilities.length > 6 && (
                                <div className="more-utilities">
                                    +{sharedData.utilities.length - 6} more utilities
                                </div>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="error-message">
                            <BsX size="1em" />
                            {error}
                        </div>
                    )}

                    {importSuccess && (
                        <div className="success-message">
                            <BsCheck size="1em" />
                            Utilities imported successfully! Redirecting to map...
                        </div>
                    )}

                    <div className="share-actions">
                        <button
                            onClick={handleCopyLink}
                            className="copy-link-button"
                            title="Copy share link"
                        >
                            <BsShare size="1em" />
                            Copy Link
                        </button>
                        <button
                            onClick={handleImport}
                            className="import-button"
                            disabled={isImporting || importSuccess}
                        >
                            {isImporting ? (
                                <>
                                    <div className="loading-spinner-small"></div>
                                    Importing...
                                </>
                            ) : importSuccess ? (
                                <>
                                    <BsCheck size="1em" />
                                    Imported!
                                </>
                            ) : (
                                <>
                                    <BsDownload size="1em" />
                                    Import Utilities
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
} 