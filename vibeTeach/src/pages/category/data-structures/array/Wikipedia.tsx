// components/WikipediaHeader.tsx
import React from 'react';
import styles from './Wikipedia.module.scss';

const WikipediaHeader: React.FC = () => {
    return (
        <header className={styles.moduleHeader}>
            <h1 className={styles.title}>Arrays Data Structure</h1>
            <a
                className={styles.external}
                href="https://en.wikipedia.org/wiki/Array_data_structure"
                target="_blank"
                rel="noopener noreferrer"
            >
                Wikipedia Page ↗
            </a>
        </header>
    );
};

export default WikipediaHeader;