'use client';

import React from 'react';
import { BsQuestionCircle } from 'react-icons/bs';
import './style.scss';

interface TutorialButtonProps {
    onClick: () => void;
    className?: string;
    title?: string;
}

const TutorialButton: React.FC<TutorialButtonProps> = ({
    onClick,
    className = '',
    title = 'Show Tutorial'
}) => {
    return (
        <button
            className={`tutorial-trigger-btn ${className}`}
            onClick={onClick}
            title={title}
        >
            <BsQuestionCircle />
            <span>Help</span>
        </button>
    );
};

export default TutorialButton; 