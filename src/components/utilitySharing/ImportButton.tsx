'use client'

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUtilitySharing } from '@/hooks/useUtilitySharing';
import { BsDownload, BsCheck, BsX } from 'react-icons/bs';
import './style.scss';

interface ImportButtonProps {
    onImportSuccess?: () => void;
    className?: string;
}

export const ImportButton = ({ onImportSuccess, className = '' }: ImportButtonProps) => {
    const { importUtilities, validateShareCode, isImporting, error } = useUtilitySharing();
    const [showModal, setShowModal] = useState(false);
    const [shareCode, setShareCode] = useState('');
    const [isValidCode, setIsValidCode] = useState(false);
    const [importedData, setImportedData] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    const handleShareCodeChange = (value: string) => {
        setShareCode(value);
        const isValid = validateShareCode(value);
        setIsValidCode(isValid);
    };

    const handleImport = async () => {
        if (!isValidCode) return;

        try {
            const data = await importUtilities(shareCode);
            setImportedData(data);
            setShareCode('');
            setIsValidCode(false);

            // Call success callback with a small delay to ensure server processing
            if (onImportSuccess) {
                setTimeout(() => {
                    console.log('Triggering utilities refresh after import');
                    onImportSuccess();
                }, 500);
            }

            // Close modal after a delay
            setTimeout(() => {
                setShowModal(false);
                setImportedData(null);
            }, 2000);
        } catch (err) {
            console.error('Failed to import utilities:', err);
            // Show user-friendly error message
            if (err instanceof Error && err.message.includes('not authenticated')) {
                alert('Please log in to import utilities. Your session may have expired.');
            } else {
                alert('Failed to import utilities. Please try again.');
            }
        }
    };

    const extractShareCodeFromUrl = (url: string) => {
        // Extract share code from URL like /share/ABC123
        const match = url.match(/\/share\/([A-Za-z0-9+/=]+)/);
        return match ? match[1] : '';
    };

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            const extractedCode = extractShareCodeFromUrl(text);
            if (extractedCode) {
                setShareCode(extractedCode);
                setIsValidCode(validateShareCode(extractedCode));
            } else {
                setShareCode(text);
                setIsValidCode(validateShareCode(text));
            }
        } catch (err) {
            console.error('Failed to read clipboard:', err);
        }
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className={`import-button ${className}`}
                disabled={isImporting}
                title="Import utilities"
            >
                <BsDownload size="1.2em" />
                {isImporting ? 'Importing...' : 'Import'}
            </button>

            {showModal && mounted && createPortal(
                <div className="import-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="import-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="import-modal-header">
                            <h3>Import Utilities</h3>
                            <button
                                className="close-button"
                                onClick={() => setShowModal(false)}
                            >
                                ×
                            </button>
                        </div>

                        <div className="import-modal-content">
                            {!importedData ? (
                                <>
                                    <p>Import utilities from a share code or URL</p>

                                    <div className="share-code-input">
                                        <label htmlFor="share-code">Share Code or URL:</label>
                                        <div className="input-group">
                                            <input
                                                id="share-code"
                                                type="text"
                                                value={shareCode}
                                                onChange={(e) => handleShareCodeChange(e.target.value)}
                                                placeholder="Paste share code or URL here..."
                                                className={isValidCode ? 'valid' : shareCode ? 'invalid' : ''}
                                            />
                                            <button
                                                onClick={handlePaste}
                                                className="paste-button"
                                                title="Paste from clipboard"
                                            >
                                                Paste
                                            </button>
                                        </div>
                                        {shareCode && (
                                            <div className={`validation-message ${isValidCode ? 'valid' : 'invalid'}`}>
                                                {isValidCode ? (
                                                    <>
                                                        <BsCheck size="1em" />
                                                        Valid share code
                                                    </>
                                                ) : (
                                                    <>
                                                        <BsX size="1em" />
                                                        Invalid share code
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {error && (
                                        <div className="error-message">
                                            {error}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="success-message">
                                    <BsCheck size="2em" />
                                    <h4>Import Successful!</h4>
                                    <p>Successfully imported utilities for {importedData.mapName}</p>
                                    <div className="import-stats">
                                        <span>Utilities imported: {importedData.utilities.length}</span>
                                        <span>Shared by: {importedData.sharedBy}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {!importedData && (
                            <div className="import-modal-actions">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="cancel-button"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleImport}
                                    className="import-confirm-button"
                                    disabled={isImporting || !isValidCode}
                                >
                                    {isImporting ? (
                                        <>
                                            <BsDownload size="1em" />
                                            Importing...
                                        </>
                                    ) : (
                                        <>
                                            <BsDownload size="1em" />
                                            Import Utilities
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}; 