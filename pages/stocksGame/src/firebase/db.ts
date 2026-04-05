import { ref, push, get, set, remove, query, orderByChild, equalTo } from 'firebase/database';
import { initFirebase } from './config';
import { hashPassword } from '../utils/crypto';
import type { Trade } from '../types';

function getDb() {
    return initFirebase().db;
}

export async function registerUser(username: string, password: string, uid: string): Promise<void> {
    const db = getDb();
    const existing = await findUserByUsername(username);
    if (existing) throw new Error('Username already taken');
    const hashed = await hashPassword(password);
    await set(ref(db, `users/${uid}`), { username, passwordHash: hashed, uid });
}

export async function findUserByUsername(username: string): Promise<{ uid: string; username: string; passwordHash: string } | null> {
    const db = getDb();
    const q = query(ref(db, 'users'), orderByChild('username'), equalTo(username));
    const snap = await get(q);
    if (!snap.exists()) return null;
    const entries = Object.values(snap.val()) as any[];
    return entries[0] ?? null;
}

export async function validateUser(username: string, password: string): Promise<string> {
    const user = await findUserByUsername(username);
    if (!user) throw new Error('Username not found');
    const hashed = await hashPassword(password);
    if (hashed !== user.passwordHash) throw new Error('Incorrect password');
    return user.uid;
}

export const addTrade = async (trade: Omit<Trade, 'id'>) => {
    console.log('db.addTrade: writing trade:', trade);
    try {
        const result = await push(ref(getDb(), 'trades'), { ...trade, createdAt: Date.now() });
        console.log('db.addTrade: success, key:', result.key);
        return result;
    } catch (e: any) {
        console.error('db.addTrade ERROR:', e.code, e.message);
        throw e;
    }
};

export const deleteTrade = async (tradeId: string): Promise<void> => {
    console.log('db.deleteTrade: deleting', tradeId);
    await remove(ref(getDb(), `trades/${tradeId}`));
};

export const getTradesForUser = async (userId: string): Promise<Trade[]> => {
    console.log('getTradesForUser: fetching for uid:', userId);
    const db = getDb();
    const snap = await get(query(ref(db, 'trades'), orderByChild('userId'), equalTo(userId)));
    console.log('getTradesForUser: snap exists:', snap.exists(), snap.val());
    if (!snap.exists()) return [];
    return Object.entries(snap.val()).map(([id, val]) => ({ id, ...(val as Omit<Trade, 'id'>) }));
};

export const getAllUsersPublicTrades = async (): Promise<Trade[]> => {
    console.log('getAllUsersPublicTrades: fetching...');
    const snap = await get(ref(getDb(), 'trades'));
    console.log('getAllUsersPublicTrades: snap exists:', snap.exists(), '| val:', snap.val());
    if (!snap.exists()) return [];
    return Object.entries(snap.val()).map(([id, val]) => ({ id, ...(val as Omit<Trade, 'id'>) }));
};

export async function getAllUsernames(): Promise<Record<string, string>> {
    const snap = await get(ref(getDb(), 'users'));
    if (!snap.exists()) return {};
    const result: Record<string, string> = {};
    Object.values(snap.val() as Record<string, any>).forEach((u) => {
        result[u.uid] = u.username;
    });
    return result;
}