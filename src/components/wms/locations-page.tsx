'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Pencil, Trash2, MapPin, Layers, Maximize, Weight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { Location, LocationType } from '@/types/wms';

const typeStyles: Record<LocationType, string> = {
  YARD: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  WAREHOUSE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  OPEN_AREA: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  STAGING: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  BERTH: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

const emptyForm = {
  code: '', name: '', type: '' as string, zone: '',
  maxWeight: '', maxDimension: '', area: '', isActive: true,
};

interface LocationListResponse {
  items: Location[];
  total: number;
}

export function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Location | null>(null);
  const [deleting, setDeleting] = useState<Location | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '100', ...(typeFilter && { type: typeFilter }) });
    try {
      const res = await fetch(`/api/locations?${params}`);
      const data: LocationListResponse = await res.json();
      setLocations(data.items);
    } catch {
      toast.error('Failed to fetch locations');
    } finally {
      setLoading(false);
    }
  }, [typeFilter]);

  useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const handleSubmit = async () => {
    setSubmitting(true);
    const payload: Record<string, unknown> = {
      code: form.code,
      name: form.name,
      type: form.type,
      zone: form.zone || null,
      maxWeight: form.maxWeight ? parseFloat(form.maxWeight) : null,
      maxDimension: form.maxDimension || null,
      area: form.area ? parseFloat(form.area) : null,
      isActive: form.isActive,
    };

    try {
      const url = editing ? `/api/locations/${editing.id}` : '/api/locations';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save');
      }
      toast.success(editing ? 'Location updated' : 'Location created');
      setShowAdd(false);
      setEditing(null);
      setForm(emptyForm);
      fetchLocations();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      const res = await fetch(`/api/locations/${deleting.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to delete');
      }
      toast.success('Location deleted');
      setDeleting(null);
      fetchLocations();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete location');
    }
  };

  const openEdit = (loc: Location) => {
    setEditing(loc);
    setForm({
      code: loc.code, name: loc.name, type: loc.type, zone: loc.zone || '',
      maxWeight: loc.maxWeight ? String(loc.maxWeight) : '',
      maxDimension: loc.maxDimension || '',
      area: loc.area ? String(loc.area) : '',
      isActive: loc.isActive,
    });
  };

  const loadPct = (loc: Location) => {
    if (!loc.maxWeight || loc.maxWeight === 0) return 0;
    return Math.min(100, Math.round((loc.currentLoad / loc.maxWeight) * 100));
  };

  const loadColor = (pct: number) => {
    if (pct >= 90) return 'bg-red-500';
    if (pct >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Locations</h1>
          <p className="text-sm text-slate-500 mt-1">Manage warehouse and yard locations</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setShowAdd(true); }}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium">
          <Plus className="h-4 w-4 mr-2" /> Add Location
        </Button>
      </div>

      {/* Type Filter */}
      <div className="flex flex-wrap gap-2">
        {['', 'YARD', 'WAREHOUSE', 'OPEN_AREA', 'STAGING', 'BERTH'].map((t) => (
          <Button
            key={t}
            variant={typeFilter === t ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTypeFilter(t)}
            className={
              typeFilter === t
                ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                : 'border-slate-700 bg-slate-900/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
            }
          >
            {t ? t.replace(/_/g, ' ') : 'All Types'}
          </Button>
        ))}
      </div>

      {/* Location Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="border-slate-800 bg-slate-900/50">
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-5 w-2/3 bg-slate-800" />
                  <Skeleton className="h-4 w-1/2 bg-slate-800" />
                  <Skeleton className="h-2 w-full bg-slate-800" />
                </CardContent>
              </Card>
            ))
          : locations.length === 0
            ? <div className="col-span-full text-center py-12 text-slate-500">No locations found</div>
            : locations.map((loc) => {
                const pct = loadPct(loc);
                return (
                  <Card key={loc.id} className={`border-slate-800 bg-slate-900/50 transition-all duration-200 ${!loc.isActive ? 'opacity-50' : ''}`}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-slate-100 truncate">{loc.name}</h3>
                          <p className="text-[11px] font-mono text-slate-600 mt-0.5">{loc.code}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-amber-400" onClick={() => openEdit(loc)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-red-400" onClick={() => setDeleting(loc)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${typeStyles[loc.type]}`}>{loc.type.replace(/_/g, ' ')}</Badge>
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                        {loc.zone && <div className="flex items-center gap-1.5"><Layers className="h-3 w-3 text-slate-600" />{loc.zone}</div>}
                        {loc.maxWeight && <div className="flex items-center gap-1.5"><Weight className="h-3 w-3 text-slate-600" />{loc.maxWeight}t</div>}
                        {loc.area && <div className="flex items-center gap-1.5"><Maximize className="h-3 w-3 text-slate-600" />{loc.area}m²</div>}
                        <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-slate-600" />{loc.currentLoad} items</div>
                      </div>
                      {loc.maxWeight && loc.maxWeight > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500">Load</span>
                            <span className={`font-medium ${pct >= 90 ? 'text-red-400' : pct >= 70 ? 'text-amber-400' : 'text-slate-400'}`}>{pct}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                            <div className={`h-full rounded-full ${loadColor(pct)} transition-all`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <div className={`h-1.5 w-1.5 rounded-full ${loc.isActive ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                        <span className="text-[11px] text-slate-500">{loc.isActive ? 'Active' : 'Inactive'}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAdd || !!editing} onOpenChange={(open) => { if (!open) { setShowAdd(false); setEditing(null); setForm(emptyForm); } }}>
        <DialogContent className="border-slate-700 bg-slate-900 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-100">{editing ? 'Edit Location' : 'Add New Location'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400">Code *</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="border-slate-700 bg-slate-800 text-slate-200 mt-1" />
              </div>
              <div>
                <Label className="text-slate-400">Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="border-slate-700 bg-slate-800 text-slate-200 mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400">Type *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200 mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-800">
                    {(['YARD', 'WAREHOUSE', 'OPEN_AREA', 'STAGING', 'BERTH'] as LocationType[]).map((t) => (
                      <SelectItem key={t} value={t} className="text-slate-200 focus:bg-slate-700">{t.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-400">Zone</Label>
                <Input value={form.zone} onChange={(e) => setForm({ ...form, zone: e.target.value })}
                  className="border-slate-700 bg-slate-800 text-slate-200 mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-slate-400">Max Weight (t)</Label>
                <Input type="number" value={form.maxWeight} onChange={(e) => setForm({ ...form, maxWeight: e.target.value })}
                  className="border-slate-700 bg-slate-800 text-slate-200 mt-1" />
              </div>
              <div>
                <Label className="text-slate-400">Max Dimension</Label>
                <Input value={form.maxDimension} onChange={(e) => setForm({ ...form, maxDimension: e.target.value })}
                  className="border-slate-700 bg-slate-800 text-slate-200 mt-1" placeholder="e.g. 50×30×25" />
              </div>
              <div>
                <Label className="text-slate-400">Area (m²)</Label>
                <Input type="number" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })}
                  className="border-slate-700 bg-slate-800 text-slate-200 mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
              <Label className="text-slate-400">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setEditing(null); setForm(emptyForm); }}
              className="border-slate-700 text-slate-300 hover:bg-slate-800">Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.code || !form.name || !form.type}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900">
              {submitting ? 'Saving...' : editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
        <DialogContent className="border-slate-700 bg-slate-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-400">
            Delete location <span className="text-amber-400 font-medium">{deleting?.code}</span>? Locations with cargo items cannot be deleted.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} className="border-slate-700 text-slate-300 hover:bg-slate-800">Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
