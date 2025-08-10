"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import './style.scss';

interface ThrowingPoint {
    id: string;
    title: string;
    description: string;
    utilityType: string;
    team: string;
    mapName: string;
    media?: MediaItem[];
}

interface MediaItem {
    id: string;
    url: string;
    type: 'image' | 'video';
    description?: string;
}

interface ApiThrowingPoint {
    id: string;
    title: string;
    description: string;
}

interface ApiUtility {
    utilityType: string;
    team: string;
    throwingPoints: ApiThrowingPoint[];
}

interface ApiResponse {
    success: boolean;
    data?: ApiUtility[];
}

interface MediaApiResponse {
    success: boolean;
    media?: MediaItem[];
}

const LearnPage = () => {
    const [selectedMap, setSelectedMap] = useState<string>('');
    const [currentThrowingPoint, setCurrentThrowingPoint] = useState<ThrowingPoint | null>(null);
    const [showAnswer, setShowAnswer] = useState(false);
    const [score, setScore] = useState({ correct: 0, total: 0 });
    const [quizStarted, setQuizStarted] = useState(false);
    const [throwingPoints, setThrowingPoints] = useState<ThrowingPoint[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentMedia, setCurrentMedia] = useState<MediaItem[]>([]);
    const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
    const [mediaLoading, setMediaLoading] = useState(false);
    const [answeredThrowingPoints, setAnsweredThrowingPoints] = useState<Set<string>>(new Set());
    const [quizCompleted, setQuizCompleted] = useState(false);

    const maps = [
        { name: 'dust2', displayName: 'Dust 2' },
        { name: 'mirage', displayName: 'Mirage' },
        { name: 'inferno', displayName: 'Inferno' },
        { name: 'cache', displayName: 'Cache' },
        { name: 'overpass', displayName: 'Overpass' },
        { name: 'nuke', displayName: 'Nuke' },
        { name: 'train', displayName: 'Train' },
        { name: 'ancient', displayName: 'Ancient' },
        { name: 'anubis', displayName: 'Anubis' },
        { name: 'vertigo', displayName: 'Vertigo' }
    ];

    // Fetch throwing points for selected map
    useEffect(() => {
        if (selectedMap) {
            fetchThrowingPoints(selectedMap);
        }
    }, [selectedMap]);

    // Fetch media when current throwing point changes and answer is shown
    useEffect(() => {
        if (currentThrowingPoint && showAnswer) {
            fetchThrowingPointMedia(currentThrowingPoint.id);
        }
    }, [currentThrowingPoint, showAnswer]);

    const fetchThrowingPoints = async (mapName: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/utilities?mapName=${mapName}`);
            if (response.ok) {
                const data: ApiResponse = await response.json();
                if (data.success && data.data) {
                    // Transform the API data to match our ThrowingPoint interface
                    const transformedPoints: ThrowingPoint[] = [];
                    data.data.forEach((utility: ApiUtility) => {
                        utility.throwingPoints.forEach((tp: ApiThrowingPoint) => {
                            transformedPoints.push({
                                id: tp.id,
                                title: tp.title,
                                description: tp.description,
                                utilityType: utility.utilityType,
                                team: utility.team,
                                mapName: mapName
                            });
                        });
                    });
                    setThrowingPoints(transformedPoints);
                } else {
                    setThrowingPoints([]);
                }
            } else {
                setThrowingPoints([]);
            }
        } catch (error) {
            setThrowingPoints([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchThrowingPointMedia = async (throwingPointId: string) => {
        setMediaLoading(true);
        try {
            const response = await fetch(`/api/media/learn?throwingPointId=${throwingPointId}`);
            if (response.ok) {
                const data: MediaApiResponse = await response.json();
                if (data.success && data.media) {
                    setCurrentMedia(data.media);
                    setCurrentMediaIndex(0);
                } else {
                    setCurrentMedia([]);
                    setCurrentMediaIndex(0);
                }
            } else {
                setCurrentMedia([]);
                setCurrentMediaIndex(0);
            }
        } catch (error) {
            setCurrentMedia([]);
            setCurrentMediaIndex(0);
        } finally {
            setMediaLoading(false);
        }
    };

    const startQuiz = () => {
        if (selectedMap && throwingPoints.length > 0) {
            setQuizStarted(true);
            setQuizCompleted(false);
            setScore({ correct: 0, total: 0 });
            setAnsweredThrowingPoints(new Set());
            setShowAnswer(false);
            getRandomThrowingPoint();
        }
    };

    const getRandomThrowingPoint = () => {
        // Get throwing points that haven't been answered "Yes" yet
        const unansweredPoints = throwingPoints.filter(tp => !answeredThrowingPoints.has(tp.id));

        if (unansweredPoints.length > 0) {
            const randomIndex = Math.floor(Math.random() * unansweredPoints.length);
            setCurrentThrowingPoint(unansweredPoints[randomIndex]);
            setShowAnswer(false);
        } else {
            // All throwing points have been answered "Yes"
            setQuizCompleted(true);
            setCurrentThrowingPoint(null);
        }
    };

    const handleAnswer = async (remembered: boolean) => {
        if (currentThrowingPoint) {
            if (remembered) {
                // Add to answered set when user says "Yes"
                setAnsweredThrowingPoints(prev => new Set([...prev, currentThrowingPoint.id]));
                setScore(prev => ({
                    correct: prev.correct + 1,
                    total: throwingPoints.length
                }));
            } else {
                // Don't add to answered set when user says "No"
                setScore(prev => ({
                    correct: prev.correct,
                    total: throwingPoints.length
                }));
            }
        }

        setShowAnswer(true);
    };

    const nextQuestion = () => {
        getRandomThrowingPoint();
    };

    const resetQuiz = () => {
        setQuizStarted(false);
        setQuizCompleted(false);
        setCurrentThrowingPoint(null);
        setShowAnswer(false);
        setScore({ correct: 0, total: 0 });
        setAnsweredThrowingPoints(new Set());
        setCurrentMedia([]);
        setCurrentMediaIndex(0);
    };

    const getUtilityIcon = (utilityType: string) => {
        switch (utilityType) {
            case 'smoke': return '/icons/smoke.svg';
            case 'flash': return '/icons/flash.svg';
            case 'molotov': return '/icons/molotov.svg';
            case 'he': return '/icons/HE.svg';
            default: return '/icons/frag_grenade.svg';
        }
    };

    const getTeamColor = (team: string) => {
        return team === 'T' ? '#ff6b35' : '#4CAF50';
    };

    return (
        <div className="learn-page">
            <div className="quiz-container">
                <h1>CS2 Utility Quiz</h1>
                <p>Test your knowledge of utility lineups!</p>

                {!quizStarted ? (
                    <div className="map-selection">
                        <h2>Select a Map</h2>
                        <div className="map-grid">
                            {maps.map((map) => (
                                <button
                                    key={map.name}
                                    className={`map-button ${selectedMap === map.name ? 'selected' : ''}`}
                                    onClick={() => setSelectedMap(map.name)}
                                >
                                    {map.displayName}
                                </button>
                            ))}
                        </div>
                        {selectedMap && (
                            <button
                                className="start-quiz-button"
                                onClick={startQuiz}
                                disabled={isLoading || throwingPoints.length === 0}
                            >
                                {isLoading ? 'Loading...' : `Start Quiz (${throwingPoints.length} throwing points)`}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className='quiz-wrapper'>
                        <div className="quiz-header">
                            <div className="score-display">
                                Score: {score.correct}/{score.total}
                            </div>
                            <button className="reset-button" onClick={resetQuiz}>
                                Reset Quiz
                            </button>
                        </div>

                        {quizCompleted ? (
                            <div className="quiz-completion">
                                <div className="completion-header">
                                    <span className="completion-icon">🎉</span>
                                    <h2>Quiz Completed!</h2>
                                </div>
                                <div className="final-score">
                                    <h3>Final Score</h3>
                                    <div className="score-display">
                                        {score.correct} / {score.total} throwing points
                                    </div>
                                    <div className="score-percentage">
                                        {Math.round((score.correct / score.total) * 100)}% Mastery
                                    </div>
                                </div>
                                <div className="completion-message">
                                    <p>Congratulations! You've reviewed all the throwing points for {selectedMap}.</p>
                                    <p>Keep practicing to maintain your knowledge!</p>
                                </div>
                                <button className="reset-button" onClick={resetQuiz}>
                                    Start New Quiz
                                </button>
                            </div>
                        ) : currentThrowingPoint ? (
                            <div className={`quiz-content ${showAnswer ? 'with-media' : ''}`}>
                                <div className="question-card">
                                    <div className="question-header">
                                        <span className="utility-icon">
                                            <Image
                                                src={getUtilityIcon(currentThrowingPoint.utilityType)}
                                                alt={`${currentThrowingPoint.utilityType} icon`}
                                                width={32}
                                                height={32}
                                                className="utility-icon-image" />
                                        </span>
                                        <span
                                            className="team-badge"
                                            style={{ backgroundColor: getTeamColor(currentThrowingPoint.team) }}
                                        >
                                            {currentThrowingPoint.team}
                                        </span>
                                    </div>

                                    <h3>{currentThrowingPoint.title}</h3>
                                    <p className="question-text">
                                        Do you remember how this {currentThrowingPoint.utilityType} lineup works?
                                    </p>

                                    {!showAnswer ? (
                                        <div className="answer-buttons">
                                            <button
                                                className="answer-button yes"
                                                onClick={() => handleAnswer(true)}
                                            >
                                                Yes, I remember
                                            </button>
                                            <button
                                                className="answer-button no"
                                                onClick={() => handleAnswer(false)}
                                            >
                                                No, I need to review
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="answer-feedback">
                                            <div className="feedback-message">
                                                {currentThrowingPoint && answeredThrowingPoints.has(currentThrowingPoint.id) ?
                                                    "Great job! You remembered this one!" :
                                                    "That's okay! Review helps reinforce learning."}
                                            </div>
                                            <div className="throwing-point-details">
                                                <h4>Throwing Point Details:</h4>
                                                <p><strong>Type:</strong> {currentThrowingPoint.utilityType}</p>
                                                <p><strong>Team:</strong> {currentThrowingPoint.team}</p>
                                                <p><strong>Description:</strong> {currentThrowingPoint.description}</p>
                                            </div>

                                            <button className="next-button" onClick={nextQuestion}>
                                                Next Question
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {showAnswer && (
                                    <div className="media-review">
                                        <h4>Review Media</h4>
                                        {mediaLoading ? (
                                            <div className="media-loading">
                                                <div className="loading-spinner"></div>
                                                <p>Loading media...</p>
                                            </div>
                                        ) : currentMedia.length > 0 ? (
                                            <div className="media-carousel">
                                                {currentMedia.length > 1 && (
                                                    <button
                                                        className="carousel-button prev"
                                                        onClick={() => setCurrentMediaIndex(prev => prev > 0 ? prev - 1 : currentMedia.length - 1)}
                                                        disabled={currentMedia.length === 0}
                                                    >
                                                        ‹
                                                    </button>
                                                )}
                                                <div className="carousel-content">
                                                    <div className="media-item">
                                                        {currentMedia[currentMediaIndex].type === 'image' ? (
                                                            <Image
                                                                src={currentMedia[currentMediaIndex].url}
                                                                alt={currentMedia[currentMediaIndex].description || 'Throwing point media'}
                                                                width={0}
                                                                height={0}
                                                                unoptimized
                                                                className="media-image"
                                                                style={{ objectFit: 'cover' }}
                                                            />
                                                        ) : (
                                                            <video
                                                                src={currentMedia[currentMediaIndex].url}
                                                                controls
                                                                className="media-video"
                                                            >
                                                                Your browser does not support the video tag.
                                                            </video>
                                                        )}
                                                        {currentMedia[currentMediaIndex].description && (
                                                            <p className="media-description">{currentMedia[currentMediaIndex].description}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                {currentMedia.length > 1 && (
                                                    <button
                                                        className="carousel-button next"
                                                        onClick={() => setCurrentMediaIndex(prev => prev < currentMedia.length - 1 ? prev + 1 : 0)}
                                                        disabled={currentMedia.length === 0}
                                                    >
                                                        ›
                                                    </button>
                                                )}
                                                {currentMedia.length > 1 && (
                                                    <div className="carousel-indicators">
                                                        {currentMedia.map((_, index) => (
                                                            <button
                                                                key={index}
                                                                className={`indicator ${index === currentMediaIndex ? 'active' : ''}`}
                                                                onClick={() => setCurrentMediaIndex(index)}
                                                                disabled={currentMedia.length === 0}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="no-media">
                                                <p>No media available for this throwing point</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LearnPage;
