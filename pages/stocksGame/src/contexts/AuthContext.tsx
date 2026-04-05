import { createContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { getStoredConfig, initFirebase } from '../firebase/config';

interface AuthContextValue {
    user: User | null;
    uid: string | null;
    username: string | null;
    loading: boolean;
}

export const AuthContext = createContext<AuthContextValue>({
    user: null,
    uid: null,
    username: null,
    loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [uid, setUid] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!getStoredConfig()) { setLoading(false); return; }
        const { auth } = initFirebase();
        const unsub = onAuthStateChanged(auth, (u) => {
            console.log('onAuthStateChanged: firebase user uid =', u?.uid ?? null);
            setUser(u);
            if (u) {
                const override = localStorage.getItem('uid_override');
                const storedUsername = localStorage.getItem('username');
                console.log('onAuthStateChanged: uid_override =', override);
                setUid(override ?? u.uid);
                setUsername(storedUsername);
            } else {
                setUid(null);
                setUsername(null);
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    return (
        <AuthContext.Provider value={{ user, uid, username, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}