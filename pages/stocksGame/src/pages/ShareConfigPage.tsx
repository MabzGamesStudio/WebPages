// ShareConfigPage.tsx
import { useState } from 'react';
import { encodeConfigToBase64 } from '../utils/authenticationEncoder';

const BLANK_CONFIG = {
    apiKey: '', authDomain: '', projectId: '',
    storageBucket: '', messagingSenderId: '', appId: '',
    databaseURL: '', finnhubApiKey: ''
};

export default function ShareConfigPage() {
    const [config, setConfig] = useState(BLANK_CONFIG);
    const [shareUrl, setShareUrl] = useState('');

    function generateShareLink() {
        const encoded = encodeConfigToBase64(config);
        const url = `${window.location.origin}/login?authentication=${encoded}`;
        setShareUrl(url);
    }

    return (
        <div style={{ padding: '20px' }}>
            <h2>Generate Shareable Link</h2>

            {Object.keys(BLANK_CONFIG).map((key) => (
                <div key={key}>
                    <label>{key}</label>
                    <input
                        value={config[key as keyof typeof config]}
                        onChange={(e) => setConfig({ ...config, [key]: e.target.value })}
                        placeholder={key}
                        style={{ width: '300px', margin: '5px' }}
                    />
                </div>
            ))}

            <button onClick={generateShareLink}>Generate Share Link</button>

            {shareUrl && (
                <div style={{ marginTop: '20px' }}>
                    <h3>Share this URL with your friends:</h3>
                    <input
                        value={shareUrl}
                        readOnly
                        style={{ width: '100%', padding: '10px' }}
                        onClick={(e) => e.currentTarget.select()}
                    />
                    <button onClick={() => navigator.clipboard.writeText(shareUrl)}>
                        Copy to Clipboard
                    </button>
                </div>
            )}
        </div>
    );
}