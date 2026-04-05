import type { Trade, StockPosition, Portfolio } from '../types';

export function buildPositions(trades: Trade[]): Map<string, StockPosition> {
    const positions = new Map<string, StockPosition>();
    for (const t of trades) {
        const pos = positions.get(t.ticker) ?? {
            ticker: t.ticker, shares: 0, avgCost: 0,
            currentPrice: 0, totalCost: 0,
            currentValue: 0, gainLoss: 0, gainLossPct: 0,
        };
        if (t.type === 'buy') {
            const newTotal = pos.totalCost + t.shares * t.pricePerShare;
            const newShares = pos.shares + t.shares;
            pos.avgCost = newTotal / newShares;
            pos.shares = newShares;
            pos.totalCost = newTotal;
        } else {
            pos.shares -= t.shares;
            pos.totalCost = pos.avgCost * pos.shares;
        }
        positions.set(t.ticker, pos);
    }
    return positions;
}

export function calcPortfolioStats(
    positions: StockPosition[]
): Pick<Portfolio, 'totalCost' | 'totalValue' | 'totalGainLoss' | 'totalGainLossPct'> {
    const totalCost = positions.reduce((s, p) => s + p.totalCost, 0);
    const totalValue = positions.reduce((s, p) => s + p.currentValue, 0);
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPct = totalCost === 0 ? 0 : (totalGainLoss / totalCost) * 100;
    return { totalCost, totalValue, totalGainLoss, totalGainLossPct };
}