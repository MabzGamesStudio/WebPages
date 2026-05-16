import { Link } from 'react-router-dom';
import styles from './NotFound.module.scss';

export default function NotFound() {
    return (
        <div className={styles.wrap}>
            <h2>Page not found</h2>
            <p><Link to="/">Return home</Link></p>
        </div>
    );
}
