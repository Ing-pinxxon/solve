import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// ==========================================
// Tipos
// ==========================================

type AuthResult = { error: string | null };

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** true mientras no haya sesión iniciada (modo preview/invitado) */
  isGuest: boolean;
  /** true si Supabase no está configurado (sin env vars) */
  authDisabled: boolean;

  // Acciones
  signInWithEmail: (email: string, password: string) => Promise<AuthResult>;
  signUpWithEmail: (email: string, password: string) => Promise<AuthResult & { needsConfirmation: boolean }>;
  signInWithGoogle: () => Promise<AuthResult>;
  signInWithApple: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;

  // Estado del modal de auth (centralizado para que cualquier gate lo dispare)
  authModalOpen: boolean;
  authModalReason: string | null;
  openAuthModal: (reason?: string) => void;
  closeAuthModal: () => void;
  /** Ejecuta `action` si hay sesión; si no, abre el modal de login. */
  requireAuth: (action: () => void, reason?: string) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Traduce errores comunes de Supabase a mensajes en español.
function translateError(message: string | undefined): string {
  if (!message) return 'Ocurrió un error. Inténtalo de nuevo.';
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (m.includes('user already registered')) return 'Ese correo ya tiene una cuenta. Inicia sesión.';
  if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.';
  if (m.includes('email not confirmed')) return 'Confirma tu correo antes de iniciar sesión.';
  if (m.includes('unable to validate email')) return 'El correo no es válido.';
  if (m.includes('provider is not enabled')) return 'Ese método de inicio de sesión no está habilitado todavía.';
  return message;
}

// ==========================================
// Provider
// ==========================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalReason, setAuthModalReason] = useState<string | null>(null);

  const authDisabled = !supabase;

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined;

  const signInWithEmail = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Autenticación no disponible.' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? translateError(error.message) : null };
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    if (!supabase) return { error: 'Autenticación no disponible.', needsConfirmation: false };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) return { error: translateError(error.message), needsConfirmation: false };
    // Si no hay sesión inmediata, Supabase requiere confirmación por correo.
    const needsConfirmation = !data.session;
    return { error: null, needsConfirmation };
  }, [redirectTo]);

  const signInWithOAuth = useCallback(async (provider: 'google' | 'apple'): Promise<AuthResult> => {
    if (!supabase) return { error: 'Autenticación no disponible.' };
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    return { error: error ? translateError(error.message) : null };
  }, [redirectTo]);

  const signInWithGoogle = useCallback(() => signInWithOAuth('google'), [signInWithOAuth]);
  const signInWithApple = useCallback(() => signInWithOAuth('apple'), [signInWithOAuth]);

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    if (!supabase) return { error: 'Autenticación no disponible.' };
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return { error: error ? translateError(error.message) : null };
  }, [redirectTo]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  const openAuthModal = useCallback((reason?: string) => {
    setAuthModalReason(reason ?? null);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false);
    setAuthModalReason(null);
  }, []);

  const requireAuth = useCallback((action: () => void, reason?: string) => {
    if (user) {
      action();
    } else {
      openAuthModal(reason);
    }
  }, [user, openAuthModal]);

  // Cerrar el modal automáticamente al autenticarse.
  useEffect(() => {
    if (user && authModalOpen) closeAuthModal();
  }, [user, authModalOpen, closeAuthModal]);

  const value: AuthContextValue = {
    user,
    session,
    loading,
    isGuest: !user,
    authDisabled,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    resetPassword,
    signOut,
    authModalOpen,
    authModalReason,
    openAuthModal,
    closeAuthModal,
    requireAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ==========================================
// Hook
// ==========================================

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
}
