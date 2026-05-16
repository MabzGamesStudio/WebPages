// components/ProsConsSection.tsx
import React from 'react';
import styles from './ProsCons.module.scss';

const ProsConsSection: React.FC = () => {
    return (
        <section className={`${styles.card} ${styles.prosconsCard}`}>
            <h2 className={styles.heading}>Pros &amp; Cons</h2>

            <div className={styles.columns}>
                <div className={styles.pros}>
                    <h3 className={styles.proHeading}>✅ Pros</h3>
                    <ul className={styles.list}>
                        <li>Fast O(1) access by index</li>
                        <li>Cache-friendly (contiguous memory)</li>
                        <li>Simple to implement and use</li>
                    </ul>
                </div>

                <div className={styles.cons}>
                    <h3 className={styles.consHeading}>❌ Cons</h3>
                    <ul className={styles.list}>
                        <li>Fixed size (static arrays) or costly resizing (dynamic)</li>
                        <li>Insertions/deletions at middle/start are O(n)</li>
                        <li>Memory overhead if capacity &gt; size</li>
                    </ul>
                </div>
            </div>
        </section>

    );
};

export default ProsConsSection;