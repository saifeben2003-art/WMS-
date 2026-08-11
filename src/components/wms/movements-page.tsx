'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, ArrowLeftRight, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { Movement, MovementType, CargoItem, Location, Equipment } from '@/types/wms';

interface Props {
  t: (key: string, params?: Record<string, string | number>) => string;
  language: string;
  formatNum: (v: number) => string;
}

const typeStyles: Record<MovementType, string> = {
  RECEIVE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  MOVE: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  DISPATCH: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  INSPECT: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
};
const movementTypes: MovementType[] = ['RECEIVE', 'MOVE', 'DISPATCH', 'INSPECT'];

const emptyForm = { cargoItemId: '', type: '' as string, fromLocationId: '', toLocationId: '', equipmentUsed: '', liftMethod: '', operatorName: '', actualWeight: '', remarks: '' };
interface MovementListResponse { items: Movement[]; total: number; }

export function MovementsPage({ t, formatNum }: Props) {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [cargoItems, setCargoItems] = useState<CargoItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '100', ...(search && { search }), ...(typeFilter && { type: typeFilter }), ...(dateFrom && { dateFrom }), ...(dateTo && { dateTo }) });
    try { const res = await fetch(`/api/movements?${params}`); const data: MovementListResponse = await res.json(); setMovements(data.items); }
    catch { toast.error('Failed to fetch movements'); }
    finally { setLoading(false); }
  }, [search, typeFilter, dateFrom, dateTo]);

  const fetchLookups = useCallback(async () => {
    try {
      const [cargoRes, locRes, eqRes] = await Promise.all([fetch('/api/cargo?limit=200'), fetch('/api/locations?limit=100'), fetch('/api/equipment?limit=100&status=AVAILABLE')]);
      const cargoData = await cargoRes.json(); const locData = await locRes.json(); const eqData = await eqRes.json();
      setCargoItems(cargoData.items || []); setLocations(locData.items || []); setEquipment(eqData.items || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchMovements(); }, [fetchMovements]);
  useEffect(() => { fetchLookups(); }, [fetchLookups]);

  const handleSubmit = async () => {
    setSubmitting(true);
    const payload: Record<string, unknown> = { cargoItemId: form.cargoItemId, type: form.type, fromLocationId: form.fromLocationId && form.fromLocationId !== 'NONE' ? form.fromLocationId : null, toLocationId: form.toLocationId && form.toLocationId !== 'NONE' ? form.toLocationId : null, equipmentUsed: form.equipmentUsed && form.equipmentUsed !== 'NONE' ? form.equipmentUsed : null, liftMethod: form.liftMethod || null, operatorName: form.operatorName || null, actualWeight: form.actualWeight ? parseFloat(form.actualWeight) : null, remarks: form.remarks || null };
    try {
      const res = await fetch('/api/movements', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed'); }
      toast.success('Movement recorded'); setShowAdd(false); setForm(emptyForm); fetchMovements();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-slate-100">{t('movements.title')}</h1><p className="text-sm text-slate-500 mt-1">{t('movements.movementLog')}</p></div>
        <Button onClick={() => { setForm(emptyForm); setShowAdd(true); }} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium"><Plus className="h-4 w-4 mr-2" /> {t('movements.recordMovement')}</Button>
      </div>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" /><Input placeholder="Cargo code..." value={search} onChange={(e) => setSearch(e.target.value)} className="border-slate-700 bg-slate-800 pl-9 text-slate-200 placeholder:text-slate-600" /></div>
            <Select value={typeFilter || 'ALL'} onValueChange={(v) => setTypeFilter(v === 'ALL' ? '' : v)}><SelectTrigger className="border-slate-700 bg-slate-800 text-slate-300"><SelectValue placeholder={t('common.allTypes')} /></SelectTrigger><SelectContent className="border-slate-700 bg-slate-800"><SelectItem value="ALL" className="text-slate-300 focus:bg-slate-700">{t('common.allTypes')}</SelectItem>{movementTypes.map((mt) => (<SelectItem key={mt} value={mt} className="text-slate-300 focus:bg-slate-700">{t(`movements.type.${mt}`)}</SelectItem>))}</SelectContent></Select>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border-slate-700 bg-slate-800 text-slate-200" />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border-slate-700 bg-slate-800 text-slate-200" />
            <Button variant="outline" onClick={() => { setSearch(''); setTypeFilter(''); setDateFrom(''); setDateTo(''); }} className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300"><Filter className="h-4 w-4 mr-2" /> {t('common.clear')}</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-800">
                <th className="text-left text-xs text-slate-500 px-4 py-3">{t('dashboard.ref')}</th>
                <th className="text-left text-xs text-slate-500 px-4 py-3 hidden sm:table-cell">{t('common.date')}</th>
                <th className="text-left text-xs text-slate-500 px-4 py-3">{t('nav.cargo')}</th>
                <th className="text-left text-xs text-slate-500 px-4 py-3">{t('common.type')}</th>
                <th className="text-left text-xs text-slate-500 px-4 py-3 hidden md:table-cell">{t('dashboard.from')}</th>
                <th className="text-left text-xs text-slate-500 px-4 py-3 hidden md:table-cell">{t('dashboard.to')}</th>
                <th className="text-left text-xs text-slate-500 px-4 py-3 hidden lg:table-cell">{t('equipment.title')}</th>
                <th className="text-left text-xs text-slate-500 px-4 py-3 hidden xl:table-cell">{t('movements.form.operator')}</th>
                <th className="text-left text-xs text-slate-500 px-4 py-3 hidden lg:table-cell">{t('common.weight')}</th>
                <th className="text-left text-xs text-slate-500 px-4 py-3 hidden xl:table-cell">{t('movements.form.remarks')}</th>
              </tr></thead>
              <tbody>
                {loading ? Array.from({ length: 8 }).map((_, i) => (<tr key={i} className="border-b border-slate-800/50">{Array.from({ length: 10 }).map((_, j) => (<td key={j} className="py-3 px-4"><Skeleton className="h-4 w-16 bg-slate-800" /></td>))}</tr>)) :
                movements.length === 0 ? <tr><td colSpan={10} className="py-12"><div className="flex flex-col items-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 mb-4"><ArrowLeftRight className="h-7 w-7 text-slate-500" /></div><p className="text-sm font-medium text-slate-400">{t('movements.emptyState')}</p><p className="text-xs text-slate-600 mt-1">{t('movements.emptyDesc')}</p></div></td></tr> :
                movements.map((m) => (
                  <tr key={m.id} className="border-b border-slate-800/50 hover:bg-slate-800/50">
                    <td className="py-3 px-4 text-xs font-mono text-amber-400/80">{m.movementRef}</td>
                    <td className="py-3 px-4 text-xs text-slate-400 hidden sm:table-cell">{new Date(m.createdAt).toLocaleDateString()} {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="py-3 px-4 text-xs font-mono text-slate-300">{m.cargoCode}</td>
                    <td className="py-3 px-4"><span className={`text-[10px] px-1.5 py-0.5 rounded border ${typeStyles[m.type] || ''}`}>{t(`movements.type.${m.type}`)}</span></td>
                    <td className="py-3 px-4 text-xs text-slate-400 hidden md:table-cell">{m.fromLocation?.code || '—'}</td>
                    <td className="py-3 px-4 text-xs text-slate-400 hidden md:table-cell">{m.toLocation?.code || '—'}</td>
                    <td className="py-3 px-4 text-xs text-slate-400 hidden lg:table-cell">{m.equipmentUsed || '—'}</td>
                    <td className="py-3 px-4 text-xs text-slate-400 hidden xl:table-cell">{m.operatorName || '—'}</td>
                    <td className="py-3 px-4 text-xs text-slate-400 hidden lg:table-cell">{m.actualWeight ? `${formatNum(m.actualWeight)} kg` : '—'}</td>
                    <td className="py-3 px-4 text-xs text-slate-500 hidden xl:table-cell max-w-[150px] truncate">{m.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={(open) => { if (!open) { setShowAdd(false); setForm(emptyForm); } }}>
        <DialogContent className="border-slate-700 bg-slate-900 max-h-[90vh] overflow-y-auto max-w-lg">
          <DialogHeader><DialogTitle className="text-slate-100">{t('movements.recordMovement')}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div><Label className="text-slate-400">{t('movements.form.cargoItem')} *</Label><Select value={form.cargoItemId} onValueChange={(v) => setForm({ ...form, cargoItemId: v })}><SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200 mt-1"><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent className="border-slate-700 bg-slate-800 max-h-60">{cargoItems.map((c) => (<SelectItem key={c.id} value={c.id} className="text-slate-200 focus:bg-slate-700"><span className="font-mono text-amber-400">{c.cargoCode}</span> — {c.description}</SelectItem>))}</SelectContent></Select></div>
            <div className="grid grid-cols-2 gap-4"><div><Label className="text-slate-400">{t('movements.form.movementType')} *</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200 mt-1"><SelectValue placeholder={t('common.selectPlaceholder')} /></SelectTrigger><SelectContent className="border-slate-700 bg-slate-800">{movementTypes.map((mt) => (<SelectItem key={mt} value={mt} className="text-slate-200 focus:bg-slate-700">{t(`movements.type.${mt}`)}</SelectItem>))}</SelectContent></Select></div><div><Label className="text-slate-400">{t('movements.form.liftMethod')}</Label><Input value={form.liftMethod} onChange={(e) => setForm({ ...form, liftMethod: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div></div>
            <div className="grid grid-cols-2 gap-4"><div><Label className="text-slate-400">{t('movements.form.fromLocation')}</Label><Select value={form.fromLocationId} onValueChange={(v) => setForm({ ...form, fromLocationId: v })}><SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200 mt-1"><SelectValue placeholder={t('common.selectPlaceholder')} /></SelectTrigger><SelectContent className="border-slate-700 bg-slate-800"><SelectItem value="NONE" className="text-slate-500 focus:bg-slate-700">{t('common.none')}</SelectItem>{locations.map((l) => (<SelectItem key={l.id} value={l.id} className="text-slate-200 focus:bg-slate-700">{l.code} — {l.name}</SelectItem>))}</SelectContent></Select></div><div><Label className="text-slate-400">{t('movements.form.toLocation')}</Label><Select value={form.toLocationId} onValueChange={(v) => setForm({ ...form, toLocationId: v })}><SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200 mt-1"><SelectValue placeholder={t('common.selectPlaceholder')} /></SelectTrigger><SelectContent className="border-slate-700 bg-slate-800"><SelectItem value="NONE" className="text-slate-500 focus:bg-slate-700">{t('common.none')}</SelectItem>{locations.map((l) => (<SelectItem key={l.id} value={l.id} className="text-slate-200 focus:bg-slate-700">{l.code} — {l.name}</SelectItem>))}</SelectContent></Select></div></div>
            <div className="grid grid-cols-2 gap-4"><div><Label className="text-slate-400">{t('movements.form.equipmentUsed')}</Label><Select value={form.equipmentUsed} onValueChange={(v) => setForm({ ...form, equipmentUsed: v })}><SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200 mt-1"><SelectValue placeholder={t('common.selectPlaceholder')} /></SelectTrigger><SelectContent className="border-slate-700 bg-slate-800"><SelectItem value="NONE" className="text-slate-500 focus:bg-slate-700">{t('common.none')}</SelectItem>{equipment.map((eq) => (<SelectItem key={eq.id} value={eq.equipmentCode} className="text-slate-200 focus:bg-slate-700">{eq.equipmentCode} — {eq.name}</SelectItem>))}</SelectContent></Select></div><div><Label className="text-slate-400">{t('movements.form.operator')}</Label><Input value={form.operatorName} onChange={(e) => setForm({ ...form, operatorName: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div></div>
            <div><Label className="text-slate-400">{t('movements.form.actualWeight')}</Label><Input type="number" value={form.actualWeight} onChange={(e) => setForm({ ...form, actualWeight: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div>
            <div><Label className="text-slate-400">{t('movements.form.remarks')}</Label><Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1 min-h-[60px]" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setForm(emptyForm); }} className="border-slate-700 text-slate-300 hover:bg-slate-800">{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.cargoItemId || !form.type} className="bg-amber-500 hover:bg-amber-600 text-slate-900">{submitting ? t('common.recording') : t('movements.recordMovement')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
