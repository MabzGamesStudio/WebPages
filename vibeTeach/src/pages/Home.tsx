import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Home.module.scss';

type Category = { id: string; title: string; description: string; color?: string };

const CATEGORIES: Category[] = [
    { id: 'data-structures', title: 'Data Structures', description: 'Linked lists, trees, graphs, heaps.' },
    { id: 'algorithms', title: 'Algorithms', description: 'Sorting, searching, dynamic programming.' }
];

export default function Home() {
    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Learning Categories</h1>
            <div className={styles.grid}>
                {CATEGORIES.map(cat => (
                    <Link key={cat.id} to={`/category/${cat.id}`} className={styles.card}>
                        <h2>{cat.title}</h2>
                        <p>{cat.description}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
