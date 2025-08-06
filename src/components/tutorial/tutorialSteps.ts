import { TutorialStep } from './useTutorial';

export const getUtilityTutorialSteps = (): TutorialStep[] => [
    {
        id: 'welcome',
        title: 'Welcome to CS2 Util Library!',
        content: 'Let\'s learn how to add your first utility. This tutorial will guide you through the process step by step.',
        position: 'center'
    },
    {
        id: 'open-dropdown',
        title: 'Open the Nade Dropdown',
        content: 'Click on the dropdown menu to open it. This will show you options for selecting your team and utility type.',
        target: '.add-nade-dropdown',
        position: 'right',
        autoAdvance: {
            event: 'dropdown-open'
        }
    },
    {
        id: 'select-utility',
        title: 'Select Team and Utility',
        content: 'Now that the dropdown is open, first choose your team (T or CT), then select the type of utility: Smoke, Flash, Molotov, or HE Grenade.',
        target: '.utility-dropdown-menu',
        position: 'bottom',
        autoAdvance: {
            event: 'utility-selected'
        }
    },
    {
        id: 'place-utility',
        title: 'Place Your Utility',
        content: 'Now click anywhere on the map where you want to place your utility. This will be the landing point where your grenade will explode.',
        target: '.map-image-container',
        position: 'left',
        autoAdvance: {
            event: 'utility-added',
            condition: () => {
                // Check if we have at least one utility button and no utility is selected
                const utilityCount = document.querySelectorAll('.utility-lp-button').length;
                const noUtilitySelected = !document.querySelector('.add-nade-dropdown .main-add-button img');
                return utilityCount > 0 && noUtilitySelected;
            }
        }
    },
    {
        id: 'landing-point',
        title: 'Landing Point Created!',
        content: 'Great! You\'ve created a landing point. This shows where your utility will land. You can now add throwing points to show where to throw from.',
        target: '.utility-lp-button',
        position: 'top'
    },
    {
        id: 'add-throwing-point',
        title: 'Add Throwing Points',
        content: 'Click on a landing point to select it, then click "Add Throwing Point" to show where to throw from. You can add multiple throwing points for different positions.',
        target: '.add-throwing-point-button',
        position: 'right',
        autoAdvance: {
            event: 'click',
            selector: '.add-throwing-point-button'
        }
    },
    {
        id: 'place-throwing-point',
        title: 'Place Throwing Point',
        content: 'Click on the map where you want to place the throwing point. This shows the position where you should stand to throw the utility.',
        target: '.map-image-container',
        position: 'left',
        autoAdvance: {
            event: 'throwing-point-added',
            condition: () => {
                // Check if we have at least one throwing point button
                const tpCount = document.querySelectorAll('.utility-tp-button').length;
                return tpCount > 0;
            }
        }
    },
    {
        id: 'open-throwing-point',
        title: 'Open Throwing Point',
        content: 'Open the throwing point to add media.',
        target: '.minimize-button',
        autoAdvance: {
            event: 'click',
            selector: '.minimize-button'
        },
        position: 'bottom'
    },
    {
        id: 'media-upload',
        title: 'Add Media (Optional)',
        content: 'You can upload screenshots or videos to show the lineups. Click on a throwing point and use the media upload feature to add visual guides.',
        target: '.media-carousel',
        position: 'top'
    },
    {
        id: 'filters',
        title: 'Use Filters',
        content: 'Use the filters in the sidebar to show only specific types of utilities or team utilities. This helps you find what you need quickly.',
        target: '.utility-filters-container',
        position: 'right'
    },
    {
        id: 'sharing',
        title: 'Share Your Utilities',
        content: 'Use the Share button to create a link that others can use to import your utilities. The Import button lets you add utilities shared by others.',
        target: '.sharing-controls',
        position: 'right'
    },
    {
        id: 'complete',
        title: 'You\'re All Set!',
        content: 'Congratulations! You now know how to add utilities to the CS2 Util Library. Start creating your own lineups and share them with your team!',
        position: 'center'
    }
]; 