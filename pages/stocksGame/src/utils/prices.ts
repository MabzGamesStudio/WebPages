const cache: Record<string, { price: number; ts: number }> = {};
const CACHE_MS = 60_000;
import { STORAGE_KEY } from '../firebase/config';

export async function getCurrentPrice(ticker: string): Promise<number> {
    const now = Date.now();
    if (cache[ticker] && now - cache[ticker].ts < CACHE_MS) {
        console.log(`prices: cache hit for ${ticker}:`, cache[ticker].price);
        return cache[ticker].price;
    }
    try {
        const apiKey = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '')?.finnhubApiKey;
        console.log(apiKey);
        if (apiKey === undefined) {
            throw new Error('API key not found');
        }
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${apiKey}`);
        const data = await res.json();
        const price = data.c;
        console.log(`prices: fetched ${ticker} =`, price);
        if (!price) return 0;
        cache[ticker] = { price, ts: now };
        return price;
    } catch (e) {
        console.error(`getCurrentPrice failed for ${ticker}:`, e);
        return 0;
    }
}