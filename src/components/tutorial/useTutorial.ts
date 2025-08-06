import { useState, useEffect, useCallback } from 'react';

export interface TutorialStep {
    id: string;
    title: string;
    content: string;
    target?: string; // CSS selector for highlighting
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    action?: () => void; // Optional action to perform when step is shown
    autoAdvance?: {
        event: 'click' | 'change' | 'dropdown-open' | 'utility-added' | 'throwing-point-added';
        selector?: string; // CSS selector to watch for the event
        condition?: () => boolean; // Custom condition function
    };
}

export interface TutorialState {
    isActive: boolean;
    currentStep: number;
    steps: TutorialStep[];
    hasSeenTutorial: boolean;
}

export const useTutorial = () => {
    const [state, setState] = useState<TutorialState>({
        isActive: false,
        currentStep: 0,
        steps: [],
        hasSeenTutorial: false
    });

    // Check if user has seen tutorial on mount
    useEffect(() => {
        const hasSeen = localStorage.getItem('cs2-tutorial-completed') === 'true';
        setState(prev => ({ ...prev, hasSeenTutorial: hasSeen }));
    }, []);

    const startTutorial = useCallback((steps: TutorialStep[]) => {
        setState(prev => ({
            ...prev,
            isActive: true,
            currentStep: 0,
            steps
        }));
    }, []);

    const nextStep = useCallback(() => {
        setState(prev => {
            const nextStepIndex = prev.currentStep + 1;
            if (nextStepIndex >= prev.steps.length) {
                // Tutorial completed
                localStorage.setItem('cs2-tutorial-completed', 'true');
                return {
                    ...prev,
                    isActive: false,
                    hasSeenTutorial: true
                };
            }
            return {
                ...prev,
                currentStep: nextStepIndex
            };
        });
    }, []);

    const previousStep = useCallback(() => {
        setState(prev => ({
            ...prev,
            currentStep: Math.max(0, prev.currentStep - 1)
        }));
    }, []);

    const skipTutorial = useCallback(() => {
        localStorage.setItem('cs2-tutorial-completed', 'true');
        setState(prev => ({
            ...prev,
            isActive: false,
            hasSeenTutorial: true
        }));
    }, []);

    const resetTutorial = useCallback(() => {
        localStorage.removeItem('cs2-tutorial-completed');
        setState(prev => ({
            ...prev,
            hasSeenTutorial: false
        }));
    }, []);

    const getCurrentStep = useCallback(() => {
        return state.steps[state.currentStep];
    }, [state.steps, state.currentStep]);

    // Auto-advance functionality
    const setupAutoAdvance = useCallback(() => {
        if (!state.isActive || !state.steps[state.currentStep]) return;

        const currentStep = state.steps[state.currentStep];
        if (!currentStep.autoAdvance) return;

        const { event, selector, condition } = currentStep.autoAdvance;
        let cleanup: (() => void) | undefined;

        const handleAutoAdvance = () => {
            // Check if condition is met (if provided)
            if (condition && !condition()) return;

            // Small delay to ensure the action is completed
            setTimeout(() => {
                nextStep();
            }, 500);
        };

        switch (event) {
            case 'click':
                if (selector) {
                    const element = document.querySelector(selector);
                    if (element) {
                        element.addEventListener('click', handleAutoAdvance, { once: true });
                        cleanup = () => element.removeEventListener('click', handleAutoAdvance);
                    }
                }
                break;
            case 'change':
                if (selector) {
                    const element = document.querySelector(selector);
                    if (element) {
                        element.addEventListener('change', handleAutoAdvance, { once: true });
                        cleanup = () => element.removeEventListener('change', handleAutoAdvance);
                    }
                }
                break;
            case 'dropdown-open':
                // Listen for dropdown state changes
                let dropdownDetected = false;
                const checkDropdown = () => {
                    const dropdown = document.querySelector('.utility-dropdown-menu.show');
                    if (dropdown && !dropdownDetected) {
                        dropdownDetected = true;
                        handleAutoAdvance();
                    }
                };
                // Check periodically for dropdown opening
                const interval = setInterval(checkDropdown, 100);
                cleanup = () => {
                    clearInterval(interval);
                    dropdownDetected = false;
                };
                break;
            case 'utility-added':
                // Listen for new utility elements being added
                const initialUtilityCount = document.querySelectorAll('.utility-lp-button').length;
                let utilityDetected = false;
                const checkUtilityAdded = () => {
                    const currentUtilityCount = document.querySelectorAll('.utility-lp-button').length;
                    if (currentUtilityCount > initialUtilityCount && !utilityDetected) {
                        utilityDetected = true;
                        handleAutoAdvance();
                    }
                };
                const utilityInterval = setInterval(checkUtilityAdded, 100);
                cleanup = () => {
                    clearInterval(utilityInterval);
                    utilityDetected = false;
                };
                break;
            case 'throwing-point-added':
                // Listen for new throwing point elements being added
                const initialTPCount = document.querySelectorAll('.utility-tp-button').length;
                let tpDetected = false;
                const checkThrowingPointAdded = () => {
                    const currentTPCount = document.querySelectorAll('.utility-tp-button').length;
                    if (currentTPCount > initialTPCount && !tpDetected) {
                        tpDetected = true;
                        handleAutoAdvance();
                    }
                };
                const tpInterval = setInterval(checkThrowingPointAdded, 100);
                cleanup = () => {
                    clearInterval(tpInterval);
                    tpDetected = false;
                };
                break;
        }

        return cleanup;
    }, [state.isActive, state.currentStep, state.steps, nextStep]);

    // Setup auto-advance when step changes
    useEffect(() => {
        if (state.isActive) {
            const cleanup = setupAutoAdvance();
            return cleanup;
        }
    }, [state.isActive, state.currentStep, setupAutoAdvance]);

    return {
        ...state,
        startTutorial,
        nextStep,
        previousStep,
        skipTutorial,
        resetTutorial,
        getCurrentStep
    };
}; 