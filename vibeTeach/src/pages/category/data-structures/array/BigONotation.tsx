// components/BigONotationSection.tsx
import React from 'react';
import { BigONotation } from './types';
import styles from './BigONotation.module.scss';

const bigOData: BigONotation[] = [
    { action: 'Access (by index)', time: 'O(1)', memory: 'O(1)' },
    { action: 'Search (value)', time: 'O(n)', memory: 'O(1)' },
    { action: 'Insert at end (push)', time: 'O(1)*', memory: 'O(1)' },
    { action: 'Remove from end (pop)', time: 'O(1)', memory: 'O(1)' },
    { action: 'Insert at beginning (unshift)', time: 'O(n)', memory: 'O(1)' },
    { action: 'Remove from beginning (shift)', time: 'O(n)', memory: 'O(1)' },
    { action: 'Insert at', time: 'O(n)', memory: 'O(1)' },
    { action: 'Delete at', time: 'O(n)', memory: 'O(1)' },
];

const BigONotationSection: React.FC = () => {
    return (
        <section className={`${styles.card} ${styles.bigoCard}`}>
            <h2 className={styles.heading}>Big O Notation</h2>

            <div className={styles.bigoTableWrapper}>
                <table className={styles.bigoTable}>
                    <thead>
                        <tr>
                            <th className={styles.th}>Operation</th>
                            <th className={styles.th}>Time</th>
                            <th className={styles.th}>Memory</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bigOData.map((item, idx) => (
                            <tr key={idx} className={styles.tr}>
                                <td className={styles.td}>{item.action}</td>
                                <td className={styles.td}>
                                    <span className={styles.time}>{item.time}</span>
                                </td>
                                <td className={styles.td}>
                                    <span className={styles.memory}>{item.memory}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className={styles.footnote}>* Amortized for dynamic arrays (resizing)</div>
        </section>
    );
};

export default BigONotationSection;