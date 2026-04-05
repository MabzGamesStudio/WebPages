// LoginPage.tsx
import { useState, useEffect } from 'react';
import { signIn, signUp } from '../firebase/auth';
import { STORAGE_KEY } from '../firebase/config';
import { decodeConfigFromBase64, saveConfigToLocalStorage } from '../utils/authenticationEncoder';
import styles from './LoginPage.module.scss';
import { useNavigate, useSearchParams } from 'react-router-dom';

const BLANK_CONFIG = {
    apiKey: '', authDomain: '', projectId: '',
    storageBucket: '', messagingSenderId: '', appId: '',
    databaseURL: '', finnhubApiKey: '',
};

function getStoredConfig() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch {
        localStorage.removeItem(STORAGE_KEY);
        return null;
    }
}

export default function LoginPage() {
    const [searchParams] = useSearchParams();
    const stored = getStoredConfig();
    const navigate = useNavigate();
    const [config, setConfig] = useState(stored ?? BLANK_CONFIG);
    const [showConfig, setShowConfig] = useState(!stored);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Auto-load config from URL parameter
    useEffect(() => {
        const encodedConfig = searchParams.get('authentication');

        if (encodedConfig && !stored) {
            console.log('Found authentication param in URL, decoding...');
            const decodedConfig = decodeConfigFromBase64(encodedConfig);

            if (decodedConfig) {
                console.log('Config decoded successfully, saving to localStorage');
                saveConfigToLocalStorage(decodedConfig);
                setConfig(decodedConfig);
                setShowConfig(false);
                // Reload to initialize Firebase with new config
                window.location.reload();
            } else {
                console.error('Failed to decode config from URL');
                setError('Invalid configuration link. Please enter manually.');
            }
        }
    }, [searchParams, stored]);

    function saveConfig() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
        setShowConfig(false);
        window.location.reload();
    }

    async function handleSubmit() {
        setError('');
        setLoading(true);
        console.log('1. handleSubmit fired, isSignUp:', isSignUp);
        try {
            if (isSignUp) {
                await signUp(username, password);
                console.log('2. signUp success');
            } else {
                await signIn(username, password);
                console.log('2. signIn success');
            }
            navigate('/');
        } catch (err: any) {
            console.error('ERROR:', err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className={styles.page}>
            <div className={styles.card}>
                <h1>Stock Dashboard</h1>

                <button className={styles.configToggle} onClick={() => setShowConfig(!showConfig)}>
                    {showConfig ? 'Hide config' : 'Firebase config'} {stored ? '✓' : '⚠ not set'}
                </button>

                {showConfig && (
                    <div className={styles.configSection}>
                        {Object.keys(BLANK_CONFIG).map((key) => (
                            <div key={key} className={styles.field}>
                                <label>{key}</label>
                                <input
                                    value={config[key as keyof typeof config]}
                                    onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                                    placeholder={key}
                                />
                            </div>
                        ))}
                        <button className={styles.saveBtn} onClick={saveConfig}>
                            Save to this device
                        </button>
                    </div>
                )}

                <div className={styles.form}>
                    <div className={styles.field}>
                        <label>Username</label>
                        <input
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="your username"
                            autoComplete="off"
                        />
                    </div>
                    <div className={styles.field}>
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    {error && <p className={styles.error}>{error}</p>}

                    <button
                        type="button"
                        className={styles.submitBtn}
                        onClick={handleSubmit}
                        disabled={!stored || loading || !username || !password}
                    >
                        {loading ? 'Please wait...' : isSignUp ? 'Create account' : 'Sign in'}
                    </button>

                    <button
                        type="button"
                        className={styles.switchBtn}
                        onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
                    >
                        {isSignUp ? 'Already have an account? Sign in' : 'No account? Sign up'}
                    </button>

                    {!stored && <p className={styles.hint}>Save your Firebase config above first.</p>}
                </div>
            </div>
        </div>
    );
}