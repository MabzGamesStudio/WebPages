import React from 'react';
import styles from './Layout.module.scss';
import { Link } from 'react-router-dom';

type Props = { children: React.ReactNode };

export default function Layout({ children }: Props) {
    return (
        <div className={styles.app}>
            <header className={styles.header}>
                <Link to="/" className={styles.brand}>vibeTeach</Link>
                <nav className={styles.nav}>
                    <Link to="/">Home</Link>
                </nav>
            </header>

            <main className={styles.main}>
                {children}
            </main>

            <footer className={styles.footer}>
                © {new Date().getFullYear()} vibeTeach
            </footer>
        </div>
    );
}
