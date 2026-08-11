'use client';

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import type { Language } from '@/lib/i18n';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string | null;
  language: string;
  isActive: boolean;
  lastLogin?: string | null;
  createdAt?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, language?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'cl-wms-language';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  // Initialize language from localStorage via lazy initializer (SSR-safe, no useEffect+setState)
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en';
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && ['ar', 'en'].includes(saved)) return saved as Language;
    } catch { /* */ }
    return 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* */ }
  }, []);

  // Derive user from session — no setState
  const user: AuthUser | null = useMemo(() => {
    if (status === 'authenticated' && session?.user) {
      return {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        avatar: session.user.image,
        language: (session.user as Record<string, unknown>).language as string || 'en',
        isActive: true,
        lastLogin: (session.user as Record<string, unknown>).lastLogin as string | null,
      };
    }
    return null;
  }, [session, status]);

  const loading = status === 'loading';
  const refreshUser = useCallback(async () => { /* NextAuth JWT auto-refreshes */ }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.error) throw new Error('Invalid email or password');
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, lang?: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, language: lang || language }),
    });
    if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Registration failed'); }
    await signIn('credentials', { email, password, redirect: false });
  }, [language]);

  const logout = useCallback(async () => {
    await signOut({ redirect: false });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, language, setLanguage, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
