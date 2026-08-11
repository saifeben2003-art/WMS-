'use client';

import { useState } from 'react';
import { useAuth } from './auth-context';
import { t, isRTL, languageList } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff, ArrowRight, Globe, Search, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export function LoginPage({ onSwitchToRegister }: LoginPageProps) {
  const { login, language, setLanguage } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [trackCode, setTrackCode] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackResult, setTrackResult] = useState<Record<string, unknown> | null>(null);
  const [trackError, setTrackError] = useState('');

  const rtl = isRTL(language);

  const handleTrack = async () => {
    if (!trackCode.trim()) return;
    setTrackLoading(true);
    setTrackError('');
    setTrackResult(null);
    try {
      const res = await fetch(`/api/track/${trackCode.trim()}`);
      const data = await res.json();
      if (res.ok) {
        setTrackResult(data.data);
      } else {
        setTrackError(data.error || 'Not found');
      }
    } catch {
      setTrackError('Failed to search');
    } finally {
      setTrackLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : t(language, 'auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0c14] px-4">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 mb-4 shadow-lg shadow-amber-500/20">
            <span className="text-2xl font-black text-white tracking-tighter">CL</span>
          </div>
          <h1 className="text-2xl font-bold text-white">CL WMS</h1>
          <p className="text-sm text-slate-400 mt-1">Heavy Lift & Project Cargo</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-slate-800/60 bg-[#12141f]/90 backdrop-blur-xl p-8 shadow-2xl shadow-black/30">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-white">{t(language, 'auth.welcomeBack')}</h2>
            <p className="text-sm text-slate-400 mt-1">{t(language, 'auth.login')}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400 text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-slate-300">
                {t(language, 'auth.email')}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className={cn(
                  'h-11 bg-slate-900/60 border-slate-700/50 text-white placeholder:text-slate-500',
                  'focus:border-amber-500/50 focus:ring-amber-500/20',
                  rtl && 'text-right'
                )}
                dir={rtl ? 'rtl' : 'ltr'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm text-slate-300">
                {t(language, 'auth.password')}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={cn(
                    'h-11 bg-slate-900/60 border-slate-700/50 text-white placeholder:text-slate-500 pr-10',
                    'focus:border-amber-500/50 focus:ring-amber-500/20',
                    rtl && 'text-right'
                  )}
                  dir={rtl ? 'rtl' : 'ltr'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={cn('absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 transition-colors', rtl ? 'left-3' : 'right-3')}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full h-11 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400',
                'text-white font-semibold rounded-lg shadow-lg shadow-amber-600/20 transition-all',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t(language, 'auth.loginButton')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-400">
              {t(language, 'auth.noAccount')}{' '}
              <button
                onClick={onSwitchToRegister}
                className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
              >
                {t(language, 'auth.register')}
              </button>
            </p>
          </div>
        </div>

        {/* Language Selector */}
        <div className="mt-4 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/60 border border-slate-800/60 px-3 py-1.5">
            <Globe className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-transparent text-sm text-slate-300 outline-none cursor-pointer"
            >
              {languageList.map((l) => (
                <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                  {l.flag} {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Track Cargo — public, no login required */}
        <div className="mt-6 rounded-2xl border border-slate-800/60 bg-[#12141f]/90 backdrop-blur-xl p-6 shadow-2xl shadow-black/30">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-white">{t(language, 'track.title')}</h3>
          </div>
          <div className="flex gap-2">
            <Input
              value={trackCode}
              onChange={(e) => setTrackCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
              placeholder={t(language, 'track.searchPlaceholder')}
              className="h-10 bg-slate-900/60 border-slate-700/50 text-white placeholder:text-slate-500 text-sm focus:border-amber-500/50 focus:ring-amber-500/20"
              dir="ltr"
            />
            <Button
              onClick={handleTrack}
              disabled={trackLoading || !trackCode.trim()}
              variant="outline"
              className="h-10 px-4 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white shrink-0"
            >
              {trackLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {trackError && (
            <p className="mt-3 text-xs text-red-400 text-center">{trackError}</p>
          )}

          {trackResult && (
            <div className="mt-3 rounded-lg bg-slate-800/50 border border-slate-700/50 p-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">{t(language, 'track.cargoCode')}</span>
                <span className="text-slate-200 font-mono">{String(trackResult.cargoCode)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">{t(language, 'track.description')}</span>
                <span className="text-slate-200 text-right max-w-[60%] truncate">{String(trackResult.description)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">{t(language, 'track.status')}</span>
                <span className="text-emerald-400 font-medium">{String(trackResult.status)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">{t(language, 'track.weight')}</span>
                <span className="text-slate-200">{Number(trackResult.weight).toLocaleString()} kg</span>
              </div>
              {trackResult.location && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">{t(language, 'track.location')}</span>
                  <span className="text-slate-200">{(trackResult.location as Record<string, string>).name}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
