// types.ts
export type ArrayAction = 'push' | 'pop' | 'shift' | 'unshift' | 'slice';

export interface BigONotation {
    action: string;
    time: string;
    memory: string;
}