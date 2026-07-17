import type { DailyTempResponse } from '../api/openMeteo';
import type { MonthlyPoint } from '../types/climate';

interface MonthlyAccumulator {
  sum: number;
  count: number;
  year: number;
  month: number;
}

export function buildMonthlyDataset(daily: DailyTempResponse): {
  points: MonthlyPoint[];
  baselineByMonth: number[];
} {
  const buckets = new Map<string, MonthlyAccumulator>();

  daily.time.forEach((dateStr, i) => {
    const temp = daily.temperature_2m_mean[i];
    if (temp === null || temp === undefined) return;

    const year = Number(dateStr.slice(0, 4));
    const month = Number(dateStr.slice(5, 7));
    const key = `${year}-${month}`;

    const existing = buckets.get(key);
    if (existing) {
      existing.sum += temp;
      existing.count += 1;
    } else {
      buckets.set(key, { sum: temp, count: 1, year, month });
    }
  });

  const monthlyMeans = Array.from(buckets.values())
    .map((b) => ({ year: b.year, month: b.month, meanTemp: b.sum / b.count }))
    .sort((a, b) => a.year - b.year || a.month - b.month);

  // Baseline: long-run average for each calendar month, so the anomaly
  // strips out the ordinary seasonal cycle and isolates warming/cooling.
  const baselineSums = new Array(12).fill(0);
  const baselineCounts = new Array(12).fill(0);
  monthlyMeans.forEach((m) => {
    baselineSums[m.month - 1] += m.meanTemp;
    baselineCounts[m.month - 1] += 1;
  });
  const baselineByMonth = baselineSums.map((sum, i) =>
    baselineCounts[i] ? sum / baselineCounts[i] : 0
  );

  const points: MonthlyPoint[] = monthlyMeans.map((m, index) => ({
    year: m.year,
    month: m.month,
    index,
    meanTemp: m.meanTemp,
    anomaly: m.meanTemp - baselineByMonth[m.month - 1],
  }));

  return { points, baselineByMonth };
}
