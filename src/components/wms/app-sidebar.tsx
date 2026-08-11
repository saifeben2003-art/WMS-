'use client';

import { useState } from 'react';
import { Box, LayoutDashboard, Package, FolderKanban, MapPin, Wrench, ArrowLeftRight, Plug, Menu, ChevronLeft, ChevronRight, LogOut, User, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { languageList, languageNames, isRTL, t as translate } from '@/lib/i18n';
import type { Language } from '@/lib/i18n';
import type { AuthUser } from './auth-context';
import type { WmsPage } from '@/types/wms';

interface SidebarProps {
  activePage: WmsPage;
  onPageChange: (page: WmsPage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  language: Language;
  user: AuthUser | null;
  onLogout: () => void;
}

interface NavItem {
  page: WmsPage;
  labelKey: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { page: 'dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { page: 'cargo', labelKey: 'nav.cargo', icon: Package },
  { page: 'projects', labelKey: 'nav.projects', icon: FolderKanban },
  { page: 'locations', labelKey: 'nav.locations', icon: MapPin },
  { page: 'equipment', labelKey: 'nav.equipment', icon: Wrench },
  { page: 'movements', labelKey: 'nav.movements', icon: ArrowLeftRight },
  { page: 'integration', labelKey: 'nav.integration', icon: Plug },
];

function NavButton({ item, active, onClick, collapsed, t }: { item: NavItem; active: boolean; onClick: () => void; collapsed: boolean; t: (key: string) => string }) {
  const Icon = item.icon;
  const label = t(item.labelKey);

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg transition-all duration-200',
              active
                ? 'bg-amber-500/15 text-amber-400 shadow-sm shadow-amber-500/10'
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
            )}
          >
            <Icon className="h-5 w-5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="border-slate-700 bg-slate-800 text-slate-200">
          {label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
        active
          ? 'bg-amber-500/15 text-amber-400 shadow-sm shadow-amber-500/10'
          : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="truncate">{label}</span>
      {active && (
        <div className="ml-auto h-1.5 w-1.5 rounded-full bg-amber-400" />
      )}
    </button>
  );
}

function UserMenuSection({ user, t, language, onLogout, onSetLanguage }: {
  user: AuthUser;
  t: (key: string) => string;
  language: Language;
  onLogout: () => void;
  onSetLanguage: (lang: Language) => void;
}) {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const initials = user.name?.charAt(0)?.toUpperCase() || 'U';
  const roleBadge = user.role ? translate(language, `roles.${user.role}`) : '';

  return (
    <div className="border-t border-slate-800 p-3 space-y-2">
      {/* User info + dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-slate-800/60 transition-colors"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-sm font-bold">
            {initials}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-medium text-slate-200 truncate">{user.name}</p>
            {roleBadge && (
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-amber-500/20 text-amber-500/80 bg-amber-500/5 mt-0.5">
                {roleBadge}
              </Badge>
            )}
          </div>
        </button>

        {showUserMenu && (
          <div className="absolute bottom-full left-0 right-0 mb-1 rounded-lg border border-slate-700 bg-slate-800 shadow-xl z-50 overflow-hidden">
            <button
              onClick={() => { setShowUserMenu(false); setShowLangMenu(!showLangMenu); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>{t('common.language')}</span>
              <span className="ml-auto text-slate-500">{languageNames[language]}</span>
            </button>
            <button
              onClick={() => { setShowUserMenu(false); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
            >
              <User className="h-3.5 w-3.5" />
              <span>{t('nav.profile')}</span>
            </button>
            <div className="border-t border-slate-700" />
            <button
              onClick={() => { setShowUserMenu(false); onLogout(); }}
              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>{t('nav.logout')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Language selector dropdown */}
      {showLangMenu && (
        <div className="rounded-lg border border-slate-700 bg-slate-800/95 shadow-xl max-h-60 overflow-y-auto">
          <div className="p-1">
            {languageList.map((l) => (
              <button
                key={l.code}
                onClick={() => { onSetLanguage(l.code); setShowLangMenu(false); }}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors',
                  language === l.code
                    ? 'bg-amber-500/15 text-amber-400'
                    : 'text-slate-300 hover:bg-slate-700'
                )}
              >
                <span className="text-sm">{l.flag}</span>
                <span>{l.name}</span>
                {language === l.code && <span className="ml-auto text-amber-500">✓</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function AppSidebar({ activePage, onPageChange, t, language, user, onLogout }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const rtl = isRTL(language);

  return (
    <>
      {/* Mobile hamburger */}
      <div className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center gap-3 border-b border-slate-800 bg-slate-900 px-4 lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-200">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side={rtl ? 'right' : 'left'} className="w-72 border-slate-800 bg-slate-900 p-0">
            <SheetHeader className="border-b border-slate-800 px-4 py-4">
              <SheetTitle className="flex items-center gap-3 text-left">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/15">
                  <Box className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <span className="text-base font-bold text-slate-100">CL WMS</span>
                  <p className="text-[11px] font-medium text-slate-500">{t('common.warehouseManagement')}</p>
                </div>
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 p-3">
              {navItems.map((item) => (
                <button
                  key={item.page}
                  onClick={() => onPageChange(item.page)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    activePage === item.page
                      ? 'bg-amber-500/15 text-amber-400 shadow-sm shadow-amber-500/10'
                      : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  <span>{t(item.labelKey)}</span>
                </button>
              ))}
            </nav>
            {user && (
              <UserMenuSection
                user={user}
                t={t}
                language={language}
                onLogout={onLogout}
                onSetLanguage={() => {}}
              />
            )}
            <div className="border-t border-slate-800 p-4">
              <p className="text-[11px] text-slate-600 leading-tight">Combi Lift Heavy Lift Operations</p>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <Box className="h-5 w-5 text-amber-400" />
          <span className="text-sm font-bold text-slate-100">CL WMS</span>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 z-30 hidden lg:flex flex-col border-r border-slate-800 bg-slate-900 transition-all duration-300',
          collapsed ? (rtl ? 'right-0 w-[68px]' : 'left-0 w-[68px]') : (rtl ? 'right-0 w-64' : 'left-0 w-64')
        )}
      >
        {/* Logo */}
        <div className="flex h-14 items-center gap-3 border-b border-slate-800 px-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
            <Box className="h-5 w-5 text-amber-400" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="text-base font-bold text-slate-100">CL WMS</span>
              <p className="text-[11px] font-medium text-slate-500">{t('common.warehouseManagement')}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
          {navItems.map((item) => (
            <NavButton
              key={item.page}
              item={item}
              active={activePage === item.page}
              onClick={() => onPageChange(item.page)}
              collapsed={collapsed}
              t={t}
            />
          ))}
        </nav>

        {/* User menu */}
        {user && !collapsed && (
          <UserMenuSection
            user={user}
            t={t}
            language={language}
            onLogout={onLogout}
            onSetLanguage={() => {}}
          />
        )}

        {/* Collapse toggle */}
        <div className="border-t border-slate-800 p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full justify-center text-slate-500 hover:text-slate-300 hover:bg-slate-800"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span className="ml-2 text-xs">{t('common.collapse')}</span>}
          </Button>
        </div>

        {/* Footer */}
        {!collapsed && (
          <div className="border-t border-slate-800 p-4">
            <p className="text-[11px] text-slate-600 leading-tight">Combi Lift Heavy Lift Operations</p>
          </div>
        )}
      </aside>
    </>
  );
}
