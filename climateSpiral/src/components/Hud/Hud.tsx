import type { CityResult, MonthlyPoint } from '../../types/climate';
import styles from './Hud.module.scss';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface HudProps {
  city: CityResult;
  point?: MonthlyPoint;
}

export default function Hud({ city, point }: HudProps) {
  const anomalyClass =
    point && point.anomaly >= 0 ? styles.anomalyPositive : styles.anomalyNegative;

  return (
    <div className={styles.panel}>
      <p className={styles.city}>
        {city.name}
        {city.admin1 ? `, ${city.admin1}` : ''}
      </p>

      <div className={styles.row}>
        <span>Date</span>
        <span className={styles.value}>
          {point ? `${MONTH_NAMES[point.month - 1]} ${point.year}` : '&ndash;'}
        </span>
      </div>
      <div className={styles.row}>
        <span>Mean temp</span>
        <span className={styles.value}>{point ? `${point.meanTemp.toFixed(1)}°C` : '&ndash;'}</span>
      </div>
      <div className={styles.row}>
        <span>Anomaly</span>
        <span className={`${styles.value} ${anomalyClass}`}>
          {point ? `${point.anomaly >= 0 ? '+' : ''}${point.anomaly.toFixed(2)}°C` : '&ndash;'}
        </span>
      </div>

      <div className={styles.legend}>
        <span className={styles.legendLabel}>cool</span>
        <div className={styles.legendBar} />
        <span className={styles.legendLabel}>warm</span>
      </div>
    </div>
  );
}
