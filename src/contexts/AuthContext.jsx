// src/contexts/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session on load
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn("Session error detected, forcing sign out:", error.message);
        signOut();
      } else {
        setUser(session?.user ?? null);
        if (session) registerSession(session);
      }
      setLoading(false);
    }).catch(err => {
      console.error("Unexpected auth error:", err);
      signOut();
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (session) registerSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- Single Device Enforcement ---
  const registerSession = async (session) => {
    if (!session?.user?.id) return;

    const sessionToken = session.access_token;

    // 1. Register this session as THE active one
    const { error } = await supabase
      .from('user_active_sessions')
      .upsert({
        user_id: session.user.id,
        session_id: sessionToken,
        device_info: 'Desktop Web',
        last_seen: new Date().toISOString()
      });

    if (error) console.error("Failed to register session:", error);

    // 2. Listen for kicks
    const channel = supabase.channel(`session_guard_${session.user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_active_sessions',
          filter: `user_id=eq.${session.user.id}`
        },
        (payload) => {
          const remoteSessionId = payload.new.session_id;
          if (remoteSessionId && remoteSessionId !== sessionToken) {
            console.warn("Session invalidated by another device.");
            alert("Você conectou em outro dispositivo. Esta sessão será encerrada.");
            signOut();
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

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
