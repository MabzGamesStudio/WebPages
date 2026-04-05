import { useState } from 'react';
import { useTrades } from '../hooks/useTrades';
import styles from './UploadPage.module.scss';

const EMPTY_FORM = { ticker: '', shares: '', pricePerShare: '', type: 'buy' as 'buy' | 'sell', date: '' };

export default function UploadPage() {
    const { trades, loading, addTrade, deleteTrade } = useTrades(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    async function handleManual() {
        console.log('handleManual fired');
        setSubmitting(true);
        setError(''); setSuccess('');
        try {
            await addTrade({
                ticker: form.ticker.toUpperCase(),
                shares: parseFloat(form.shares),
                pricePerShare: parseFloat(form.pricePerShare),
                type: form.type,
                date: form.date,
            });
            setSuccess('Trade added!');
            setForm(EMPTY_FORM);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(tradeId: string) {
        setDeletingId(tradeId);
        await deleteTrade(tradeId);
        setDeletingId(null);
    }

    function parseCSVLine(line: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        for (const char of line) {
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    }

    function handleCSV(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const text = ev.target?.result as string;
            const lines = text.trim().split('\n');
            const header = parseCSVLine(lines[0]);
            console.log('CSV headers:', header);

            // find column indices dynamically from header
            const col = (name: string) => header.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
            const symbolIdx = col('symbol');
            const quantityIdx = col('quantity');
            const priceIdx = col('price');
            const actionIdx = col('action');
            const dateIdx = col('run date');

            console.log('Column indices — symbol:', symbolIdx, 'quantity:', quantityIdx, 'price:', priceIdx, 'action:', actionIdx, 'date:', dateIdx);

            let count = 0;
            for (const line of lines.slice(1)) {
                if (!line.trim()) continue;
                const cols = parseCSVLine(line);
                console.log('Parsed row:', cols);

                const ticker = cols[symbolIdx];
                const shares = parseFloat(cols[quantityIdx]);
                const price = parseFloat(cols[priceIdx]?.replace(/[^0-9.-]/g, ''));
                const action = cols[actionIdx]?.toLowerCase();
                const date = cols[dateIdx]; // "04/01/2026"

                // convert MM/DD/YYYY to YYYY-MM-DD
                const [month, day, year] = date.split('/');
                const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

                // treat "buy" in action as buy, otherwise sell
                const type: 'buy' | 'sell' = action?.includes('buy') ? 'buy' : 'sell';

                console.log('Adding trade:', { ticker, shares, price, type, date: isoDate });

                if (!ticker || isNaN(shares) || isNaN(price)) {
                    console.warn('Skipping invalid row:', cols);
                    continue;
                }

                await addTrade({ ticker, shares, pricePerShare: price, type, date: isoDate });
                count++;
            }
            setSuccess(`Imported ${count} trades!`);
        };
        reader.readAsText(file);
    }

    const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    const sorted = [...trades].sort((a, b) => b.date.localeCompare(a.date));

    return (
        <div className={styles.page}>
            <h1>Upload trades</h1>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <h2>Manual entry</h2>
                    <div className={styles.form}>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label>Ticker</label>
                                <input value={form.ticker} onChange={e => set('ticker', e.target.value)} placeholder="AAPL" />
                            </div>
                            <div className={styles.field}>
                                <label>Type</label>
                                <select value={form.type} onChange={e => set('type', e.target.value)}>
                                    <option value="buy">Buy</option>
                                    <option value="sell">Sell</option>
                                </select>
                            </div>
                        </div>
                        <div className={styles.row}>
                            <div className={styles.field}>
                                <label>Shares</label>
                                <input type="number" min="0" step="any" value={form.shares}
                                    onChange={e => set('shares', e.target.value)} placeholder="10" />
                            </div>
                            <div className={styles.field}>
                                <label>Price per share</label>
                                <input type="number" min="0" step="any" value={form.pricePerShare}
                                    onChange={e => set('pricePerShare', e.target.value)} placeholder="150.00" />
                            </div>
                        </div>
                        <div className={styles.field}>
                            <label>Date</label>
                            <input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
                        </div>

                        {success && <p className={styles.success}>{success}</p>}
                        {error && <p className={styles.error}>{error}</p>}

                        <button
                            type="button"
                            className={styles.submitBtn}
                            onClick={handleManual}
                            disabled={submitting || !form.ticker || !form.shares || !form.pricePerShare || !form.date}
                        >
                            {submitting ? 'Adding...' : 'Add trade'}
                        </button>
                    </div>
                </div>

                <div className={styles.card}>
                    <h2>CSV import</h2>
                    <p className={styles.hint}>Expected format:</p>
                    <pre className={styles.pre}>{`Run Date, Account, Account Number, Action, Symbol, ... , Price ($), Quantity , ..., 04/01/2026, "MyAccount", "123", "Buy", AAPL, ..., 150.00, 10, ...`}</pre>
                    <label className={styles.csvLabel}>
                        <input type="file" accept=".csv" onChange={handleCSV} className={styles.hidden} />
                        <span>Choose CSV file</span>
                    </label>
                </div>
            </div>

            <div className={styles.section}>
                <h2>Your trades <span className={styles.count}>{trades.length}</span></h2>
                <div className={styles.tableWrap}>
                    {loading ? (
                        <p className={styles.empty}>Loading...</p>
                    ) : sorted.length === 0 ? (
                        <p className={styles.empty}>No trades yet — add one above.</p>
                    ) : (
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Date</th><th>Ticker</th><th>Type</th>
                                    <th>Shares</th><th>Price</th><th>Total</th><th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {sorted.map(t => (
                                    <tr key={t.id}>
                                        <td>{t.date}</td>
                                        <td><span className={styles.ticker}>{t.ticker}</span></td>
                                        <td><span className={t.type === 'buy' ? styles.buyBadge : styles.sellBadge}>{t.type}</span></td>
                                        <td>{t.shares}</td>
                                        <td>{fmt(t.pricePerShare)}</td>
                                        <td>{fmt(t.shares * t.pricePerShare)}</td>
                                        <td>
                                            <button
                                                className={styles.deleteBtn}
                                                onClick={() => handleDelete(t.id!)}
                                                disabled={deletingId === t.id}
                                            >
                                                {deletingId === t.id ? '...' : '✕'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}