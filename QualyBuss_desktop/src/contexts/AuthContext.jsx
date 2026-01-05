// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Auto-Logout Logic (15 min) ---
  useEffect(() => {
    if (!user) return; // Only track if logged in

    const TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
    // const TIMEOUT_MS = 10 * 1000; // Debug: 10 seconds
    let activityTimer;

    const resetTimer = () => {
      if (activityTimer) clearTimeout(activityTimer);
      activityTimer = setTimeout(() => {
        console.warn('Auto-logout triggered due to inactivity.');
        signOut();
      }, TIMEOUT_MS);
    };

    // Events to track activity
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

    // Attach listeners
    events.forEach(event => window.addEventListener(event, resetTimer));

    // Start timer initially
    resetTimer();

    // Cleanup
    return () => {
      if (activityTimer) clearTimeout(activityTimer);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user]); // Re-bind when user changes (login/logout)

  const signOut = () => supabase.auth.signOut();

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthProvider;
