import { useMemo, useState, useEffect } from 'react';
import { buildPositions, calcPortfolioStats } from '../utils/calculations';
import { getCurrentPrice } from '../utils/prices';
import type { Trade, Portfolio, StockPosition } from '../types';

export function usePortfolio(trades: Trade[], userId: string, displayName: string): Portfolio {
    const [prices, setPrices] = useState<Record<string, number>>({});

    const userTrades = useMemo(() =>
        trades.filter(t => t.userId?.trim() === userId?.trim()),
        [trades, userId]
    );

    const tickers = useMemo(() =>
        [...new Set(userTrades.map(t => t.ticker))],
        [userTrades]
    );

    useEffect(() => {
        if (tickers.length === 0) return;
        console.log(`usePortfolio [${displayName}]: fetching prices for`, tickers);
        Promise.all(tickers.map(async ticker => {
            const price = await getCurrentPrice(ticker);
            return [ticker, price] as [string, number];
        })).then(entries => {
            const map = Object.fromEntries(entries);
            console.log(`usePortfolio [${displayName}]: prices fetched`, map);
            setPrices(map);
        });
    }, [tickers.join(',')]);

    return useMemo(() => {
        console.log(`usePortfolio [${displayName}]: ${userTrades.length} trades, prices:`, prices);
        const posMap = buildPositions(userTrades);
        const positions: StockPosition[] = Array.from(posMap.values())
            .filter(p => p.shares > 0)
            .map(p => {
                const currentPrice = prices[p.ticker] ?? p.avgCost;
                const currentValue = p.shares * currentPrice;
                const gainLoss = currentValue - p.totalCost;
                const gainLossPct = p.totalCost === 0 ? 0 : (gainLoss / p.totalCost) * 100;
                return { ...p, currentPrice, currentValue, gainLoss, gainLossPct };
            });

        const history = [...userTrades]
            .sort((a, b) => a.date.localeCompare(b.date))
            .reduce((acc, t) => {
                const prev = acc.at(-1)?.value ?? 0;
                const delta = t.type === 'buy'
                    ? t.shares * t.pricePerShare
                    : -(t.shares * t.pricePerShare);
                acc.push({ date: t.date, value: prev + delta });
                return acc;
            }, [] as { date: string; value: number }[]);

        return { userId, displayName, positions, history, ...calcPortfolioStats(positions) };
    }, [userTrades, prices]);
}