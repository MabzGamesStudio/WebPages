import type { CityResult, ClimatePoint, Precision } from '../../types/climate';
import styles from './Hud.module.scss';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface HudProps {
  city: CityResult;
  point?: ClimatePoint;
  precision: Precision;
}

export default function Hud({ city, point, precision }: HudProps) {
  const anomalyClass =
    point && point.anomaly >= 0 ? styles.anomalyPositive : styles.anomalyNegative;

  const dateLabel = point
    ? precision === 'day' && point.day !== undefined
      ? `${point.day} ${MONTH_NAMES[point.month - 1]} ${point.year}`
      : `${MONTH_NAMES[point.month - 1]} ${point.year}`
    : '\u2013';

  return (
    <div className={styles.panel}>
      <p className={styles.city}>
        {city.name}
        {city.admin1 ? `, ${city.admin1}` : ''}
      </p>

      <div className={styles.row}>
        <span>Date</span>
        <span className={styles.value}>{dateLabel}</span>
      </div>
      <div className={styles.row}>
        <span>Mean temp</span>
        <span className={styles.value}>{point ? `${point.meanTemp.toFixed(1)}°C` : '\u2013'}</span>
      </div>
      <div className={styles.row}>
        <span>Anomaly</span>
        <span className={`${styles.value} ${anomalyClass}`}>
          {point ? `${point.anomaly >= 0 ? '+' : ''}${point.anomaly.toFixed(2)}°C` : '\u2013'}
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