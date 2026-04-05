import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getTradesForUser, getAllUsersPublicTrades, addTrade as fbAddTrade, deleteTrade as fbDeleteTrade } from '../firebase/db';
import type { Trade } from '../types';

export function useTrades(allUsers = false) {
    const { user, uid, loading: authLoading } = useAuth();
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        console.log('useTrades useEffect — authLoading:', authLoading, '| uid:', uid ?? 'null');

        if (authLoading) return;

        if (!user || !uid) {
            console.log('useTrades: no user/uid, stopping');
            setLoading(false);
            return;
        }

        async function fetchTrades() {
            console.log('fetchTrades: fetching for uid:', uid);
            setLoading(true);
            try {
                const data = allUsers
                    ? await getAllUsersPublicTrades()
                    : await getTradesForUser(uid!);
                console.log('fetchTrades: got', data.length, 'trades:', data);
                setTrades(data);
            } catch (e: any) {
                console.error('fetchTrades ERROR:', e.message);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        }

        fetchTrades();
    }, [user, uid, authLoading, allUsers]);

    const addTrade = async (trade: Omit<Trade, 'id' | 'userId'>) => {
        if (!user || !uid) { console.log('addTrade: no user/uid, aborting'); return; }
        console.log('addTrade: using uid:', uid);
        await fbAddTrade({ ...trade, userId: uid });
        const data = allUsers ? await getAllUsersPublicTrades() : await getTradesForUser(uid);
        setTrades(data);
    };

    const deleteTrade = async (tradeId: string) => {
        console.log('deleteTrade:', tradeId);
        await fbDeleteTrade(tradeId);
        setTrades(prev => prev.filter(t => t.id !== tradeId));
    };

    return { trades, loading, error, addTrade, deleteTrade };
}