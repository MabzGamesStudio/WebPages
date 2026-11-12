import type { Precision } from '../../types/climate';
import styles from './PrecisionToggle.module.scss';

interface PrecisionToggleProps {
  precision: Precision;
  onChange: (precision: Precision) => void;
}

export default function PrecisionToggle({ precision, onChange }: PrecisionToggleProps) {
  return (
    <div className={styles.wrap}>
      <span className={styles.label}>Precision</span>
      <button
        type="button"
        className={precision === 'month' ? styles.chipActive : styles.chip}
        onClick={() => onChange('month')}
      >
        Month
      </button>
      <button
        type="button"
        className={precision === 'day' ? styles.chipActive : styles.chip}
        onClick={() => onChange('day')}
      >
        Day
      </button>
    </div>
  );
}