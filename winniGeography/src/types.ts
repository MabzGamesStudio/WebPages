export interface ScoreRecord {
    bestPercent: number;
    bestTime: number; // in seconds
}

export type QuizMode = 'practice' | 'quiz';

export interface IslandFeature {
    type: 'Feature';
    properties: {
        id: string;
        '@id'?: string;
        alt_name?: string | null;
        ele?: string;
        'gnis:feature_id'?: string;
        leaf_cycle?: string | null;
        leaf_type?: string | null;
        name: string;
        natural?: string | null;
        place?: string;
        type?: string;
        wikidata?: string;
        wikipedia?: string | null;
        town: string;
    };
    geometry: {
        type: string;
        coordinates: any;
    };
}