import { useTrades } from '../hooks/useTrades';
import { usePortfolio } from '../hooks/usePortfolio';
import { useAuth } from '../hooks/useAuth';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import styles from './DashboardPage.module.scss';

function StatCard({ label, value, sub, positive }: {
    label: string; value: string; sub?: string; positive?: boolean;
}) {
    return (
        <div className={styles.statCard}>
            <span className={styles.statLabel}>{label}</span>
            <span className={`${styles.statValue} ${positive === true ? styles.green : positive === false ? styles.red : ''}`}>
                {value}
            </span>
            {sub && <span className={styles.statSub}>{sub}</span>}
        </div>
    );
}

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#14b8a6'];

export default function DashboardPage() {
    const { user } = useAuth();
    const { trades, loading } = useTrades(true);

    // Get unique users from trades
    // const userIds = [...new Set(trades.map(t => t.userId))];
    const myPortfolio = usePortfolio(trades, user?.uid ?? '', user?.email ?? 'Me');

    if (loading) return <div className={styles.loading}>Loading...</div>;

    const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

    // Merge history for chart: all dates across all users
    const allDates = [...new Set(myPortfolio.history.map(h => h.date))].sort();
    const chartData = allDates.map(date => {
        const point: Record<string, any> = { date };
        point[user?.email ?? 'Me'] = myPortfolio.history.find(h => h.date === date)?.value ?? null;
        return point;
    });

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1>Dashboard</h1>
                <span className={styles.subtitle}>Your portfolio at a glance</span>
            </div>

            <div className={styles.statsGrid}>
                <StatCard label="Total Value" value={fmt(myPortfolio.totalValue)} />
                <StatCard
                    label="Total Gain / Loss"
                    value={fmt(myPortfolio.totalGainLoss)}
                    sub={fmtPct(myPortfolio.totalGainLossPct)}
                    positive={myPortfolio.totalGainLoss >= 0}
                />
                <StatCard label="Positions" value={String(myPortfolio.positions.length)} />
                <StatCard label="Total Invested" value={fmt(myPortfolio.totalCost)} />
            </div>

            <div className={styles.section}>
                <h2>Performance over time</h2>
                <div className={styles.chart}>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={chartData}>
                            <XAxis dataKey="date" tick={{ fill: '#7b7f9a', fontSize: 11 }} tickLine={false} />
                            <YAxis tick={{ fill: '#7b7f9a', fontSize: 11 }} tickLine={false} axisLine={false}
                                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip
                                contentStyle={{ background: '#1a1d2b', border: '1px solid #252836', borderRadius: 8, color: '#e8eaf0' }}
                            // formatter={(v: number) => fmt(v)}
                            />
                            <Legend />
                            <Line type="monotone" dataKey={user?.email ?? 'Me'} stroke={COLORS[0]}
                                dot={false} strokeWidth={2} connectNulls />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className={styles.section}>
                <h2>Holdings</h2>
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>Ticker</th><th>Shares</th><th>Avg Cost</th>
                                <th>Value</th><th>Gain / Loss</th><th>%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {myPortfolio.positions.map(p => (
                                <tr key={p.ticker}>
                                    <td><span className={styles.ticker}>{p.ticker}</span></td>
                                    <td>{p.shares}</td>
                                    <td>{fmt(p.avgCost)}</td>
                                    <td>{fmt(p.currentValue)}</td>
                                    <td className={p.gainLoss >= 0 ? styles.green : styles.red}>{fmt(p.gainLoss)}</td>
                                    <td className={p.gainLossPct >= 0 ? styles.green : styles.red}>{fmtPct(p.gainLossPct)}</td>
                                </tr>
                            ))}
                            {myPortfolio.positions.length === 0 && (
                                <tr><td colSpan={6} className={styles.empty}>No positions yet — upload some trades</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}