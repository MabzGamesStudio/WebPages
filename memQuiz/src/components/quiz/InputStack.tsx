import React, { forwardRef } from 'react';
import { QuizField } from '../../types';
import TextInput from '../ui/TextInput';
import OptionsInput from './OptionsInput';
import { ModuleConfig } from '../../types';

interface InputStackProps {
    fields: QuizField[];
    onUpdate: (index: number, value: string) => void;
    disabled: boolean;
    showErrors: boolean;
    inputType: ModuleConfig['inputType'];
    feedback: 'correct' | 'incorrect' | null;
}

const InputStack = forwardRef<HTMLDivElement, InputStackProps>(
    ({ fields, onUpdate, disabled, showErrors, inputType, feedback }, ref) => {

        // Helper to handle input changes with specific constraints
        const handleInputChange = (index: number, value: string, outputType: string) => {
            if (outputType === 'Digits') {
                // Only allow digits 0-9
                const cleaned = value.replace(/[^0-9]/g, '');
                onUpdate(index, cleaned);
            } else {
                onUpdate(index, value);
            }
        };

        return (
            <div className="input-stack" ref={ref}>
                {fields.map((field, index) => {
                    const isDigitsLengthError = showErrors &&
                        field.outputType === 'Digits' &&
                        field.isFilled &&
                        String(field.userAnswer).length !== String(field.expectedAnswer).length;

                    return (
                        <div key={field.outputKey} className="input-stack__item">
                            <label className="input-stack__label">
                                {field.outputKey}
                                <span className="input-stack__type">({field.outputType})</span>
                            </label>

                            {field.outputType === 'Options' && field.options ? (
                                <OptionsInput
                                    options={field.options}
                                    value={field.userAnswer}
                                    onChange={(val) => onUpdate(index, val)}
                                    disabled={disabled}
                                    isInvalid={showErrors && !field.isFilled}
                                />
                            ) : (
                                <>
                                    <TextInput
                                        type={field.outputType.startsWith('Number') || field.outputType === 'Digits' ? 'text' : 'text'}
                                        inputMode={field.outputType === 'Digits' ? 'numeric' : undefined}
                                        value={field.userAnswer}
                                        onChange={(val) => handleInputChange(index, val, field.outputType)}
                                        disabled={disabled}
                                        placeholder={`Enter ${field.outputKey}...`}
                                        isInvalid={showErrors && (!field.isFilled || isDigitsLengthError)}
                                        isCloseButNotExact={feedback !== null && !field.isExact}
                                    />
                                    {/* ✅ Specific error message for Digits length mismatch */}
                                    {isDigitsLengthError && (
                                        <span className="input-stack__error-msg" style={{ color: 'var(--color-error)', fontSize: '0.85rem', marginTop: '4px', display: 'block' }}>
                                            Invalid input: Must be exactly {String(field.expectedAnswer).length} digits.
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }
);

InputStack.displayName = 'InputStack';
export default InputStack;