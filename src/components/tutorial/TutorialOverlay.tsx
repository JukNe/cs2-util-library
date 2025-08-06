'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BsX, BsChevronLeft, BsChevronRight, BsQuestionCircle } from 'react-icons/bs';
import { TutorialStep } from './useTutorial';
import './style.scss';

interface TutorialOverlayProps {
    isActive: boolean;
    currentStep: TutorialStep | undefined;
    currentStepIndex: number;
    totalSteps: number;
    onNext: () => void;
    onPrevious: () => void;
    onSkip: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
    isActive,
    currentStep,
    currentStepIndex,
    totalSteps,
    onNext,
    onPrevious,
    onSkip
}) => {
    const overlayRef = useRef<HTMLDivElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isActive || !currentStep?.target) return;

        // Find the target element
        const targetElement = document.querySelector(currentStep.target);
        if (!targetElement) return;

        // Position the highlight overlay
        const targetRect = targetElement.getBoundingClientRect();
        const highlight = highlightRef.current;
        if (highlight) {
            highlight.style.position = 'fixed';
            highlight.style.top = `${targetRect.top - 4}px`;
            highlight.style.left = `${targetRect.left - 4}px`;
            highlight.style.width = `${targetRect.width + 8}px`;
            highlight.style.height = `${targetRect.height + 8}px`;
            highlight.style.zIndex = '999998';
        }

        // Scroll target into view if needed
        targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
        });
    }, [isActive, currentStep]);

    if (!isActive || !currentStep || !isClient) return null;

    const getTooltipPosition = () => {
        if (!currentStep.target) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };

        const targetElement = document.querySelector(currentStep.target);
        if (!targetElement) {
            console.warn(`Tutorial target not found: ${currentStep.target}`);
            return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
        }

        const targetRect = targetElement.getBoundingClientRect();
        const position = currentStep.position || 'bottom';
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const tooltipWidth = 400; // Approximate tooltip width
        const tooltipHeight = 200; // Approximate tooltip height

        switch (position) {
            case 'top':
                const topY = targetRect.top - 20;
                const topX = targetRect.left + targetRect.width / 2;
                return {
                    top: `${Math.max(20, topY)}px`,
                    left: `${Math.max(tooltipWidth / 2, Math.min(viewportWidth - tooltipWidth / 2, topX))}px`,
                    transform: 'translate(-50%, -100%)'
                };
            case 'bottom':
                const bottomY = targetRect.bottom + 20;
                const bottomX = targetRect.left + targetRect.width / 2;
                return {
                    top: `${Math.min(viewportHeight - tooltipHeight - 20, bottomY)}px`,
                    left: `${Math.max(tooltipWidth / 2, Math.min(viewportWidth - tooltipWidth / 2, bottomX))}px`,
                    transform: 'translate(-50%, 0)'
                };
            case 'left':
                const leftY = targetRect.top + targetRect.height / 2;
                const leftX = targetRect.left - 20;
                return {
                    top: `${Math.max(20, Math.min(viewportHeight - tooltipHeight - 20, leftY))}px`,
                    left: `${Math.max(20, leftX)}px`,
                    transform: 'translate(-100%, -50%)'
                };
            case 'right':
                const rightY = targetRect.top + targetRect.height / 2;
                const rightX = targetRect.right + 20;
                return {
                    top: `${Math.max(20, Math.min(viewportHeight - tooltipHeight - 20, rightY))}px`,
                    left: `${Math.min(viewportWidth - tooltipWidth - 20, rightX)}px`,
                    transform: 'translate(0, -50%)'
                };
            default:
                return {
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)'
                };
        }
    };

    return createPortal(
        <>
            {/* Dark overlay */}
            <div
                ref={overlayRef}
                className="tutorial-overlay"
                style={{ zIndex: 999997 }}
            />

            {/* Highlight for target element */}
            {currentStep.target && (
                <div
                    ref={highlightRef}
                    className="tutorial-highlight"
                />
            )}

            {/* Tooltip */}
            <div
                className="tutorial-tooltip"
                style={getTooltipPosition()}
            >
                <div className="tutorial-header">
                    <div className="tutorial-icon">
                        <BsQuestionCircle />
                    </div>
                    <div className="tutorial-title">
                        {currentStep.title}
                    </div>
                    <button
                        className="tutorial-close"
                        onClick={onSkip}
                        title="Skip tutorial"
                    >
                        <BsX />
                    </button>
                </div>

                <div className="tutorial-content">
                    {currentStep.content}
                </div>

                <div className="tutorial-footer">
                    <div className="tutorial-progress">
                        Step {currentStepIndex + 1} of {totalSteps}
                    </div>

                    <div className="tutorial-navigation">
                        <button
                            className="tutorial-nav-btn"
                            onClick={onPrevious}
                            disabled={currentStepIndex === 0}
                        >
                            <BsChevronLeft />
                            Previous
                        </button>

                        <button
                            className="tutorial-nav-btn primary"
                            onClick={onNext}
                        >
                            {currentStepIndex === totalSteps - 1 ? 'Finish' : 'Next'}
                            <BsChevronRight />
                        </button>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
};

export default TutorialOverlay; 