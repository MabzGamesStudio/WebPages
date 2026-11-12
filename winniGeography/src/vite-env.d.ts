/// <reference types="vite/client" />

declare module '*.geojson' {
    const value: {
        type: 'FeatureCollection';
        name: string;
        features: any[];
    };
    export default value;
}