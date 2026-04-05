export interface Trade {
    id?: string;
    userId: string;
    ticker: string;
    shares: number;
    pricePerShare: number;
    type: 'buy' | 'sell';
    date: string; // ISO string
    createdAt?: number;
}

export interface StockPosition {
    ticker: string;
    shares: number;
    avgCost: number;
    currentPrice: number; // fetched client-side
    totalCost: number;
    currentValue: number;
    gainLoss: number;
    gainLossPct: number;
}

export interface Portfolio {
    userId: string;
    displayName: string;
    positions: StockPosition[];
    totalCost: number;
    totalValue: number;
    totalGainLoss: number;
    totalGainLossPct: number;
    history: { date: string; value: number }[];
}