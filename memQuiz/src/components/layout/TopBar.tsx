import { useNavigate, useLocation } from 'react-router-dom';
import styles from './TopBar.module.scss';

interface TopBarProps {
    title?: string;
    showBack?: boolean;
    showSettings?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({ title, showBack = false, showSettings = false }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const goBack = () => {
        if (location.pathname !== '/') {
            navigate(-1);
        } else {
            navigate('/');
        }
    };

    return (
        <div className={styles.topbar}>
            <div className={styles.left}>
                {showBack && (
                    <button className="btn btn--secondary" onClick={goBack}>
                        ← Back
                    </button>
                )}
            </div>

            {title && <h2 className={styles.title}>{title}</h2>}

            <div className={styles.right}>
                {showSettings && (
                    <button className="btn btn--secondary" onClick={() => navigate('/settings')}>
                        ️ Settings
                    </button>
                )}
                {!showSettings && (
                    <button className="btn btn--secondary" onClick={() => navigate('/')}>
                        🏠 Home
                    </button>
                )}
            </div>
        </div>
    );
};

export default TopBar;