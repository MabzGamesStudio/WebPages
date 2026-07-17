import { useCallback, useEffect, useRef, useState } from 'react';

export type PlaybackSpeed = 0.5 | 1 | 2 | 4 | 8;

const MONTHS_PER_SECOND_AT_1X = 6;

export function usePlayback(totalFrames: number) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<PlaybackSpeed>(2);

  const rafRef = useRef<number | undefined>(undefined);
  const lastTimeRef = useRef<number | undefined>(undefined);
  const progressRef = useRef(0); // fractional frame accumulator

  useEffect(() => {
    progressRef.current = currentIndex;
  }, [currentIndex]); // keep accumulator in sync with manual scrubs

  useEffect(() => {
    if (!playing || totalFrames === 0) {
      lastTimeRef.current = undefined;
      return;
    }

    const step = (time: number) => {
      if (lastTimeRef.current === undefined) {
        lastTimeRef.current = time;
      }
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      progressRef.current += dt * MONTHS_PER_SECOND_AT_1X * speed;

      if (progressRef.current >= totalFrames - 1) {
        progressRef.current = totalFrames - 1;
        setCurrentIndex(Math.floor(progressRef.current));
        setPlaying(false);
        return;
      }

      setCurrentIndex(Math.floor(progressRef.current));
      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, speed, totalFrames]);

  const play = useCallback(() => {
    if (totalFrames === 0) return;
    if (currentIndex >= totalFrames - 1) {
      progressRef.current = 0;
      setCurrentIndex(0);
    }
    setPlaying(true);
  }, [currentIndex, totalFrames]);

  const pause = useCallback(() => setPlaying(false), []);

  const toggle = useCallback(() => {
    setPlaying((p) => {
      if (!p && currentIndex >= totalFrames - 1) {
        progressRef.current = 0;
        setCurrentIndex(0);
      }
      return !p;
    });
  }, [currentIndex, totalFrames]);

  const scrubTo = useCallback((index: number) => {
    setPlaying(false);
    const clamped = Math.max(0, Math.min(totalFrames - 1, index));
    progressRef.current = clamped;
    setCurrentIndex(clamped);
  }, [totalFrames]);

  return { currentIndex, playing, speed, setSpeed, play, pause, toggle, scrubTo };
}
