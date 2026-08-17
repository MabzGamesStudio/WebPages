import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getScore, getDailyScore, getDailyTapScore } from '../utils/storage';
import { getDailySeed, getDailyTapSeed } from '../utils/dailySeed';

// ==========================================================
// ⚠️ REPLACE THESE WITH YOUR ACTUAL DETAILS
// ==========================================================
const LIGHTNING_ADDRESS = 'mabzlips@strike.me';
const DEVELOPER_EMAIL = 'mabzlips@gmail.com';
// ==========================================================

export const TOWNS = [
    'Alton',
    'Center Harbor',
    'Gilford',
    'Laconia',
    'Meredith',
    'Moultonborough',
    'Tuftonboro',
    'Wolfeboro',
    'All'
];

const MainMenu: React.FC = () => {
    const dailySeed = getDailySeed();
    const dailyScore = getDailyScore(dailySeed);
    const [copied, setCopied] = useState(false);
    const [emailCopied, setEmailCopied] = useState(false);
    const tapSeed = getDailyTapSeed();
    const tapScore = getDailyTapScore(tapSeed);

    const handleCopy = async () => {
        try {
            // Copies with the "lightning:" prefix which most wallets recognize
            await navigator.clipboard.writeText(`lightning:${LIGHTNING_ADDRESS}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
        } catch (err) {
            console.error('Failed to copy address:', err);
        }
    };

    const handleEmailCopy = async () => {
        try {
            await navigator.clipboard.writeText(DEVELOPER_EMAIL);
            setEmailCopied(true);
            setTimeout(() => setEmailCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy email:', err);
        }
    };

    return (
        <div className="main-menu">
            <h1>Lake Winnipesaukee Island Quiz</h1>

            <div className="daily-section">
                <Link to="/daily" className="town-card daily-card">
                    <h2>🌅 Daily Challenge</h2>
                    {dailyScore ? (
                        <p>{dailyScore.won ? `✅ Solved in ${dailyScore.guesses}` : '❌ Missed today'}</p>
                    ) : (
                        <p>Guess today's island</p>
                    )}
                </Link>
            </div>

            <div className="daily-section">
                <Link to="/daily-tap" className="town-card daily-card tap-card">
                    <h2>🗺️ Daily Island Tap</h2>
                    {tapScore ? (
                        <p>✅ Completed: {tapScore.totalPoints} pts</p>
                    ) : (
                        <p>3 rounds to find the islands!</p>
                    )}
                </Link>
            </div>

            <div className="town-grid">
                {TOWNS.map(town => {
                    const score = getScore(town);
                    return (
                        <Link to={`/quiz/${town}`} key={town} className="town-card">
                            <h2>{town}</h2>
                            {score ? (
                                <p>
                                    Best: {score.bestPercent}% | Time: {score.bestTime}s
                                </p>
                            ) : (
                                <p>No record yet</p>
                            )}
                        </Link>
                    );
                })}
            </div>

            {/* --- NEW SECTIONS --- */}
            <div className="info-grid">
                {/* Support Card */}
                <div className="info-card">
                    <h2>⚡ Support the Developer using Bitcoin Lightning</h2>
                    <div className="lightning-container">
                        {/* Free QR Code API - dynamically generates based on your address */}
                        <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=lightning:${encodeURIComponent(LIGHTNING_ADDRESS)}`}
                            alt="Lightning Network QR Code"
                            className="qr-code"
                        />
                        <div className="address-box">
                            <code>{LIGHTNING_ADDRESS}</code>
                            <button
                                className={`copy-btn ${copied ? 'copied' : ''}`}
                                onClick={handleCopy}
                                aria-label="Copy Lightning Address"
                            >
                                {copied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Contact Card */}
                <div className="info-card">
                    <h2>📧 Contact the Developer</h2>
                    <div className="contact-container">
                        <p>
                            Found an incorrect island name or found an island missing a name?
                            Reach out and let me know :)
                        </p>
                        <div className="email-row">
                            <span className="email-address">{DEVELOPER_EMAIL}</span>
                            <button
                                className={`contact-btn copy-btn ${emailCopied ? 'copied' : ''}`}
                                onClick={handleEmailCopy}
                                aria-label="Copy email"
                            >
                                {emailCopied ? 'Copied!' : 'Copy'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MainMenu;