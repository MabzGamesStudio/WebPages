import { NavLink } from 'react-router-dom';
import { signOut } from '../firebase/auth';
import { useAuth } from '../hooks/useAuth';
import styles from './NavBar.module.scss';
import { useNavigate } from 'react-router-dom';

export default function NavBar() {
    const { user, username } = useAuth();
    const navigate = useNavigate();
    if (!user) return null;

    async function handleSignOut() {
        try {
            await signOut();
            navigate('/login');
        } catch (err) {
            console.error('Sign out error:', err);
        }
    }

    return (
        <nav className={styles.nav}>
            <span className={styles.brand}>📈 StockDash</span>
            <div className={styles.links}>
                <NavLink to="/" className={({ isActive }) => isActive ? styles.active : ''} end>Dashboard</NavLink>
                <NavLink to="/portfolio" className={({ isActive }) => isActive ? styles.active : ''}>Portfolio</NavLink>
                <NavLink to="/upload" className={({ isActive }) => isActive ? styles.active : ''}>Upload</NavLink>
            </div>
            <div className={styles.user}>
                <span>{username ?? user?.uid.slice(0, 8)}</span>
                <button onClick={handleSignOut}>Sign out</button>
            </div>
        </nav>
    );
}