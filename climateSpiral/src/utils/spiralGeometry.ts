import type { MonthlyPoint } from '../types/climate';

export interface SpiralPoint3D {
  x: number;
  y: number;
  z: number;
  anomaly: number;
  year: number;
  month: number;
  index: number;
}

// Tuning constants for the shape of the helix. Angle encodes month-of-year
// (one full turn per year), radius encodes temperature anomaly (bulging
// outward in warm months/years, pinching inward in cool ones), and height
// encodes the march of time so the whole history reads as a rising coil.
const MIN_RADIUS = 0.5;
const MAX_RADIUS = 4;
const YEAR_HEIGHT = 0.1;

export function buildSpiralPoints(points: MonthlyPoint[]): SpiralPoint3D[] {
  if (points.length === 0) return [];
  const firstYear = points[0].year;
  const maxAbsAnomaly = points.reduce((m, p) => Math.max(m, Math.abs(p.anomaly)), 0.001);

  return points.map((p) => {
    const angle = ((p.month - 1) / 12) * Math.PI * 2;
    const t = p.anomaly / maxAbsAnomaly;
    const radius = MIN_RADIUS + ((t + 1) / 2) * (MAX_RADIUS - MIN_RADIUS);
    const yearsElapsed = p.year - firstYear + (p.month - 1) / 12;

    return {
      x: radius * Math.cos(angle),
      z: radius * Math.sin(angle),
      y: yearsElapsed * YEAR_HEIGHT,
      anomaly: p.anomaly,
      year: p.year,
      month: p.month,
      index: p.index,
    };
  });
}

// Diverging blue -> amber -> red color scale driven by anomaly value,
// matching the semantics of the NASA/Ed Hawkins style climate spiral.
export function anomalyToColor(anomaly: number, maxAbs: number): string {
  const t = Math.max(-1, Math.min(1, anomaly / (maxAbs || 1)));

  const cold: [number, number, number] = [58, 134, 255]; // #3a86ff
  const mid: [number, number, number] = [230, 230, 225];
  const warm: [number, number, number] = [244, 68, 46]; // #f4442e

  const lerp = (a: number, b: number, f: number) => Math.round(a + (b - a) * f);

  // Push values toward the extremes faster (exponent < 1 steepens the curve
  // near t=0 and saturates sooner as |t| grows).
  const eased = Math.sign(t) * Math.pow(Math.abs(t), 0.5);
  const from = t < 0 ? cold : mid;
  const to = t < 0 ? mid : warm;
  const f = (eased + 1) / 2; // map [-1,1] -> [0,1]

  const [r, g, b] = [lerp(from[0], to[0], f), lerp(from[1], to[1], f), lerp(from[2], to[2], f)];
  return `rgb(${r}, ${g}, ${b})`;
}