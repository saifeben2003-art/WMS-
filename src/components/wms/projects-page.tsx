'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Package, Ship, MapPin, ArrowLeft, Weight, FolderKanban } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { Project, ProjectStatus, CargoItem } from '@/types/wms';

interface Props {
  t: (key: string, params?: Record<string, string | number>) => string;
  language: string;
  formatNum: (v: number) => string;
}

const projectStatusStyles: Record<ProjectStatus, string> = {
  PLANNED: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  RECEIVING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  IN_STORAGE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  STAGING: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  LOADED: 'bg-yellow-600/10 text-yellow-500 border-yellow-600/20',
  SHIPPED: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  COMPLETED: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
};

const statusTabs: { value: string; labelKey: string }[] = [
  { value: '', labelKey: 'projects.all' },
  { value: 'PLANNED', labelKey: 'projects.planned' },
  { value: 'RECEIVING', labelKey: 'projects.receiving' },
  { value: 'IN_STORAGE', labelKey: 'projects.storage' },
  { value: 'STAGING', labelKey: 'projects.staging' },
  { value: 'LOADED', labelKey: 'projects.loaded' },
  { value: 'SHIPPED', labelKey: 'projects.shipped' },
  { value: 'COMPLETED', labelKey: 'projects.completed' },
];

const emptyForm = {
  name: '', description: '', clientName: '', clientContact: '',
  destination: '', shippingLine: '', vesselName: '', etd: '', eta: '',
};

interface ProjectListResponse { items: Project[]; total: number; }

export function ProjectsPage({ t, formatNum }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectCargo, setProjectCargo] = useState<CargoItem[]>([]);
  const [cargoLoading, setCargoLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '100', ...(statusFilter && { status: statusFilter }) });
    try { const res = await fetch(`/api/projects?${params}`); const data: ProjectListResponse = await res.json(); setProjects(data.items); }
    catch { toast.error('Failed to fetch projects'); }
    finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: form.name, description: form.description || null, clientName: form.clientName, clientContact: form.clientContact || null, destination: form.destination || null, shippingLine: form.shippingLine || null, vesselName: form.vesselName || null, etd: form.etd || null, eta: form.eta || null }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed'); }
      toast.success('Project created'); setShowAdd(false); setForm(emptyForm); fetchProjects();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed'); }
    finally { setSubmitting(false); }
  };

  const openProjectDetail = async (project: Project) => {
    setSelectedProject(project); setCargoLoading(true);
    try { const res = await fetch(`/api/cargo?projectId=${project.id}&limit=100`); const data = await res.json(); setProjectCargo(data.items || []); }
    catch { toast.error('Failed to fetch project cargo'); }
    finally { setCargoLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{t('projects.title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('projects.trackProjectCargo')}</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setShowAdd(true); }} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium">
          <Plus className="h-4 w-4 mr-2" /> {t('projects.addProject')}
        </Button>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 h-auto p-1 flex-wrap gap-1">
          {statusTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-400 text-slate-400 text-xs px-3 py-1.5">{t(tab.labelKey)}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {selectedProject ? (
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setSelectedProject(null)} className="text-slate-400 hover:text-slate-200 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> {t('projects.backToProjects')}
          </Button>
          <Card className="border-slate-800 bg-slate-900/50">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div><h2 className="text-lg font-bold text-slate-100">{selectedProject.name}</h2><p className="text-sm text-slate-400 mt-1">{selectedProject.projectCode}</p></div>
                <Badge variant="outline" className={`self-start ${projectStatusStyles[selectedProject.status]}`}>{selectedProject.status.replace(/_/g, ' ')}</Badge>
              </div>
              <Separator className="my-4 bg-slate-800" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                <div className="flex items-center gap-2 text-slate-400"><Package className="h-4 w-4 text-amber-500" /><span>{selectedProject.totalItems} {t('common.items')}</span></div>
                <div className="flex items-center gap-2 text-slate-400"><Weight className="h-4 w-4 text-amber-500" /><span>{formatNum(selectedProject.totalWeight)} {t('projects.tonnes')}</span></div>
                <div className="flex items-center gap-2 text-slate-400"><MapPin className="h-4 w-4 text-amber-500" /><span className="truncate">{selectedProject.destination || 'TBD'}</span></div>
                <div className="flex items-center gap-2 text-slate-400"><Ship className="h-4 w-4 text-amber-500" /><span className="truncate">{selectedProject.vesselName || 'TBD'}</span></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-900/50">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">{t('projects.cargoItems')}</h3>
              <div className="max-h-96 overflow-y-auto">
                {cargoLoading ? <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-8 w-full bg-slate-800" />)}</div> :
                projectCargo.length === 0 ? <div className="flex flex-col items-center py-8"><FolderKanban className="h-8 w-8 text-slate-600 mb-2" /><p className="text-sm text-slate-500">{t('projects.noCargoItems')}</p></div> :
                <table className="w-full"><thead><tr className="border-b border-slate-800"><th className="text-left text-xs text-slate-500 px-3 py-2">{t('cargo.code')}</th><th className="text-left text-xs text-slate-500 px-3 py-2">{t('cargo.description')}</th><th className="text-left text-xs text-slate-500 px-3 py-2">{t('common.weight')}</th><th className="text-left text-xs text-slate-500 px-3 py-2">{t('cargo.category')}</th><th className="text-left text-xs text-slate-500 px-3 py-2">{t('cargo.status')}</th><th className="text-left text-xs text-slate-500 px-3 py-2">{t('cargo.location')}</th></tr></thead><tbody>{projectCargo.map((c) => (<tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-800/50"><td className="py-2 px-3 text-xs font-mono text-amber-400/80">{c.cargoCode}</td><td className="py-2 px-3 text-xs text-slate-300 max-w-[200px] truncate">{c.description}</td><td className="py-2 px-3 text-xs text-slate-400">{formatNum(c.weight)}</td><td className="py-2 px-3"><Badge variant="outline" className="text-[10px] bg-slate-700/50 text-slate-300 border-slate-600">{c.liftCategory.replace(/_/g, ' ')}</Badge></td><td className="py-2 px-3"><Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{c.status.replace(/_/g, ' ')}</Badge></td><td className="py-2 px-3 text-xs text-slate-400">{c.location?.code || '—'}</td></tr>))}</tbody></table>}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? Array.from({ length: 6 }).map((_, i) => (<Card key={i} className="border-slate-800 bg-slate-900/50"><CardContent className="p-5 space-y-3"><Skeleton className="h-5 w-3/4 bg-slate-800" /><Skeleton className="h-4 w-1/2 bg-slate-800" /><Skeleton className="h-4 w-full bg-slate-800" /></CardContent></Card>)) :
          projects.length === 0 ? <div className="col-span-full flex flex-col items-center py-12"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 mb-4"><FolderKanban className="h-7 w-7 text-slate-500" /></div><p className="text-sm font-medium text-slate-400">{t('projects.emptyState')}</p><p className="text-xs text-slate-600 mt-1">{t('projects.emptyDesc')}</p></div> :
          projects.map((p) => {
            const received = p.cargoItems?.filter((c) => ['RECEIVED', 'IN_YARD', 'IN_WAREHOUSE', 'STAGING'].includes(c.status)).length || 0;
            const total = p.totalItems || 0;
            const pct = total > 0 ? Math.round((received / total) * 100) : 0;
            return (
              <Card key={p.id} className="border-slate-800 bg-slate-900/50 cursor-pointer hover:border-slate-700 hover:bg-slate-900/80 transition-all duration-200 group" onClick={() => openProjectDetail(p)}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0"><h3 className="text-sm font-semibold text-slate-100 truncate group-hover:text-amber-400 transition-colors">{p.name}</h3><p className="text-[11px] font-mono text-slate-600 mt-0.5">{p.projectCode}</p></div>
                    <Badge variant="outline" className={`shrink-0 text-[10px] ${projectStatusStyles[p.status]}`}>{p.status.replace(/_/g, ' ')}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                    <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-slate-600" />{p.clientName}</div>
                    <div className="flex items-center gap-1.5"><Ship className="h-3 w-3 text-slate-600" />{p.vesselName || 'TBD'}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div><span className="text-slate-600">{t('common.items')}:</span> <span className="text-slate-300 font-medium">{total}</span></div>
                    <div><span className="text-slate-600">{t('common.weight')}:</span> <span className="text-slate-300 font-medium">{p.totalWeight}t</span></div>
                    <div><span className="text-slate-600">{t('projects.vol')}:</span> <span className="text-slate-300 font-medium">{p.totalVolume}m³</span></div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">{t('common.progress')}</span>
                      <span className="text-slate-400">{received}/{total} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showAdd} onOpenChange={(open) => { if (!open) { setShowAdd(false); setForm(emptyForm); } }}>
        <DialogContent className="border-slate-700 bg-slate-900 max-w-lg">
          <DialogHeader><DialogTitle className="text-slate-100">{t('projects.addNewProject')}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label className="text-slate-400">{t('projects.form.projectName')}</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div>
            <div><Label className="text-slate-400">{t('projects.form.description')}</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1 min-h-[60px]" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-slate-400">{t('projects.form.clientName')}</Label><Input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div>
              <div><Label className="text-slate-400">{t('projects.form.clientContact')}</Label><Input value={form.clientContact} onChange={(e) => setForm({ ...form, clientContact: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div>
            </div>
            <div><Label className="text-slate-400">{t('projects.form.destination')}</Label><Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-slate-400">{t('projects.form.shippingLine')}</Label><Input value={form.shippingLine} onChange={(e) => setForm({ ...form, shippingLine: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div>
              <div><Label className="text-slate-400">{t('projects.form.vesselName')}</Label><Input value={form.vesselName} onChange={(e) => setForm({ ...form, vesselName: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-slate-400">{t('projects.form.etd')}</Label><Input type="date" value={form.etd} onChange={(e) => setForm({ ...form, etd: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div>
              <div><Label className="text-slate-400">{t('projects.form.eta')}</Label><Input type="date" value={form.eta} onChange={(e) => setForm({ ...form, eta: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setForm(emptyForm); }} className="border-slate-700 text-slate-300 hover:bg-slate-800">{t('common.cancel')}</Button>
            <Button onClick={handleCreate} disabled={submitting || !form.name || !form.clientName} className="bg-amber-500 hover:bg-amber-600 text-slate-900">{submitting ? t('projects.creating') : t('projects.createProject')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
