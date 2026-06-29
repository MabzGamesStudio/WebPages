import React, { useCallback, useEffect, useState } from "react";
import styles from './Animations.module.scss';

type ActionKey =
    | "access"
    | "search"
    | "push"
    | "pop"
    | "unshift"
    | "shift"
    | "insert-at"
    | "delete-at";

const ACTIONS: { key: ActionKey; label: string }[] = [
    { key: "access", label: "Access (by index)" },
    { key: "search", label: "Search (value)" },
    { key: "push", label: "Insert at end (push)" },
    { key: "pop", label: "Remove from end (pop)" },
    { key: "unshift", label: "Insert at beginning (unshift)" },
    { key: "shift", label: "Remove from beginning (shift)" },
    { key: "insert-at", label: "Insert at" },
    { key: "delete-at", label: "Delete at" },
];

const initialArray = [10, 20, 30, 40];

const AnimationSection: React.FC = () => {
    const [animArray, setAnimArray] = useState<number[]>(initialArray);
    const [activeIndices, setActiveIndices] = useState<number[]>([]);
    const [animMessage, setAnimMessage] = useState<string>("");
    // separate state for each input
    const [accessIndex, setAccessIndex] = useState<number | "">(0);
    const [searchValue, setSearchValue] = useState<number | "">(20);
    const [pushValue, setPushValue] = useState<number | "">(50);
    const [unshiftValue, setUnshiftValue] = useState<number | "">(5);
    const [insertIndex, setInsertIndex] = useState<number | "">(2);
    const [insertValue, setInsertValue] = useState<number | "">(25);
    const [deleteIndex, setDeleteIndex] = useState<number | "">(1);

    const [animationSpeed, setAnimationSpeed] = useState(5.0);
    const [animationFactor, setAnimationFactor] = useState(1.0);
    useEffect(() => {
        setAnimationFactor(5.0 / animationSpeed);
    }, [animationSpeed]);

    const clearHighlights = (delay = 700) => {
        setTimeout(() => setActiveIndices([]), delay * animationFactor);
    };

    const runAction = (action: ActionKey, value?: number, index?: number) => {
        const arr = [...animArray];
        setActiveIndices([]);

        switch (action) {
            case "access": {
                const idx = typeof index === "number" ? index : 0;
                if (idx < 0 || idx >= arr.length) {
                    setAnimMessage(`Index ${idx} out of bounds.`);
                } else {
                    setActiveIndices([idx]);
                    setAnimMessage(`Accessed index ${idx}: ${arr[idx]}`);
                }
                clearHighlights(500);
                return;
            }

            case "search": {
                if (value === undefined) {
                    setAnimMessage("Provide a value to search for.");
                    return;
                }
                let i = 0;
                const step = () => {
                    if (i >= arr.length) {
                        setActiveIndices([]);
                        setAnimMessage(`Value ${value} not found.`);
                        return;
                    }
                    setActiveIndices([i]);
                    setAnimMessage(`Checking index ${i}...`);
                    if (arr[i] === value) {
                        setAnimMessage(`Value ${value} found at index ${i}.`);
                        setTimeout(() => {
                            setActiveIndices([]);
                        }, 200 * animationFactor);
                        return;
                    }
                    i++;
                    // schedule next step
                    setTimeout(step, 200 * animationFactor);
                };

                step();
                return;
            }

            case "push": {
                if (value === undefined) {
                    setAnimMessage("Provide a value to push.");
                    return;
                }
                arr.push(value);
                setAnimArray(arr);
                setActiveIndices([arr.length - 1]);
                setAnimMessage(`Pushed ${value} to end.`);
                clearHighlights(700);
                return;
            }

            case "pop": {
                if (arr.length === 0) {
                    setAnimMessage("Array empty — cannot pop.");
                } else {
                    setActiveIndices([arr.length - 1]);
                    clearHighlights(700);
                    setTimeout(() => {
                        const popped = arr.pop()!;
                        setAnimArray(arr);
                        setAnimMessage(`Popped ${popped} from end.`);
                    }, 700 * animationFactor);
                    return;
                }
                return;
            }

            case "unshift": {
                if (value === undefined) {
                    setAnimMessage("Provide a value to unshift.");
                    return;
                }
                arr.unshift(value);
                setAnimArray(arr);
                setActiveIndices([0]);
                setAnimMessage(`Inserted ${value} at beginning.`);
                clearHighlights();
                return;
            }

            case "shift": {
                if (arr.length === 0) {
                    setAnimMessage("Array empty — cannot shift.");
                } else {
                    setActiveIndices([0]);
                    clearHighlights(700);
                    setTimeout(() => {
                        const popped = arr.shift()!;
                        setAnimArray(arr);
                        setAnimMessage(`Removed ${popped} from beginning.`);
                    }, 700 * animationFactor);
                    return;
                }
                return;
            }

            case "insert-at": {
                const idx = typeof index === "number" ? index : Math.floor(arr.length / 2);
                const v = value !== undefined ? value : Math.floor(Math.random() * 100);
                const clampedIdx = Math.max(0, Math.min(idx, arr.length));
                arr.splice(clampedIdx, 0, v);
                setAnimArray(arr);
                setActiveIndices([clampedIdx]);
                setAnimMessage(`Inserted ${v} at index ${clampedIdx}.`);
                clearHighlights();
                return;
            }

            case "delete-at": {
                if (arr.length === 0) {
                    setAnimMessage("Array empty — nothing to delete.");
                } else {
                    const idx = typeof index === "number" ? index : Math.floor(arr.length / 2);
                    if (idx < 0 || idx >= arr.length) {
                        setAnimMessage(`Index ${idx} out of bounds.`);
                    } else {
                        setActiveIndices([idx]);
                        clearHighlights(700);
                        setTimeout(() => {
                            const removed = arr.splice(idx, 1)[0];
                            setAnimArray(arr);
                            setAnimMessage(`Deleted ${removed} at index ${idx}.`);
                        }, 700 * animationFactor);
                        return;
                    }
                }
                return;
            }
        }
    };

    return (
        <section className={`${styles.card} ${styles['animation-card']}`}>
            <h2>Array Actions Animation</h2>

            <div className={styles['array-visual']}>
                {animArray.map((val, idx) => (
                    <div
                        key={idx}
                        className={`${styles['array-cell']} ${activeIndices.includes(idx) ? styles.active : ''}`}
                    >
                        <div className={styles['cell-index']}>{idx}</div>
                        <div className={styles['cell-value']}>{val}</div>
                    </div>
                ))}
                {animArray.length === 0 && <span className={styles['empty-msg']}>[Empty Array]</span>}
            </div>

            <div className={styles['animation-controls']}>
                <div className={styles['controls-row']}>
                    <button onClick={() => runAction("access", undefined, typeof accessIndex === "number" ? accessIndex : 0)}>
                        Access
                    </button>
                    <label>
                        Access index:
                        <input
                            type="number"
                            value={accessIndex === "" ? "" : accessIndex}
                            onChange={(e) => setAccessIndex(e.target.value === "" ? "" : Number(e.target.value))}
                            className={styles['small-input']}
                        />
                    </label>
                </div>

                <div className={styles['controls-row']}>
                    <button onClick={() => runAction("search", typeof searchValue === "number" ? searchValue : undefined)}>
                        Search
                    </button>
                    <label>
                        Search value:
                        <input
                            type="number"
                            value={searchValue === "" ? "" : searchValue}
                            onChange={(e) => setSearchValue(e.target.value === "" ? "" : Number(e.target.value))}
                            className={styles['small-input']}
                        />
                    </label>
                </div>

                <div className={styles['controls-row']}>
                    <button onClick={() => runAction("push", typeof pushValue === "number" ? pushValue : undefined)}>
                        Push
                    </button>
                    <label>
                        Push value:
                        <input
                            type="number"
                            value={pushValue === "" ? "" : pushValue}
                            onChange={(e) => setPushValue(e.target.value === "" ? "" : Number(e.target.value))}
                            className={styles['small-input']}
                        />
                    </label>
                </div>
                <div className={styles['controls-row']}>
                    <button onClick={() => runAction("pop")}>Pop</button>
                </div>
                <div className={styles['controls-row']}>
                    <button onClick={() => runAction("unshift", typeof unshiftValue === "number" ? unshiftValue : undefined)}>
                        Unshift
                    </button>
                    <label>
                        Unshift value:
                        <input
                            type="number"
                            value={unshiftValue === "" ? "" : unshiftValue}
                            onChange={(e) => setUnshiftValue(e.target.value === "" ? "" : Number(e.target.value))}
                            className={styles['small-input']}
                        />
                    </label>
                </div>
                <div className={styles['controls-row']}>
                    <button onClick={() => runAction("shift")}>Shift</button>
                </div>

                <div className={styles['controls-row']}>
                    <button
                        onClick={() =>
                            runAction(
                                "insert-at",
                                typeof insertValue === "number" ? insertValue : undefined,
                                typeof insertIndex === "number" ? insertIndex : undefined
                            )
                        }
                    >
                        Insert At
                    </button>
                    <label>
                        Insert index:
                        <input
                            type="number"
                            value={insertIndex === "" ? "" : insertIndex}
                            onChange={(e) => setInsertIndex(e.target.value === "" ? "" : Number(e.target.value))}
                            className={styles['small-input']}
                        />
                    </label>
                    <label>
                        Insert value:
                        <input
                            type="number"
                            value={insertValue === "" ? "" : insertValue}
                            onChange={(e) => setInsertValue(e.target.value === "" ? "" : Number(e.target.value))}
                            className={styles['small-input']}
                        />
                    </label>
                </div>

                <div className={styles['controls-row']}>
                    <button
                        onClick={() =>
                            runAction("delete-at", undefined, typeof deleteIndex === "number" ? deleteIndex : undefined)
                        }
                    >
                        Delete At
                    </button>
                    <label>
                        Delete index:
                        <input
                            type="number"
                            value={deleteIndex === "" ? "" : deleteIndex}
                            onChange={(e) => setDeleteIndex(e.target.value === "" ? "" : Number(e.target.value))}
                            className={styles['small-input']}
                        />
                    </label>
                </div>
            </div>
            <div className={styles['controls-row']}>
                <label>
                    Animation Speed:
                    <input
                        type="range"
                        min="1.0"
                        max="10.0"
                        step="0.1"
                        value={animationSpeed}
                        onChange={(e) => setAnimationSpeed(Number(e.target.value))}
                        className={styles['small-input']}
                    />
                </label>
                {animationSpeed.toFixed(1)}
            </div>
            {animMessage && <div className={styles['anim-message']}>{animMessage}</div>}
        </section>
    );
};

export default AnimationSection;
