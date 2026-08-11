'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  createdAt: string;
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
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguageState] = useState<Language>('en');

  // Initialize language from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && ['ar', 'en', 'fr', 'hi', 'ur', 'ms', 'zh'].includes(saved)) {
        setLanguageState(saved as Language);
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // Ignore
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user as AuthUser);
        // Sync language from user profile
        if (data.user?.language) {
          setLanguageState(data.user.language as Language);
        }
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check auth on mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Login failed');
    }
    const data = await res.json();
    setUser(data.user as AuthUser);
    if (data.user?.language) {
      setLanguageState(data.user.language as Language);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, lang?: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, language: lang || language }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Registration failed');
    }
    const data = await res.json();
    setUser(data.user as AuthUser);
  }, [language]);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, language, setLanguage, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
