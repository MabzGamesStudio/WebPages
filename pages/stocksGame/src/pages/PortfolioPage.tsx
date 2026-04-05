import { useState, useEffect } from 'react';
import { useTrades } from '../hooks/useTrades';
import { usePortfolio } from '../hooks/usePortfolio';
import { useAuth } from '../hooks/useAuth';
import { getAllUsernames } from '../firebase/db';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import styles from './PortfolioPage.module.scss';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#14b8a6'];
const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`;

function UserPortfolio({ trades, userId, name, color }: {
    trades: any[]; userId: string; name: string; color: string;
}) {
    console.log(`UserPortfolio [${name}]: userId="${userId}", trades passed=${trades.length}`);
    const portfolio = usePortfolio(trades, userId, name);
    console.log(`UserPortfolio [${name}]: positions=${portfolio.positions.length}`);
    console.log('all trades:', trades.length, trades.map(t => ({ uid: t.userId, ticker: t.ticker })));
    // console.log('unique userIds:', userIds);
    const isPos = portfolio.totalGainLoss >= 0;

    return (
        <div className={styles.userBlock}>
            <div className={styles.userHeader}>
                <span className={styles.dot} style={{ background: color }} />
                <span className={styles.userName}>{name}</span>
                <span className={styles.userValue}>{fmt(portfolio.totalValue)}</span>
                <span className={`${styles.userGain} ${isPos ? styles.green : styles.red}`}>
                    {fmt(portfolio.totalGainLoss)} ({fmtPct(portfolio.totalGainLossPct)})
                </span>
            </div>
            <div className={styles.tableWrap}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Ticker</th><th>Shares</th><th>Avg Cost</th>
                            <th>Value</th><th>Gain / Loss</th><th>%</th>
                        </tr>
                    </thead>
                    <tbody>
                        {portfolio.positions.map(p => (
                            <tr key={p.ticker}>
                                <td><span className={styles.ticker}>{p.ticker}</span></td>
                                <td>{p.shares}</td>
                                <td>{fmt(p.avgCost)}</td>
                                <td>{fmt(p.currentValue)}</td>
                                <td className={p.gainLoss >= 0 ? styles.green : styles.red}>{fmt(p.gainLoss)}</td>
                                <td className={p.gainLossPct >= 0 ? styles.green : styles.red}>{fmtPct(p.gainLossPct)}</td>
                            </tr>
                        ))}
                        {portfolio.positions.length === 0 && (
                            <tr><td colSpan={6} className={styles.empty}>No positions</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default function PortfolioPage() {
    const { uid } = useAuth();
    const { trades, loading } = useTrades(true);
    const [view, setView] = useState<'compare' | 'chart'>('compare');
    const [usernames, setUsernames] = useState<Record<string, string>>({});

    useEffect(() => {
        getAllUsernames().then(setUsernames).catch(console.error);
    }, []);

    const getName = (userId: string) => {
        if (userId === uid) return usernames[userId] ? `${usernames[userId]} (me)` : 'Me';
        return usernames[userId] ?? userId.slice(0, 8);
    };

    const userIds = [...new Set(trades.map(t => t.userId))];

    const allDates = [...new Set(trades.map(t => t.date))].sort();
    const chartData = allDates.map(date => {
        const point: Record<string, any> = { date };
        userIds.forEach((userId) => {
            console.log('first trade keys:', Object.keys(trades[0]));
            console.log('first trade full:', trades[0]);
            // const userTrades = trades.filter(t => t.userId === userId && t.date <= date);
            const userTrades = trades.filter(t => t.userId?.trim() === userId?.trim() && t.date <= date);
            const total = userTrades.reduce((s, t) =>
                s + (t.type === 'buy' ? t.shares * t.pricePerShare : -(t.shares * t.pricePerShare)), 0);
            point[getName(userId)] = total;
        });
        return point;
    });

    if (loading) return <div className={styles.loading}>Loading...</div>;

    return (
        <div className={styles.page}>
            <div className={styles.topBar}>
                <h1>Portfolio comparison</h1>
                <div className={styles.tabs}>
                    <button className={view === 'compare' ? styles.active : ''} onClick={() => setView('compare')}>Breakdown</button>
                    <button className={view === 'chart' ? styles.active : ''} onClick={() => setView('chart')}>Chart</button>
                </div>
            </div>

            {view === 'chart' && (
                <div className={styles.chart}>
                    <ResponsiveContainer width="100%" height={320}>
                        <LineChart data={chartData}>
                            <XAxis dataKey="date" tick={{ fill: '#7b7f9a', fontSize: 11 }} tickLine={false} />
                            <YAxis tick={{ fill: '#7b7f9a', fontSize: 11 }} tickLine={false} axisLine={false}
                                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                            <Tooltip
                                contentStyle={{ background: '#1a1d2b', border: '1px solid #252836', borderRadius: 8, color: '#e8eaf0' }}
                            />
                            <Legend />
                            {userIds.map((userId, i) => (
                                <Line key={userId} type="monotone"
                                    dataKey={getName(userId)}
                                    stroke={COLORS[i % COLORS.length]}
                                    dot={false} strokeWidth={2} connectNulls />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {view === 'compare' && (
                <div className={styles.users}>
                    {userIds.map((userId, i) => (
                        <UserPortfolio key={userId} trades={trades} userId={userId}
                            name={getName(userId)}
                            color={COLORS[i % COLORS.length]} />
                    ))}
                    {userIds.length === 0 && <p className={styles.empty}>No trades yet from any user.</p>}
                </div>
            )}
        </div>
    );
}