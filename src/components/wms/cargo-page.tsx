'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Pencil, Eye, Trash2, Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { CargoItem, LiftCategory, CommodityType, CargoStatus, Location, Project } from '@/types/wms';

interface Props {
  t: (key: string, params?: Record<string, string | number>) => string;
  language: string;
  formatNum: (v: number) => string;
}

const statusStyles: Record<CargoStatus, string> = {
  IN_YARD: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  IN_TRANSIT: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  DISPATCHED: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  RECEIVED: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  IN_WAREHOUSE: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  DELIVERED: 'bg-slate-400/10 text-slate-500 border-slate-400/20',
};

const categoryStyles: Record<LiftCategory, string> = {
  HEAVY_LIFT: 'bg-red-500/10 text-red-400 border-red-500/20',
  OVERSIZE: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  STANDARD: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  PROJECT_CARGO: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

interface CargoListResponse {
  items: CargoItem[];
  total: number;
  page: number;
  totalPages: number;
}

const emptyForm = {
  description: '', weight: '', length: '', width: '', height: '',
  liftCategory: '' as string, commodityType: '' as string,
  specialHandling: '', clientName: '', poReference: '', blReference: '',
  centerOfGravity: '', liftingPoints: '', projectId: '',
};

export function CargoPage({ t, formatNum }: Props) {
  const [cargo, setCargo] = useState<CargoItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [commodityFilter, setCommodityFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<CargoItem | null>(null);
  const [viewing, setViewing] = useState<CargoItem | null>(null);
  const [deleting, setDeleting] = useState<CargoItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [locations, setLocations] = useState<Location[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const fetchCargo = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page), limit: '10',
      ...(search && { search }),
      ...(statusFilter && { status: statusFilter }),
      ...(categoryFilter && { liftCategory: categoryFilter }),
      ...(commodityFilter && { commodityType: commodityFilter }),
    });
    try {
      const res = await fetch(`/api/cargo?${params}`);
      const data: CargoListResponse = await res.json();
      setCargo(data.items);
      setTotalPages(data.totalPages);
    } catch {
      toast.error(t('cargo.failedFetch'));
    } finally { setLoading(false); }
  }, [page, search, statusFilter, categoryFilter, commodityFilter]);

  const fetchLookups = useCallback(async () => {
    try {
      const [locRes, projRes] = await Promise.all([
        fetch('/api/locations?limit=100'), fetch('/api/projects?limit=100'),
      ]);
      const locData = await locRes.json();
      const projData = await projRes.json();
      setLocations(locData.items || []);
      setProjects(projData.items || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchCargo(); }, [fetchCargo]);
  useEffect(() => { fetchLookups(); }, [fetchLookups]);
  useEffect(() => { setPage(1); }, [search, statusFilter, categoryFilter, commodityFilter]);

  const handleSubmit = async () => {
    setSubmitting(true);
    const payload: Record<string, unknown> = {
      description: form.description, weight: parseFloat(form.weight) || 0,
      length: parseFloat(form.length) || 0, width: parseFloat(form.width) || 0,
      height: parseFloat(form.height) || 0, liftCategory: form.liftCategory,
      commodityType: form.commodityType, specialHandling: form.specialHandling || null,
      clientName: form.clientName || null, poReference: form.poReference || null,
      blReference: form.blReference || null, centerOfGravity: form.centerOfGravity || null,
      liftingPoints: form.liftingPoints ? parseInt(form.liftingPoints) : null,
      projectId: form.projectId || null,
    };
    try {
      const url = editing ? `/api/cargo/${editing.id}` : '/api/cargo';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || t('cargo.failedSave')); }
      toast.success(editing ? t('cargo.updated') : t('cargo.created'));
      setShowAdd(false); setEditing(null); setForm(emptyForm); fetchCargo();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : t('cargo.failedSave')); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      const res = await fetch(`/api/cargo/${deleting.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(t('cargo.failedDelete'));
      toast.success(t('cargo.deleted')); setDeleting(null); fetchCargo();
    } catch { toast.error(t('cargo.failedDelete')); }
  };

  const openEdit = (item: CargoItem) => {
    setEditing(item);
    setForm({
      description: item.description, weight: String(item.weight), length: String(item.length),
      width: String(item.width), height: String(item.height), liftCategory: item.liftCategory,
      commodityType: item.commodityType, specialHandling: item.specialHandling || '',
      clientName: item.clientName || '', poReference: item.poReference || '',
      blReference: item.blReference || '', centerOfGravity: item.centerOfGravity || '',
      liftingPoints: item.liftingPoints ? String(item.liftingPoints) : '', projectId: item.projectId || '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{t('cargo.title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('cargo.manageAll')}</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setShowAdd(true); }} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium">
          <Plus className="h-4 w-4 mr-2" /> {t('cargo.addCargo')}
        </Button>
      </div>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input placeholder={t('cargo.searchPlaceholder')} value={search} onChange={(e) => setSearch(e.target.value)}
                className="border-slate-700 bg-slate-800 pl-9 text-slate-200 placeholder:text-slate-600" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-300"><SelectValue placeholder={t('cargo.allStatuses')} /></SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-800">
                {(['IN_TRANSIT', 'RECEIVED', 'IN_YARD', 'IN_WAREHOUSE', 'DISPATCHED', 'DELIVERED'] as CargoStatus[]).map((s) => (
                  <SelectItem key={s} value={s} className="text-slate-300 focus:bg-slate-700 focus:text-slate-100">{t(`cargo.status.${s}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-300"><SelectValue placeholder={t('cargo.allCategories')} /></SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-800">
                {(['HEAVY_LIFT', 'OVERSIZE', 'STANDARD', 'PROJECT_CARGO'] as LiftCategory[]).map((c) => (
                  <SelectItem key={c} value={c} className="text-slate-300 focus:bg-slate-700 focus:text-slate-100">{t(`cargo.liftCategory.${c}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={commodityFilter} onValueChange={setCommodityFilter}>
              <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-300"><SelectValue placeholder={t('cargo.allCommodities')} /></SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-800">
                {(['GENERAL', 'MACHINERY', 'STEEL', 'EQUIPMENT', 'MODULE'] as CommodityType[]).map((c) => (
                  <SelectItem key={c} value={c} className="text-slate-300 focus:bg-slate-700 focus:text-slate-100">{t(`cargo.commodityType.${c}`)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-xs text-slate-500 px-4 py-3">{t('cargo.code')}</th>
                  <th className="text-left text-xs text-slate-500 px-4 py-3">{t('cargo.description')}</th>
                  <th className="text-left text-xs text-slate-500 px-4 py-3 hidden md:table-cell">{t('cargo.weight')}</th>
                  <th className="text-left text-xs text-slate-500 px-4 py-3 hidden lg:table-cell">{t('cargo.dims')}</th>
                  <th className="text-left text-xs text-slate-500 px-4 py-3 hidden sm:table-cell">{t('cargo.category')}</th>
                  <th className="text-left text-xs text-slate-500 px-4 py-3">{t('cargo.status')}</th>
                  <th className="text-left text-xs text-slate-500 px-4 py-3 hidden lg:table-cell">{t('cargo.location')}</th>
                  <th className="text-left text-xs text-slate-500 px-4 py-3 hidden xl:table-cell">{t('cargo.project')}</th>
                  <th className="text-right text-xs text-slate-500 px-4 py-3">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-800/50">{Array.from({ length: 9 }).map((_, j) => (
                        <td key={j} className="py-3 px-4"><Skeleton className="h-4 w-16 bg-slate-800" /></td>
                      ))}</tr>
                    ))
                  : cargo.length === 0
                    ? <tr><td colSpan={9} className="py-12"><div className="flex flex-col items-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 mb-4"><Package className="h-7 w-7 text-slate-500" /></div><p className="text-sm font-medium text-slate-400">{t('cargo.emptyState')}</p><p className="text-xs text-slate-600 mt-1">{t('cargo.emptyDesc')}</p></div></td></tr>
                    : cargo.map((item) => (
                      <tr key={item.id} className="border-b border-slate-800/50 hover:bg-slate-800/50">
                        <td className="py-3 px-4 text-xs font-mono font-medium text-amber-400/80">{item.cargoCode}</td>
                        <td className="py-3 px-4 text-xs text-slate-300 max-w-[200px] truncate">{item.description}</td>
                        <td className="py-3 px-4 text-xs text-slate-400 hidden md:table-cell">{formatNum(item.weight)}</td>
                        <td className="py-3 px-4 text-xs text-slate-400 hidden lg:table-cell font-mono">{item.length}×{item.width}×{item.height}</td>
                        <td className="py-3 px-4 hidden sm:table-cell"><Badge variant="outline" className={`text-[10px] ${categoryStyles[item.liftCategory]}`}>{t(`cargo.liftCategory.${item.liftCategory}`)}</Badge></td>
                        <td className="py-3 px-4"><Badge variant="outline" className={`text-[10px] ${statusStyles[item.status]}`}>{t(`cargo.status.${item.status}`)}</Badge></td>
                        <td className="py-3 px-4 text-xs text-slate-400 hidden lg:table-cell">{item.location?.code || '—'}</td>
                        <td className="py-3 px-4 text-xs text-slate-400 hidden xl:table-cell max-w-[120px] truncate">{item.project?.name || '—'}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-cyan-400" onClick={() => setViewing(item)}><Eye className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-amber-400" onClick={() => openEdit(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-red-400" onClick={() => setDeleting(item)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)} className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700">{t('common.previous')}</Button>
          <span className="text-xs text-slate-500">{t('common.pageOf', { current: page, total: totalPages })}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700">{t('common.next')}</Button>
        </div>
      )}

      <Dialog open={showAdd || !!editing} onOpenChange={(open) => { if (!open) { setShowAdd(false); setEditing(null); setForm(emptyForm); } }}>
        <DialogContent className="border-slate-700 bg-slate-900 max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader><DialogTitle className="text-slate-100">{editing ? t('cargo.editCargo') : t('cargo.addNewCargo')}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label className="text-slate-400">{t('cargo.description')} *</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div>
            <div><Label className="text-slate-400">{t('cargo.weight')} *</Label><Input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div>
            <div><Label className="text-slate-400">{t('cargo.dimensions')}</Label><div className="grid grid-cols-3 gap-2 mt-1"><Input placeholder="L" type="number" value={form.length} onChange={(e) => setForm({ ...form, length: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 text-center" /><Input placeholder="W" type="number" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 text-center" /><Input placeholder="H" type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 text-center" /></div></div>
            <div><Label className="text-slate-400">{t('cargo.category')} *</Label><Select value={form.liftCategory} onValueChange={(v) => setForm({ ...form, liftCategory: v })}><SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200 mt-1"><SelectValue placeholder={t('common.selectPlaceholder')} /></SelectTrigger><SelectContent className="border-slate-700 bg-slate-800">{(['HEAVY_LIFT', 'OVERSIZE', 'STANDARD', 'PROJECT_CARGO'] as LiftCategory[]).map((c) => (<SelectItem key={c} value={c} className="text-slate-200 focus:bg-slate-700">{t(`cargo.liftCategory.${c}`)}</SelectItem>))}</SelectContent></Select></div>
            <div><Label className="text-slate-400">Commodity *</Label><Select value={form.commodityType} onValueChange={(v) => setForm({ ...form, commodityType: v })}><SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200 mt-1"><SelectValue placeholder={t('common.selectPlaceholder')} /></SelectTrigger><SelectContent className="border-slate-700 bg-slate-800">{(['GENERAL', 'MACHINERY', 'STEEL', 'EQUIPMENT', 'MODULE'] as CommodityType[]).map((c) => (<SelectItem key={c} value={c} className="text-slate-200 focus:bg-slate-700">{t(`cargo.commodityType.${c}`)}</SelectItem>))}</SelectContent></Select></div>
            <div><Label className="text-slate-400">{t('cargo.project')}</Label><Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}><SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200 mt-1"><SelectValue placeholder={t('common.none')} /></SelectTrigger><SelectContent className="border-slate-700 bg-slate-800"><SelectItem value="_none" className="text-slate-200 focus:bg-slate-700">{t('common.none')}</SelectItem>{projects.map((p) => (<SelectItem key={p.id} value={p.id} className="text-slate-200 focus:bg-slate-700">{p.name}</SelectItem>))}</SelectContent></Select></div>
            <div><Label className="text-slate-400">{t('cargo.client')}</Label><Input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div>
            <div><Label className="text-slate-400">{t('cargo.poRef')}</Label><Input value={form.poReference} onChange={(e) => setForm({ ...form, poReference: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div>
            <div><Label className="text-slate-400">{t('cargo.blRef')}</Label><Input value={form.blReference} onChange={(e) => setForm({ ...form, blReference: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div>
            <div><Label className="text-slate-400">{t('cargo.cog')}</Label><Input value={form.centerOfGravity} onChange={(e) => setForm({ ...form, centerOfGravity: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div>
            <div><Label className="text-slate-400">{t('cargo.liftPoints')}</Label><Input type="number" value={form.liftingPoints} onChange={(e) => setForm({ ...form, liftingPoints: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div>
            <div className="sm:col-span-2"><Label className="text-slate-400">{t('cargo.specialHandling')}</Label><Textarea value={form.specialHandling} onChange={(e) => setForm({ ...form, specialHandling: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1 min-h-[80px]" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setEditing(null); setForm(emptyForm); }} className="border-slate-700 text-slate-300 hover:bg-slate-800">{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.description || !form.liftCategory || !form.commodityType} className="bg-amber-500 hover:bg-amber-600 text-slate-900">{submitting ? t('common.saving') : editing ? t('common.update') : t('common.create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewing} onOpenChange={(open) => { if (!open) setViewing(null); }}>
        <DialogContent className="border-slate-700 bg-slate-900 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-slate-100">{t('cargo.details')} — {viewing?.cargoCode}</DialogTitle></DialogHeader>
          {viewing && (
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div className="sm:col-span-2"><span className="text-slate-500">{t('cargo.description')}:</span><p className="text-slate-200 font-medium mt-0.5">{viewing.description}</p></div>
              <div><span className="text-slate-500">{t('common.weight')}:</span><p className="text-slate-200 mt-0.5">{formatNum(viewing.weight)} kg</p></div>
              <div><span className="text-slate-500">{t('common.dimensions')}:</span><p className="text-slate-200 font-mono mt-0.5">{viewing.length}m × {viewing.width}m × {viewing.height}m</p></div>
              <div><span className="text-slate-500">{t('cargo.category')}:</span><div className="mt-1"><Badge variant="outline" className={`text-[10px] ${categoryStyles[viewing.liftCategory]}`}>{t(`cargo.liftCategory.${viewing.liftCategory}`)}</Badge></div></div>
              <div><span className="text-slate-500">{t('cargo.status')}:</span><div className="mt-1"><Badge variant="outline" className={`text-[10px] ${statusStyles[viewing.status]}`}>{t(`cargo.status.${viewing.status}`)}</Badge></div></div>
              <div><span className="text-slate-500">{t('cargo.location')}:</span><p className="text-slate-200 mt-0.5">{viewing.location?.name || viewing.location?.code || t('cargo.unassigned')}</p></div>
              <div><span className="text-slate-500">{t('cargo.project')}:</span><p className="text-slate-200 mt-0.5">{viewing.project?.name || t('common.none')}</p></div>
              <div><span className="text-slate-500">{t('cargo.commodity')}:</span><p className="text-slate-200 mt-0.5">{t(`cargo.commodityType.${viewing.commodityType}`)}</p></div>
              <div><span className="text-slate-500">{t('cargo.client')}:</span><p className="text-slate-200 mt-0.5">{viewing.clientName || '—'}</p></div>
              <div><span className="text-slate-500">{t('cargo.poRef')}:</span><p className="text-slate-200 mt-0.5">{viewing.poReference || '—'}</p></div>
              <div><span className="text-slate-500">{t('cargo.blRef')}:</span><p className="text-slate-200 mt-0.5">{viewing.blReference || '—'}</p></div>
              <div><span className="text-slate-500">{t('cargo.cog')}:</span><p className="text-slate-200 mt-0.5">{viewing.centerOfGravity || '—'}</p></div>
              <div><span className="text-slate-500">{t('cargo.liftPoints')}:</span><p className="text-slate-200 mt-0.5">{viewing.liftingPoints ?? '—'}</p></div>
              {viewing.specialHandling && (<div className="sm:col-span-2"><span className="text-slate-500">{t('cargo.specialHandling')}:</span><p className="text-slate-200 mt-0.5 bg-slate-800 rounded-lg p-3 text-xs">{viewing.specialHandling}</p></div>)}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
        <DialogContent className="border-slate-700 bg-slate-900 max-w-md">
          <DialogHeader><DialogTitle className="text-slate-100">{t('common.confirmDelete')}</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-400">{t('cargo.confirmDeleteMsg', { code: deleting?.cargoCode || '' })}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} className="border-slate-700 text-slate-300 hover:bg-slate-800">{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} className="bg-red-600 hover:bg-red-700">{t('common.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
