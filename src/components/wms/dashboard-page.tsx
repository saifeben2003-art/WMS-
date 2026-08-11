'use client';

import { useEffect, useState } from 'react';
import { Package, Warehouse, FolderKanban, Wrench, Weight, Truck, ArrowLeftRight, TrendingUp, Inbox } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { DashboardStats, Movement } from '@/types/wms';

interface Props {
  t: (key: string, params?: Record<string, string | number>) => string;
  language: string;
  formatNum: (v: number) => string;
}

const statusColors: Record<string, string> = {
  IN_YARD: 'bg-emerald-500',
  IN_WAREHOUSE: 'bg-teal-500',
  IN_TRANSIT: 'bg-amber-500',
  RECEIVED: 'bg-cyan-500',
  DISPATCHED: 'bg-slate-500',
  DELIVERED: 'bg-slate-400',
  STAGING: 'bg-orange-500',
  LOADED: 'bg-yellow-600',
};

const movementTypeColor: Record<string, string> = {
  RECEIVE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  MOVE: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  DISPATCH: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  INSPECT: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
};

function EmptyState({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 mb-4">
        <Icon className="h-7 w-7 text-slate-500" />
      </div>
      <p className="text-sm font-medium text-slate-400">{title}</p>
      <p className="text-xs text-slate-600 mt-1 max-w-[200px]">{description}</p>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, suffix, loading, color = 'text-amber-400', formatNum }: {
  icon: React.ElementType; label: string; value: string | number; suffix?: string; loading: boolean; color?: string; formatNum: (v: number) => string;
}) {
  return (
    <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            {loading ? (
              <>
                <Skeleton className="h-4 w-24 bg-slate-800" />
                <Skeleton className="h-7 w-16 bg-slate-800" />
              </>
            ) : (
              <>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
                <p className="text-2xl font-bold text-slate-100">
                  {typeof value === 'number' ? formatNum(value) : value}
                  {suffix && <span className="text-sm font-medium text-slate-500 ml-1">{suffix}</span>}
                </p>
              </>
            )}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBreakdown({ data, loading, t, formatNum }: { data: { status: string; count: number }[]; loading: boolean; t: (k: string) => string; formatNum: (v: number) => string }) {
  const total = data.reduce((s, d) => s + d.count, 0);
  if (loading) return <Skeleton className="h-8 w-full bg-slate-800" />;
  if (data.length === 0) return <EmptyState icon={Inbox} title={t('common.noData')} description="" />;

  return (
    <Card className="border-slate-800 bg-slate-900/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-slate-300">{t('dashboard.cargoStatusBreakdown')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-800">
          {data.map((item) => (
            <div
              key={item.status}
              className={statusColors[item.status] || 'bg-slate-600'}
              style={{ width: `${total > 0 ? (item.count / total) * 100 : 0}%` }}
              title={`${item.status.replace(/_/g, ' ')}: ${item.count}`}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          {data.map((item) => (
            <div key={item.status} className="flex items-center gap-1.5">
              <div className={`h-2.5 w-2.5 rounded-full ${statusColors[item.status] || 'bg-slate-600'}`} />
              <span className="text-xs text-slate-400">
                {t(`cargo.status.${item.status}`)}{' '}
                <span className="font-semibold text-slate-300">{formatNum(item.count)}</span>
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryCards({ data, loading, t, formatNum }: { data: { category: string; count: number }[]; loading: boolean; t: (k: string) => string; formatNum: (v: number) => string }) {
  const heavyLift = data.find((d) => d.category === 'HEAVY_LIFT')?.count || 0;
  const oversize = data.find((d) => d.category === 'OVERSIZE')?.count || 0;
  const standard = data.find((d) => d.category === 'STANDARD')?.count || 0;
  const projectCargo = data.find((d) => d.category === 'PROJECT_CARGO')?.count || 0;

  const categories = [
    { label: t('dashboard.heavyLift'), count: heavyLift, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
    { label: t('dashboard.oversize'), count: oversize, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { label: t('dashboard.standard'), count: standard, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    { label: t('dashboard.projectCargo'), count: projectCargo, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  ];

  return (
    <Card className="border-slate-800 bg-slate-900/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-slate-300">{t('dashboard.liftCategoryDist')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categories.map((cat) => (
            <div key={cat.label} className={`rounded-lg border ${cat.border} ${cat.bg} p-3 text-center`}>
              {loading ? (
                <Skeleton className="mx-auto mb-1 h-6 w-8 bg-slate-700" />
              ) : (
                <p className={`text-xl font-bold ${cat.color}`}>{formatNum(cat.count)}</p>
              )}
              <p className="text-[11px] font-medium text-slate-400 mt-1">{cat.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RecentMovements({ movements, loading, t, formatNum }: { movements: Movement[]; loading: boolean; t: (k: string) => string; formatNum: (v: number) => string }) {
  if (loading) {
    return (
      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="p-4 space-y-2"><Skeleton className="h-4 w-full bg-slate-800" /><Skeleton className="h-4 w-3/4 bg-slate-800" /></CardContent>
      </Card>
    );
  }
  return (
    <Card className="border-slate-800 bg-slate-900/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-slate-300">{t('dashboard.recentMovements')}</CardTitle>
          <ArrowLeftRight className="h-4 w-4 text-slate-600" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {movements.length === 0 ? (
            <EmptyState icon={ArrowLeftRight} title={t('common.noData')} description="" />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-xs text-slate-500 px-4 py-2">{t('dashboard.ref')}</th>
                  <th className="text-left text-xs text-slate-500 px-4 py-2">{t('nav.cargo')}</th>
                  <th className="text-left text-xs text-slate-500 px-4 py-2">{t('common.type')}</th>
                  <th className="text-left text-xs text-slate-500 px-4 py-2 hidden sm:table-cell">{t('dashboard.from')}</th>
                  <th className="text-left text-xs text-slate-500 px-4 py-2 hidden sm:table-cell">{t('dashboard.to')}</th>
                  <th className="text-left text-xs text-slate-500 px-4 py-2">{t('common.date')}</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id} className="border-b border-slate-800/50 hover:bg-slate-800/50">
                    <td className="py-2 px-4 text-xs font-mono text-slate-400">{m.movementRef}</td>
                    <td className="py-2 px-4 text-xs text-slate-300">{m.cargoCode}</td>
                    <td className="py-2 px-4">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${movementTypeColor[m.type] || ''}`}>{t(`movements.type.${m.type}`)}</span>
                    </td>
                    <td className="py-2 px-4 text-xs text-slate-400 hidden sm:table-cell">{m.fromLocation?.code || '—'}</td>
                    <td className="py-2 px-4 text-xs text-slate-400 hidden sm:table-cell">{m.toLocation?.code || '—'}</td>
                    <td className="py-2 px-4 text-xs text-slate-500">{new Date(m.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectProgress({ projects, loading, t, formatNum }: { projects: { name: string; total: number; received: number; status: string }[]; loading: boolean; t: (k: string) => string; formatNum: (v: number) => string }) {
  if (loading) {
    return (
      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="p-4 space-y-2"><Skeleton className="h-4 w-full bg-slate-800" /><Skeleton className="h-4 w-3/4 bg-slate-800" /></CardContent>
      </Card>
    );
  }
  return (
    <Card className="border-slate-800 bg-slate-900/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-slate-300">{t('dashboard.projectProgress')}</CardTitle>
          <TrendingUp className="h-4 w-4 text-slate-600" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {projects.length === 0 ? (
          <EmptyState icon={FolderKanban} title={t('common.noData')} description="" />
        ) : projects.map((p) => {
          const pct = p.total > 0 ? Math.round((p.received / p.total) * 100) : 0;
          return (
            <div key={p.name} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300 truncate max-w-[200px] sm:max-w-[300px]">{p.name}</span>
                <span className="text-xs text-slate-500 shrink-0 ml-2">{formatNum(p.received)}/{formatNum(p.total)}</span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function DashboardPage({ t, language, formatNum }: Props) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then((r) => r.json())
      .then((data) => { setStats(data.data || data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">{t('dashboard.title')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('dashboard.subtitle')}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard icon={Package} label={t('dashboard.totalCargo')} value={stats?.totalCargo ?? 0} loading={loading} color="text-amber-400" formatNum={formatNum} />
        <KpiCard icon={Warehouse} label={t('dashboard.inYard')} value={(stats?.inYard ?? 0) + (stats?.inWarehouse ?? 0)} loading={loading} color="text-emerald-400" formatNum={formatNum} />
        <KpiCard icon={FolderKanban} label={t('dashboard.activeProjects')} value={stats?.activeProjects ?? 0} loading={loading} color="text-orange-400" formatNum={formatNum} />
        <KpiCard icon={Wrench} label={t('dashboard.equipAvailable')} value={stats?.equipmentAvailable ?? 0} loading={loading} color="text-teal-400" formatNum={formatNum} />
        <KpiCard icon={Weight} label={t('dashboard.totalWeight')} value={stats?.totalWeight ?? 0} suffix="t" loading={loading} color="text-red-400" formatNum={formatNum} />
        <KpiCard icon={Truck} label={t('dashboard.pendingDispatch')} value={stats?.pendingDispatch ?? 0} loading={loading} color="text-yellow-400" formatNum={formatNum} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <StatusBreakdown data={stats?.statusBreakdown ?? []} loading={loading} t={t} formatNum={formatNum} />
        <CategoryCards data={stats?.categoryBreakdown ?? []} loading={loading} t={t} formatNum={formatNum} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <RecentMovements movements={stats?.recentMovements ?? []} loading={loading} t={t} formatNum={formatNum} />
        <ProjectProgress projects={stats?.projectProgress ?? []} loading={loading} t={t} formatNum={formatNum} />
      </div>
    </div>
  );
}
