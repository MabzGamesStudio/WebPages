export type GenericInputType = 'Text' | 'Options'; // Keep for legacy, but we'll use outputType now
export type GenericOutputType = 'Text' | 'TextClose' | 'Number' | 'NumberClose' | 'Options';

export interface ModuleConfig {
    id: string;
    name: string;
    tags: string[];
    inputType: GenericInputType;
    defaultOutputs: string[];
    availableOutputTypes: Record<string, GenericOutputType[]>;
    dataFile: string;
}

export interface DataItem {
    id: string | number;
    [key: string]: string | number;
}

export interface QuizField {
    outputKey: string;
    outputType: GenericOutputType;
    expectedAnswer: string | number;
    userAnswer: string;
    isFilled: boolean;
    options?: (string | number)[];
    isExact: boolean;
    isCorrect?: boolean; // ✅ ADD THIS
}

export interface QuizItem {
    id: string | number;
    promptKey: string;
    promptValue: string;
    fields: QuizField[];
}