import React from 'react';
import styles from './TextInput.module.scss';

// ✅ Define only the props we actually use, plus inputMode
interface TextInputProps {
    value: string;
    onChange: (value: string) => void;
    isInvalid?: boolean;
    isCloseButNotExact?: boolean;
    placeholder?: string;
    disabled?: boolean;
    type?: string;
    inputMode?: React.InputHTMLAttributes<HTMLInputElement>['inputMode']; // ✅ Explicitly allow inputMode
    className?: string;
}

const TextInput = ({
    value,
    onChange,
    isInvalid,
    isCloseButNotExact,
    placeholder,
    disabled,
    type = "text",
    inputMode,
    className
}: TextInputProps) => {

    const inputClass = `${styles['text-input']} 
                        ${isInvalid ? styles['text-input--invalid'] : ''} 
                        ${isCloseButNotExact ? styles['text-input--close'] : ''} 
                        ${className || ''}`;

    return (
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            inputMode={inputMode} // ✅ Pass it to the HTML input
            className={inputClass}
        />
    );
};

export default TextInput;