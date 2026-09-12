import { useSettings } from '../../hooks/useSettings';
import TopBar from '../../components/layout/TopBar';
import styles from './Settings.module.scss';

const Settings = () => {
    const { settings, updateSettings } = useSettings();
    console.log(settings)

    return (
        <div>
            <TopBar title="Settings" showBack={true} />

            <div className="card">
                <h3>Batch Size</h3>
                <div className={styles.control}>
                    <button className="btn btn--secondary" onClick={() => updateSettings({ batchSize: Math.max(1, settings.batchSize - 1) })}>-</button>
                    <span className={styles.value}>{settings.batchSize}</span>
                    <button className="btn btn--secondary" onClick={() => updateSettings({ batchSize: settings.batchSize + 1 })}>+</button>
                </div>
            </div>

            <div className="card">
                <h3>NumberClose Tolerance (%)</h3>
                <p className={styles.desc}>Percentage off that is still considered correct.</p>
                <div className={styles.control}>
                    <button className="btn btn--secondary" onClick={() => updateSettings({ numberClosePercent: Math.max(0, settings.numberClosePercent - 1) })}>-</button>
                    <span className={styles.value}>{settings.numberClosePercent}%</span>
                    <button className="btn btn--secondary" onClick={() => updateSettings({ numberClosePercent: settings.numberClosePercent + 1 })}>+</button>
                </div>
            </div>

            <div className="card">
                <h3>TextClose Tolerance (Characters)</h3>
                <p className={styles.desc}>Max character additions/substitutions allowed.</p>
                <div className={styles.control}>
                    <button className="btn btn--secondary" onClick={() => updateSettings({ textCloseDistance: Math.max(0, settings.textCloseDistance - 1) })}>-</button>
                    <span className={styles.value}>{settings.textCloseDistance}</span>
                    <button className="btn btn--secondary" onClick={() => updateSettings({ textCloseDistance: settings.textCloseDistance + 1 })}>+</button>
                </div>
            </div>

            <div className="card">
                <h3>Multiple Choice Options Count</h3>
                <p className={styles.desc}>Number of choices to show for "Options" questions.</p>
                <div className={styles.control}>
                    <button
                        className="btn btn--secondary"
                        onClick={() => updateSettings({ optionsCount: Math.max(2, settings.optionsCount - 1) })}
                    >-</button>
                    <span className={styles.value}>{settings.optionsCount}</span>
                    <button
                        className="btn btn--secondary"
                        onClick={() => updateSettings({ optionsCount: settings.optionsCount + 1 })}
                    >+</button>
                </div>
            </div>
        </div>
    );
};

export default Settings;