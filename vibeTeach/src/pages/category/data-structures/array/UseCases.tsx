// components/UseCasesSection.tsx
import React from 'react';
import styles from './UseCases.module.scss';

const UseCasesSection: React.FC = () => {
    return (
        <section className={`${styles.card} ${styles.usecasesCard}`}>
            <h2 className={styles.heading}>Example Use Cases</h2>
            <ul className={styles.list}>
                <li>Storing list of items (e.g., user names, product IDs)</li>
                <li>Implementing stacks and queues</li>
                <li>Matrix operations (2D arrays)</li>
                <li>Buffer for streaming data (ring buffer using array)</li>
                <li>Lookup tables / memoization caches (with index mapping)</li>
            </ul>
        </section>

    );
};

export default UseCasesSection;