import { Link } from 'react-router-dom';
import modulesData from '../../data/modules.json';
import TopBar from '../../components/layout/TopBar';
import styles from './Home.module.scss';

const Home = () => {
    return (
        <div>
            {/* ✅ Settings button added here */}
            <TopBar title="MemQuiz" showSettings={true} />

            <p className={styles.subtitle}>Master any topic in bite-sized batches.</p>

            <div className={styles['module-grid']}>
                {(modulesData as any[]).map(mod => (
                    <Link
                        to={`/module/${mod.id}`}
                        key={mod.id}
                        className={`card ${styles['module-card']}`}
                    >
                        <h3>{mod.name}</h3>
                        <div className={styles.tags}>
                            {mod.tags.map((tag: string) => <span key={tag} className={styles.tag}>{tag}</span>)}
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Home;