const modules = import.meta.glob('./*.json', { eager: true });

const dataCache: Record<string, any> = {};

Object.keys(modules).forEach((path) => {
    const fileName = path.split('/').pop();
    if (fileName && fileName !== 'modules.json') {
        const mod = modules[path] as any;
        dataCache[fileName] = mod.default || mod;
    }
});

export const getDataModule = (fileName: string): any[] | null => {
    return dataCache[fileName] || null;
};