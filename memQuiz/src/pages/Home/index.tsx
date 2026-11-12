import { useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import modulesData from '../../data/modules.json';
import TopBar from '../../components/layout/TopBar';
import styles from './Home.module.scss';

type SortMode = 'az' | 'za' | 'topic' | 'random';

interface Module {
    id: string;
    name: string;
    tags: string[];
    [key: string]: unknown;
}

const allModules = modulesData as Module[];

// Collect all unique tags across modules (sorted)
const allTags = Array.from(
    new Set(allModules.flatMap(m => m.tags))
).sort();

// Collect all unique output type strings across all modules (lowercased for dedup, display-normalized)
const allOutputTypes = Array.from(
    new Set(
        allModules.flatMap(m => {
            const outputTypes = m.availableOutputTypes as Record<string, unknown>;
            return Object.values(outputTypes).flatMap(
                v => (Array.isArray(v) ? v : []) as string[]
            );
        })
    )
).map(t => t.toLowerCase())
 .sort();

// Shuffle helper (Fisher-Yates)
function shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const Home = () => {
    const [search, setSearch] = useState('');
    const [activeTags, setActiveTags] = useState<string[]>([]);
    const [activeTypes, setActiveTypes] = useState<string[]>([]);
    const [sortMode, setSortMode] = useState<SortMode>('az');
    const [randomSeed, setRandomSeed] = useState(0);

    const toggleTag = (tag: string) => {
        setActiveTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const toggleType = (type: string) => {
        setActiveTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const handleSortModeChange = useCallback((mode: SortMode) => {
        if (mode === 'random') {
            // Re-shuffle on every click
            setRandomSeed(prev => prev + 1);
        }
        setSortMode(mode);
    }, []);

    const filtered = useMemo(() => {
        let result = allModules;

        // Filter by search
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(m => m.name.toLowerCase().includes(q));
        }

        // Filter by tags (OR logic) — no tags selected = show all
        if (activeTags.length > 0) {
            result = result.filter(m =>
                m.tags.some(t => activeTags.includes(t))
            );
        }

        // Filter by output types (OR logic) — no types selected = show all
        if (activeTypes.length > 0) {
            result = result.filter(m => {
                const outputTypes = m.availableOutputTypes as Record<string, unknown>;
                return Object.values(outputTypes).some(v => {
                    if (!Array.isArray(v)) return false;
                    return (v as string[]).some(
                        t => activeTypes.includes(t.toLowerCase())
                    );
                });
            });
        }

        // Sort
        const sorted = [...result];
        switch (sortMode) {
            case 'az':
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'za':
                sorted.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'topic':
                sorted.sort((a, b) => {
                    const primaryA = a.tags[0] || '';
                    const primaryB = b.tags[0] || '';
                    const tagCmp = primaryA.localeCompare(primaryB);
                    return tagCmp !== 0 ? tagCmp : a.name.localeCompare(b.name);
                });
                break;
            case 'random':
                return shuffle(sorted);
        }

        return sorted;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search, activeTags, activeTypes, sortMode, randomSeed]);

    // Build active filter summary
    const filterSummary: string[] = [];
    if (activeTags.length > 0) filterSummary.push(activeTags.join(', '));
    if (activeTypes.length > 0) filterSummary.push(activeTypes.join(', '));
    if (search.trim()) filterSummary.push(`"${search.trim()}"`);

    return (
        <div>
            <TopBar title="MemQuiz" showSettings={true} />

            <p className={styles.subtitle}>Master any topic in bite-sized batches.</p>

            {/* Filter / Sort Toolbar */}
            <div className={styles.toolbar}>
                {/* Row 1: Search + Sort */}
                <div className={styles['search-row']}>
                    <input
                        type="text"
                        placeholder="Search modules..."
                        className={styles['search-input']}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />

                    <div className={styles.divider} />

                    <div className={styles['sort-group']}>
                        {([
                            { key: 'az', label: 'A-Z' },
                            { key: 'za', label: 'Z-A' },
                            { key: 'topic', label: 'Topic' },
                            { key: 'random', label: '🎲 Random' },
                        ] as const).map(({ key, label }) => (
                            <button
                                key={key}
                                className={`${styles['sort-btn']} ${sortMode === key ? styles.active : ''}`}
                                onClick={() => handleSortModeChange(key as SortMode)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles['row-divider']} />

                {/* Row 2: Tag filter pills */}
                <div className={styles['filter-row']}>
                    <span className={styles['filter-label']}>Tags</span>
                    <div className={styles['tag-pills']}>
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                className={`${styles['tag-pill']} ${activeTags.includes(tag) ? styles.active : ''}`}
                                onClick={() => toggleTag(tag)}
                            >
                                {tag}
                            </button>
                        ))}
                    </div>
                </div>

                <div className={styles['row-divider']} />

                {/* Row 3: Input type filter pills */}
                <div className={styles['filter-row']}>
                    <span className={styles['filter-label']}>Types</span>
                    <div className={styles['type-pills']}>
                        {allOutputTypes.map(type => (
                            <button
                                key={type}
                                className={`${styles['type-pill']} ${activeTypes.includes(type) ? styles.active : ''}`}
                                onClick={() => toggleType(type)}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Result count */}
            <p className={styles['result-count']}>
                {filtered.length} {filtered.length === 1 ? 'module' : 'modules'}
                {filterSummary.length > 0 && ` matching ${filterSummary.join(' + ')}`}
            </p>

            {/* Module grid */}
            {filtered.length > 0 ? (
                <div className={styles['module-grid']}>
                    {filtered.map(mod => (
                        <Link
                            to={`/module/${mod.id}`}
                            key={mod.id}
                            className={`card ${styles['module-card']}`}
                        >
                            <h3>{mod.name}</h3>
                            <div className={styles.tags}>
                                {mod.tags.map((tag: string) => (
                                    <span key={tag} className={styles.tag}>{tag}</span>
                                ))}
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className={styles['empty-state']}>
                    <p>No modules match your filters.</p>
                </div>
            )}
        </div>
    );
};

export default Home;