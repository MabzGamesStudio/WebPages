import React from 'react';

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

    const baseClass = "text-input";
    const invalidClass = isInvalid ? "text-input--invalid" : "";
    const closeClass = isCloseButNotExact ? "text-input--close" : "";

    return (
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            inputMode={inputMode} // ✅ Pass it to the HTML input
            className={`${baseClass} ${invalidClass} ${closeClass} ${className || ''}`}
        />
    );
};

export default TextInput;