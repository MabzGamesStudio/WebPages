import React, { useEffect, useRef } from 'react';

interface OptionsInputProps {
    options: (string | number)[];
    value: string;
    onChange: (val: string) => void;
    disabled: boolean;
    isInvalid: boolean;
}

const OptionsInput: React.FC<OptionsInputProps> = ({ options, value, onChange, disabled, isInvalid }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    // Handle 1, 2, 3, 4 key presses
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (disabled) return;
            const key = e.key;
            const index = parseInt(key) - 1;

            // ✅ Allow any number key that corresponds to an existing option
            if (!isNaN(index) && options[index] !== undefined) {
                onChange(String(options[index]));
            }
        };

        const container = containerRef.current;
        container?.addEventListener('keydown', handleKeyDown);
        return () => container?.removeEventListener('keydown', handleKeyDown);
    }, [options, onChange, disabled]);

    return (
        <div
            className={`options-container ${isInvalid ? 'invalid' : ''}`}
            ref={containerRef}
            tabIndex={0}
        >
            {options.map((opt, idx) => (
                <button
                    key={idx}
                    type="button"
                    className={`option-btn ${value === String(opt) ? 'selected' : ''}`}
                    onClick={() => !disabled && onChange(String(opt))}
                    disabled={disabled}
                >
                    <span className="option-key">{idx + 1}</span>
                    <span className="option-val">{opt}</span>
                </button>
            ))}
        </div>
    );
};

export default OptionsInput;