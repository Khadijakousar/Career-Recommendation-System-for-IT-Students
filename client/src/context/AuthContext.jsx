import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser } from '../api/auth.js';

const AuthContext = createContext(null);
const tokenKey = 'career-recommendation:token';
const signedOut = { status: 'ready', user: null, token: null };

function readToken() {
  try {
    return localStorage.getItem(tokenKey);
  } catch {
    return null;
  }
}

function storeToken(token) {
  try {
    if (token) localStorage.setItem(tokenKey, token);
    else localStorage.removeItem(tokenKey);
  } catch {
    // Keep the current session in memory if browser storage is unavailable.
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState({ ...signedOut, status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function restoreSession() {
      const token = readToken();
      if (!token) {
        setSession(signedOut);
        return;
      }

      try {
        const { user } = await getCurrentUser(token, controller.signal);
        if (!controller.signal.aborted) {
          setSession({ status: 'ready', user, token });
        }
      } catch (error) {
        if (controller.signal.aborted) return;

        if (error.status === 401) {
          storeToken(null);
          setSession(signedOut);
        } else {
          setSession({ ...signedOut, status: 'unavailable' });
        }
      }
    }

    restoreSession();
    return () => controller.abort();
  }, [attempt]);

  function signIn({ user, token }) {
    storeToken(token);
    setSession({ status: 'ready', user, token });
  }

  function signOut(reason) {
    storeToken(null);
    setSession({
      ...signedOut,
      passwordChanged: reason === 'password-changed',
    });
  }

  function retry() {
    setSession({ ...signedOut, status: 'loading' });
    setAttempt((current) => current + 1);
  }

  return (
    <AuthContext.Provider value={{ ...session, signIn, signOut, retry }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
