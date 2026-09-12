import React, { forwardRef } from 'react';
import { QuizField } from '../../types';
import TextInput from '../ui/TextInput';
import OptionsInput from './OptionsInput';
import { ModuleConfig } from '../../types';

interface InputStackProps {
    fields: QuizField[];
    onUpdate: (index: number, value: string) => void;
    disabled: boolean;
    showErrors: boolean;       // Renamed for consistency in this component
    inputType: ModuleConfig['inputType'];
    feedback: 'correct' | 'incorrect' | null; // ✅ ADDED: Required to determine styling
}

const InputStack = forwardRef<HTMLDivElement, InputStackProps>(
    ({ fields, onUpdate, disabled, showErrors, inputType, feedback }, ref) => {
        return (
            <div className="input-stack" ref={ref}>
                {fields.map((field, index) => (
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
                            <TextInput
                                type={field.outputType.startsWith('Number') ? 'number' : 'text'}
                                value={field.userAnswer}
                                onChange={(val) => onUpdate(index, val)}
                                disabled={disabled}
                                placeholder={`Enter ${field.outputKey}...`}
                                isInvalid={showErrors && !field.isFilled}
                                isCloseButNotExact={feedback !== null && !field.isExact}
                            />
                        )}
                    </div>
                ))}
            </div>
        );
    }
);

InputStack.displayName = 'InputStack';
export default InputStack;