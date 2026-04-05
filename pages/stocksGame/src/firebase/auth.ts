import { signInAnonymously, signOut as firebaseSignOut } from 'firebase/auth';
import { initFirebase } from './config';
import { registerUser, validateUser } from './db';

function getAuth_() {
    return initFirebase().auth;
}

export async function signUp(username: string, password: string): Promise<void> {
    const auth = getAuth_();
    const cred = await signInAnonymously(auth);
    // store the uid from this first sign up — this uid is permanent for this user
    await registerUser(username, password, cred.user.uid);
    localStorage.setItem('uid_override', cred.user.uid);
    localStorage.setItem('username', username);
}

export async function signIn(username: string, password: string): Promise<void> {
    const auth = getAuth_();
    // get the original uid stored during sign up
    const storedUid = await validateUser(username, password);
    // sign in anonymously just to get a Firebase session
    await signInAnonymously(auth);
    // override with the real uid tied to this username
    localStorage.setItem('uid_override', storedUid);
    localStorage.setItem('username', username);
}

export async function signOut(): Promise<void> {
    localStorage.removeItem('uid_override');
    localStorage.removeItem('username');
    await firebaseSignOut(getAuth_());
}