'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, AlertTriangle, Wrench } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { Equipment, EquipmentType, EquipmentStatus } from '@/types/wms';

interface Props {
  t: (key: string, params?: Record<string, string | number>) => string;
  language: string;
  formatNum: (v: number) => string;
}

const statusStyles: Record<EquipmentStatus, string> = {
  AVAILABLE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  IN_USE: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  MAINTENANCE: 'bg-red-500/10 text-red-400 border-red-500/20',
  OUT_OF_SERVICE: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};
const typeStyles: Record<EquipmentType, string> = {
  CRANE: 'bg-amber-500/10 text-amber-400 border-amber-500/20', FORKLIFT: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  SPREADER_BAR: 'bg-orange-500/10 text-orange-400 border-orange-500/20', SLING: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  SHACKLE: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', BEAM: 'bg-red-500/10 text-red-400 border-red-500/20',
  JACK: 'bg-slate-400/10 text-slate-300 border-slate-400/20', ROLLER: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};
const eqTypes: EquipmentType[] = ['CRANE', 'FORKLIFT', 'SPREADER_BAR', 'SLING', 'SHACKLE', 'BEAM', 'JACK', 'ROLLER'];
const eqStatuses: EquipmentStatus[] = ['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'OUT_OF_SERVICE'];

const emptyForm = { name: '', type: '' as string, capacity: '', manufacturer: '', model: '', serialNumber: '', status: 'AVAILABLE' as string, currentLocation: '', lastInspection: '', nextInspection: '', certificationId: '', certExpiry: '' };
interface EquipmentListResponse { items: Equipment[]; total: number; }

function isCertExpiringSoon(dateStr: string | null): boolean { if (!dateStr) return false; const diff = new Date(dateStr).getTime() - new Date().getTime(); const days = diff / (1000 * 60 * 60 * 24); return days <= 30 && days >= 0; }
function isCertExpired(dateStr: string | null): boolean { if (!dateStr) return false; return new Date(dateStr) < new Date(); }

export function EquipmentPage({ t, formatNum }: Props) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Equipment | null>(null);
  const [deleting, setDeleting] = useState<Equipment | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '100', ...(typeFilter && { type: typeFilter }), ...(statusFilter && { status: statusFilter }) });
    try { const res = await fetch(`/api/equipment?${params}`); const data: EquipmentListResponse = await res.json(); setEquipment(data.items); }
    catch { toast.error('Failed to fetch equipment'); }
    finally { setLoading(false); }
  }, [typeFilter, statusFilter]);

  useEffect(() => { fetchEquipment(); }, [fetchEquipment]);

  const handleSubmit = async () => {
    setSubmitting(true);
    const payload: Record<string, unknown> = { name: form.name, type: form.type, capacity: form.capacity ? parseFloat(form.capacity) : null, manufacturer: form.manufacturer || null, model: form.model || null, serialNumber: form.serialNumber || null, status: form.status, currentLocation: form.currentLocation || null, lastInspection: form.lastInspection || null, nextInspection: form.nextInspection || null, certificationId: form.certificationId || null, certExpiry: form.certExpiry || null };
    try {
      const url = editing ? `/api/equipment/${editing.id}` : '/api/equipment'; const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed'); }
      toast.success(editing ? 'Equipment updated' : 'Equipment created'); setShowAdd(false); setEditing(null); setForm(emptyForm); fetchEquipment();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try { const res = await fetch(`/api/equipment/${deleting.id}`, { method: 'DELETE' }); if (!res.ok) throw new Error('Failed'); toast.success('Equipment deleted'); setDeleting(null); fetchEquipment(); }
    catch { toast.error('Failed to delete equipment'); }
  };

  const openEdit = (eq: Equipment) => {
    setEditing(eq);
    setForm({ name: eq.name, type: eq.type, capacity: eq.capacity ? String(eq.capacity) : '', manufacturer: eq.manufacturer || '', model: eq.model || '', serialNumber: eq.serialNumber || '', status: eq.status, currentLocation: eq.currentLocation || '', lastInspection: eq.lastInspection ? eq.lastInspection.split('T')[0] : '', nextInspection: eq.nextInspection ? eq.nextInspection.split('T')[0] : '', certificationId: eq.certificationId || '', certExpiry: eq.certExpiry ? eq.certExpiry.split('T')[0] : '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-bold text-slate-100">{t('equipment.title')}</h1><p className="text-sm text-slate-500 mt-1">{t('equipment.manageEquipment')}</p></div>
        <Button onClick={() => { setForm(emptyForm); setShowAdd(true); }} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium"><Plus className="h-4 w-4 mr-2" /> {t('equipment.addEquipment')}</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={typeFilter || 'ALL'} onValueChange={(v) => setTypeFilter(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-44 border-slate-700 bg-slate-900/50 text-slate-300"><SelectValue placeholder={t('common.allTypes')} /></SelectTrigger>
          <SelectContent className="border-slate-700 bg-slate-800">
            <SelectItem value="ALL" className="text-slate-300 focus:bg-slate-700">{t('common.allTypes')}</SelectItem>
            {eqTypes.map((et) => (<SelectItem key={et} value={et} className="text-slate-300 focus:bg-slate-700">{t(`equipment.type.${et}`)}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={statusFilter || 'ALL'} onValueChange={(v) => setStatusFilter(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-44 border-slate-700 bg-slate-900/50 text-slate-300"><SelectValue placeholder={t('common.allStatuses')} /></SelectTrigger>
          <SelectContent className="border-slate-700 bg-slate-800">
            <SelectItem value="ALL" className="text-slate-300 focus:bg-slate-700">{t('common.allStatuses')}</SelectItem>
            {eqStatuses.map((s) => (<SelectItem key={s} value={s} className="text-slate-300 focus:bg-slate-700">{t(`equipment.status.${s}`)}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead><tr className="border-b border-slate-800">
                <th className="text-left text-xs text-slate-500 px-4 py-3">{t('common.code')}</th>
                <th className="text-left text-xs text-slate-500 px-4 py-3">{t('common.name')}</th>
                <th className="text-left text-xs text-slate-500 px-4 py-3 hidden sm:table-cell">{t('common.type')}</th>
                <th className="text-left text-xs text-slate-500 px-4 py-3 hidden md:table-cell">Capacity</th>
                <th className="text-left text-xs text-slate-500 px-4 py-3 hidden lg:table-cell">{t('equipment.form.manufacturer')}</th>
                <th className="text-left text-xs text-slate-500 px-4 py-3">{t('common.status')}</th>
                <th className="text-left text-xs text-slate-500 px-4 py-3 hidden xl:table-cell">{t('cargo.location')}</th>
                <th className="text-left text-xs text-slate-500 px-4 py-3 hidden xl:table-cell">{t('equipment.form.certExpiry')}</th>
                <th className="text-right text-xs text-slate-500 px-4 py-3">{t('common.actions')}</th>
              </tr></thead>
              <tbody>
                {loading ? Array.from({ length: 5 }).map((_, i) => (<tr key={i} className="border-b border-slate-800/50">{Array.from({ length: 9 }).map((_, j) => (<td key={j} className="py-3 px-4"><Skeleton className="h-4 w-16 bg-slate-800" /></td>))}</tr>)) :
                equipment.length === 0 ? <tr><td colSpan={9} className="py-12"><div className="flex flex-col items-center"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 mb-4"><Wrench className="h-7 w-7 text-slate-500" /></div><p className="text-sm font-medium text-slate-400">{t('equipment.emptyState')}</p><p className="text-xs text-slate-600 mt-1">{t('equipment.emptyDesc')}</p></div></td></tr> :
                equipment.map((eq) => (
                  <tr key={eq.id} className="border-b border-slate-800/50 hover:bg-slate-800/50">
                    <td className="py-3 px-4 text-xs font-mono font-medium text-amber-400/80">{eq.equipmentCode}</td>
                    <td className="py-3 px-4 text-xs text-slate-300 font-medium">{eq.name}</td>
                    <td className="py-3 px-4 hidden sm:table-cell"><Badge variant="outline" className={`text-[10px] ${typeStyles[eq.type]}`}>{t(`equipment.type.${eq.type}`)}</Badge></td>
                    <td className="py-3 px-4 text-xs text-slate-400 hidden md:table-cell">{eq.capacity ? `${formatNum(eq.capacity)}t` : '—'}</td>
                    <td className="py-3 px-4 text-xs text-slate-400 hidden lg:table-cell">{eq.manufacturer || '—'}</td>
                    <td className="py-3 px-4"><Badge variant="outline" className={`text-[10px] ${statusStyles[eq.status]}`}>{t(`equipment.status.${eq.status}`)}</Badge></td>
                    <td className="py-3 px-4 text-xs text-slate-400 hidden xl:table-cell">{eq.currentLocation || '—'}</td>
                    <td className="py-3 px-4 hidden xl:table-cell">
                      <div className="flex items-center gap-1.5">
                        {isCertExpired(eq.certExpiry) && (<Tooltip><TooltipTrigger><AlertTriangle className="h-3.5 w-3.5 text-red-400" /></TooltipTrigger><TooltipContent className="bg-red-900 border-red-700 text-red-200">{t('equipment.certExpired')}</TooltipContent></Tooltip>)}
                        {isCertExpiringSoon(eq.certExpiry) && !isCertExpired(eq.certExpiry) && (<Tooltip><TooltipTrigger><AlertTriangle className="h-3.5 w-3.5 text-amber-400" /></TooltipTrigger><TooltipContent className="bg-amber-900 border-amber-700 text-amber-200">{t('equipment.certExpiringSoon')}</TooltipContent></Tooltip>)}
                        <span className="text-xs text-slate-400">{eq.certExpiry ? new Date(eq.certExpiry).toLocaleDateString() : '—'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right"><div className="flex items-center justify-end gap-1"><Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-amber-400" onClick={() => openEdit(eq)}><Pencil className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-red-400" onClick={() => setDeleting(eq)}><Trash2 className="h-3.5 w-3.5" /></Button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showAdd || !!editing} onOpenChange={(open) => { if (!open) { setShowAdd(false); setEditing(null); setForm(emptyForm); } }}>
        <DialogContent className="border-slate-700 bg-slate-900 max-h-[90vh] overflow-y-auto max-w-lg">
          <DialogHeader><DialogTitle className="text-slate-100">{editing ? t('equipment.editEquipment') : t('equipment.addNewEquipment')}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4"><div><Label className="text-slate-400">{t('equipment.form.name')} *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div><div><Label className="text-slate-400">{t('equipment.form.type')} *</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200 mt-1"><SelectValue placeholder={t('common.selectPlaceholder')} /></SelectTrigger><SelectContent className="border-slate-700 bg-slate-800">{eqTypes.map((et) => (<SelectItem key={et} value={et} className="text-slate-200 focus:bg-slate-700">{t(`equipment.type.${et}`)}</SelectItem>))}</SelectContent></Select></div></div>
            <div className="grid grid-cols-2 gap-4"><div><Label className="text-slate-400">{t('equipment.form.capacity')}</Label><Input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div><div><Label className="text-slate-400">{t('equipment.form.status')} *</Label><Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}><SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200 mt-1"><SelectValue /></SelectTrigger><SelectContent className="border-slate-700 bg-slate-800">{eqStatuses.map((s) => (<SelectItem key={s} value={s} className="text-slate-200 focus:bg-slate-700">{t(`equipment.status.${s}`)}</SelectItem>))}</SelectContent></Select></div></div>
            <div className="grid grid-cols-2 gap-4"><div><Label className="text-slate-400">{t('equipment.form.manufacturer')}</Label><Input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div><div><Label className="text-slate-400">{t('equipment.form.model')}</Label><Input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div></div>
            <div className="grid grid-cols-2 gap-4"><div><Label className="text-slate-400">{t('equipment.form.serialNumber')}</Label><Input value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div><div><Label className="text-slate-400">{t('equipment.form.currentLocation')}</Label><Input value={form.currentLocation} onChange={(e) => setForm({ ...form, currentLocation: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div></div>
            <div className="grid grid-cols-2 gap-4"><div><Label className="text-slate-400">{t('equipment.form.lastInspection')}</Label><Input type="date" value={form.lastInspection} onChange={(e) => setForm({ ...form, lastInspection: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div><div><Label className="text-slate-400">{t('equipment.form.nextInspection')}</Label><Input type="date" value={form.nextInspection} onChange={(e) => setForm({ ...form, nextInspection: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div></div>
            <div className="grid grid-cols-2 gap-4"><div><Label className="text-slate-400">{t('equipment.form.certificationId')}</Label><Input value={form.certificationId} onChange={(e) => setForm({ ...form, certificationId: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div><div><Label className="text-slate-400">{t('equipment.form.certExpiry')}</Label><Input type="date" value={form.certExpiry} onChange={(e) => setForm({ ...form, certExpiry: e.target.value })} className="border-slate-700 bg-slate-800 text-slate-200 mt-1" /></div></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setEditing(null); setForm(emptyForm); }} className="border-slate-700 text-slate-300 hover:bg-slate-800">{t('common.cancel')}</Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.name || !form.type} className="bg-amber-500 hover:bg-amber-600 text-slate-900">{submitting ? t('common.saving') : editing ? t('common.update') : t('common.create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
        <DialogContent className="border-slate-700 bg-slate-900 max-w-md">
          <DialogHeader><DialogTitle className="text-slate-100">{t('common.confirmDelete')}</DialogTitle></DialogHeader>
          <p className="text-sm text-slate-400">{t('equipment.confirmDeleteMsg', { code: deleting?.equipmentCode || '' })}</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} className="border-slate-700 text-slate-300 hover:bg-slate-800">{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete} className="bg-red-600 hover:bg-red-700">{t('common.delete')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
