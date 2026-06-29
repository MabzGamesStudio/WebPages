/// <reference types="vite/client" />

declare module '*.geojson' {
    import { FeatureCollection, Geometry } from 'geojson';
    const value: FeatureCollection;
    export default value;
}