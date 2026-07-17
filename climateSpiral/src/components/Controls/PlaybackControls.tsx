import type { CSSProperties } from 'react';
import type { PlaybackSpeed } from '../../hooks/usePlayback';
import type { ViewPreset } from '../SpiralScene/CameraRig';
import styles from './PlaybackControls.module.scss';

interface PlaybackControlsProps {
  playing: boolean;
  onToggle: () => void;
  currentIndex: number;
  totalFrames: number;
  onScrub: (index: number) => void;
  speed: PlaybackSpeed;
  onSpeedChange: (speed: PlaybackSpeed) => void;
  view: ViewPreset;
  onViewChange: (view: ViewPreset) => void;
  currentLabel: string;
}

const SPEEDS: PlaybackSpeed[] = [0.5, 1, 2, 4, 8];
const VIEWS: { id: ViewPreset; label: string }[] = [
  { id: 'orbit', label: 'Free' },
  { id: 'top', label: 'Top' },
  { id: 'side', label: 'Side' },
];

export default function PlaybackControls({
  playing,
  onToggle,
  currentIndex,
  totalFrames,
  onScrub,
  speed,
  onSpeedChange,
  view,
  onViewChange,
  currentLabel,
}: PlaybackControlsProps) {
  const progress = totalFrames > 1 ? (currentIndex / (totalFrames - 1)) * 100 : 0;
  const scrubStyle = { '--progress': `${progress}%` } as CSSProperties;

  return (
    <div className={styles.dock}>
      <div className={styles.transport}>
        <button
          type="button"
          className={styles.playBtn}
          onClick={onToggle}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <rect x="5" y="4" width="5" height="16" />
              <rect x="14" y="4" width="5" height="16" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4L20 12L6 20V4Z" />
            </svg>
          )}
        </button>
      </div>

      <div className={styles.scrubGroup}>
        <div className={styles.scrubLabels}>
          <span>{currentLabel}</span>
          <span>
            {currentIndex + 1} / {totalFrames}
          </span>
        </div>
        <input
          className={styles.scrub}
          style={scrubStyle}
          type="range"
          min={0}
          max={Math.max(0, totalFrames - 1)}
          value={currentIndex}
          onChange={(e) => onScrub(Number(e.target.value))}
          aria-label="Scrub timeline"
        />
      </div>

      <div className={styles.divider} />

      <div className={styles.speedGroup}>
        <span className={styles.groupLabel}>Speed</span>
        {SPEEDS.map((s) => (
          <button
            key={s}
            type="button"
            className={s === speed ? styles.chipActive : styles.chip}
            onClick={() => onSpeedChange(s)}
          >
            {s}&times;
          </button>
        ))}
      </div>

      <div className={styles.divider} />

      <div className={styles.viewGroup}>
        <span className={styles.groupLabel}>View</span>
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={v.id === view ? styles.chipActive : styles.chip}
            onClick={() => onViewChange(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>
    </div>
  );
}
