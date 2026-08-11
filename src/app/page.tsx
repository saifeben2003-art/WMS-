'use client';

import { useState, useEffect, useMemo } from 'react';
import { SessionProvider } from 'next-auth/react';
import { AuthProvider, useAuth } from '@/components/wms/auth-context';
import { LoginPage } from '@/components/wms/login-page';
import { RegisterPage } from '@/components/wms/register-page';
import { AppSidebar } from '@/components/wms/app-sidebar';
import { DashboardPage } from '@/components/wms/dashboard-page';
import { CargoPage } from '@/components/wms/cargo-page';
import { ProjectsPage } from '@/components/wms/projects-page';
import { LocationsPage } from '@/components/wms/locations-page';
import { EquipmentPage } from '@/components/wms/equipment-page';
import { MovementsPage } from '@/components/wms/movements-page';
import { IntegrationPage } from '@/components/wms/integration-page';
import { UsersPage } from '@/components/wms/users-page';
import { t as translate, isRTL, languageNames, languageList } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';
import type { WmsPage } from '@/types/wms';
import { cn } from '@/lib/utils';
import { Globe } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

function getLocale(language: Language): string {
  switch (language) {
    case 'ar': return 'ar-SA';
    default: return 'en-US';
  }
}

function formatNum(value: number, language: Language): string {
  return value.toLocaleString(getLocale(language));
}

function WmsShell() {
  const { user, loading, language, setLanguage, logout } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [activePage, setActivePage] = useState<WmsPage>('dashboard');
  const [seeded, setSeeded] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const scopedT = (key: string, params?: Record<string, string | number>) => translate(language, key, params);
  const rtl = isRTL(language);

  // Run seed immediately on mount (before auth check) so admin user exists
  useEffect(() => {
    let mounted = true;
    fetch('/api/seed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ force: true }) })
      .then(() => { if (mounted) setSeeded(true); })
      .catch(() => { if (mounted) setSeeded(true); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (rtl) {
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      document.documentElement.removeAttribute('dir');
    }
  }, [rtl]);

  const handleLogout = async () => {
    await logout();
    setAuthView('login');
    setActivePage('dashboard');
  };

  const renderPage = () => {
    const props = { t: scopedT, language, formatNum: (v: number) => formatNum(v, language) };
    switch (activePage) {
      case 'dashboard': return <DashboardPage {...props} />;
      case 'cargo': return <CargoPage {...props} />;
      case 'projects': return <ProjectsPage {...props} />;
      case 'locations': return <LocationsPage {...props} />;
      case 'equipment': return <EquipmentPage {...props} />;
      case 'movements': return <MovementsPage {...props} />;
      case 'users': return <UsersPage {...props} />;
      case 'integration': return <IntegrationPage {...props} />;
      default: return <DashboardPage {...props} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0c14]">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate-500">{scopedT('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (authView === 'register') {
      return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onSwitchToRegister={() => setAuthView('register')} />;
  }

  const headerTitles: Record<WmsPage, string> = {
    dashboard: scopedT('nav.dashboard'),
    cargo: scopedT('nav.cargo'),
    projects: scopedT('nav.projects'),
    locations: scopedT('nav.locations'),
    equipment: scopedT('nav.equipment'),
    movements: scopedT('nav.movements'),
    users: scopedT('nav.users'),
    integration: scopedT('nav.integration'),
  };

  return (
    <div className="min-h-screen flex bg-[#0e1019]" dir={rtl ? 'rtl' : 'ltr'}>
      <AppSidebar
        activePage={activePage}
        onPageChange={setActivePage}
        t={scopedT}
        language={language}
        user={user}
        onLogout={handleLogout}
        onSetLanguage={setLanguage}
      />

      <main className={cn('flex-1 min-h-screen transition-all duration-300', rtl ? 'lg:mr-64' : 'lg:ml-64')}>
        <div className="h-14 lg:hidden" />

        <header className="sticky top-0 z-20 border-b border-slate-800/60 bg-[#0e1019]/80 backdrop-blur-md">
          <div className="flex h-14 items-center justify-between px-6">
            <h1 className="text-lg font-semibold text-slate-100">{headerTitles[activePage]}</h1>
            <div className="flex items-center gap-3">
              <Popover open={langOpen} onOpenChange={setLangOpen}>
                <PopoverTrigger asChild>
                  <button className="hidden sm:flex items-center gap-2 rounded-full bg-slate-800/50 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors">
                    <Globe className="h-3.5 w-3.5" />
                    <span>{languageNames[language]}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 border-slate-700 bg-slate-800 p-1" align="end">
                  <div className="space-y-0.5">
                    {languageList.map((l) => (
                      <button key={l.code} onClick={() => { setLanguage(l.code); setLangOpen(false); }}
                        className={cn('flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors', language === l.code ? 'bg-amber-500/15 text-amber-400' : 'text-slate-300 hover:bg-slate-700')}>
                        <span className="text-base">{l.flag}</span>
                        <span>{l.name}</span>
                        {language === l.code && <span className={cn('ml-auto text-amber-500', rtl && 'ml-0 mr-auto')}>✓</span>}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <div className="hidden sm:flex items-center gap-2 rounded-full bg-slate-800/50 px-3 py-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-slate-400">{scopedT('dashboard.systemOnline')}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          {seeded ? (
            <div key={activePage} className="animate-in fade-in duration-200">
              {renderPage()}
            </div>
          ) : (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center">
                <div className="h-8 w-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-slate-400">{scopedT('common.initializing')}</p>
              </div>
            </div>
          )}
        </div>

        <footer className="mt-auto border-t border-slate-800/60 bg-[#0e1019]/80 backdrop-blur-md">
          <div className="flex h-12 items-center justify-between px-6">
            <p className="text-[11px] text-slate-600">CL WMS v1.0 — {languageNames[language]}</p>
            <p className="text-[11px] text-slate-600">Combi Lift © {new Date().getFullYear()}</p>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default function WmsApp() {
  return (
    <SessionProvider>
      <AuthProvider>
        <WmsShell />
      </AuthProvider>
    </SessionProvider>
  );
}
