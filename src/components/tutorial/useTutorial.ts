import { useState, useEffect, useCallback } from 'react';

export interface TutorialStep {
    id: string;
    title: string;
    content: string;
    target?: string; // CSS selector for highlighting
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    action?: () => void; // Optional action to perform when step is shown
    autoAdvance?: {
        event: 'click' | 'change' | 'dropdown-open' | 'utility-added' | 'throwing-point-added' | 'utility-selected';
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
        let hasAdvanced = false;

        const handleAutoAdvance = () => {
            // Prevent multiple advances
            if (hasAdvanced) return;
            hasAdvanced = true;

            // Check if condition is met (if provided)
            if (condition) {
                // Add a small delay to allow DOM updates before checking condition
                setTimeout(() => {
                    if (!condition()) {
                        hasAdvanced = false;
                        return;
                    }
                    // Small delay to ensure the action is completed
                    setTimeout(() => {
                        nextStep();
                    }, 200);
                }, 100);
                return;
            }
            // Small delay to ensure the action is completed
            setTimeout(() => {
                nextStep();
            }, 300);
        };

        // Wait for elements to be available
        const waitForElement = (selector: string, timeout = 5000): Promise<Element | null> => {
            return new Promise((resolve) => {
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                    return;
                }

                const observer = new MutationObserver(() => {
                    const element = document.querySelector(selector);
                    if (element) {
                        observer.disconnect();
                        resolve(element);
                    }
                });

                observer.observe(document.body, {
                    childList: true,
                    subtree: true
                });

                // Timeout fallback
                setTimeout(() => {
                    observer.disconnect();
                    resolve(null);
                }, timeout);
            });
        };

        switch (event) {
            case 'click':
                if (selector) {
                    waitForElement(selector).then((element) => {
                        if (element && !hasAdvanced) {
                            element.addEventListener('click', handleAutoAdvance, { once: true });
                            cleanup = () => element.removeEventListener('click', handleAutoAdvance);
                        }
                    });
                }
                break;
            case 'change':
                if (selector) {
                    waitForElement(selector).then((element) => {
                        if (element && !hasAdvanced) {
                            element.addEventListener('change', handleAutoAdvance, { once: true });
                            cleanup = () => element.removeEventListener('change', handleAutoAdvance);
                        }
                    });
                }
                break;
            case 'dropdown-open':
                // Listen for dropdown state changes with better detection
                let dropdownDetected = false;
                let attempts = 0;
                const maxAttempts = 100; // 10 seconds max

                const checkDropdown = () => {
                    attempts++;
                    const dropdown = document.querySelector('.utility-dropdown-menu.show');
                    if (dropdown && !dropdownDetected) {
                        dropdownDetected = true;
                        handleAutoAdvance();
                    } else if (attempts >= maxAttempts) {
                        clearInterval(interval);
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
                // Listen for new utility elements being added with better detection
                let utilityDetected = false;
                let utilityAttempts = 0;
                const maxUtilityAttempts = 150; // 15 seconds max

                const checkUtilityAdded = () => {
                    utilityAttempts++;
                    const currentUtilityCount = document.querySelectorAll('.utility-lp-button').length;

                    // Check if we have at least one utility button
                    if (currentUtilityCount > 0 && !utilityDetected) {
                        utilityDetected = true;
                        handleAutoAdvance();
                    } else if (utilityAttempts >= maxUtilityAttempts) {
                        clearInterval(utilityInterval);
                    }
                };

                const utilityInterval = setInterval(checkUtilityAdded, 100);
                cleanup = () => {
                    clearInterval(utilityInterval);
                    utilityDetected = false;
                };
                break;
            case 'throwing-point-added':
                // Listen for new throwing point elements being added with better detection
                let tpDetected = false;
                let tpAttempts = 0;
                const maxTPAttempts = 150; // 15 seconds max

                const checkThrowingPointAdded = () => {
                    tpAttempts++;
                    const currentTPCount = document.querySelectorAll('.utility-tp-button').length;

                    // Check if we have at least one throwing point button
                    if (currentTPCount > 0 && !tpDetected) {
                        tpDetected = true;
                        handleAutoAdvance();
                    } else if (tpAttempts >= maxTPAttempts) {
                        clearInterval(tpInterval);
                    }
                };

                const tpInterval = setInterval(checkThrowingPointAdded, 100);
                cleanup = () => {
                    clearInterval(tpInterval);
                    tpDetected = false;
                };
                break;
            case 'utility-selected':
                // Listen for utility selection by checking if dropdown closes after being open
                let utilitySelectedDetected = false;
                let utilitySelectedAttempts = 0;
                const maxUtilitySelectedAttempts = 100; // 10 seconds max
                
                const checkUtilitySelected = () => {
                    utilitySelectedAttempts++;
                    const dropdown = document.querySelector('.utility-dropdown-menu.show');
                    
                    // If dropdown was open but is now closed, a utility was selected
                    if (!dropdown && !utilitySelectedDetected) {
                        utilitySelectedDetected = true;
                        handleAutoAdvance();
                    } else if (utilitySelectedAttempts >= maxUtilitySelectedAttempts) {
                        clearInterval(utilitySelectedInterval);
                    }
                };
                
                const utilitySelectedInterval = setInterval(checkUtilitySelected, 100);
                cleanup = () => {
                    clearInterval(utilitySelectedInterval);
                    utilitySelectedDetected = false;
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