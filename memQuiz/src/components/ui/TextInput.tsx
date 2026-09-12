import React from 'react';
import styles from './TextInput.module.scss';
interface Props {
    type: 'text' | 'number';
    value: string;
    onChange: (val: string) => void;
    disabled?: boolean;
    placeholder?: string;
    isInvalid?: boolean;
    isCloseButNotExact?: boolean; // ✅ NEW PROP
}

const TextInput: React.FC<Props> = ({
    type, value, onChange, disabled, placeholder, isInvalid, isCloseButNotExact
}) => {
    const classNames = [
        styles['input-field'],
        isInvalid ? styles['invalid'] : '',
        isCloseButNotExact ? styles['close-but-not-exact'] : ''
    ].filter(Boolean).join(' ');

    return (
        <input
            className={classNames}
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder={placeholder}
        />
    );
};

export default TextInput;