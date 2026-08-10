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
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { Movement, MovementType, CargoItem, Location, Equipment } from '@/types/wms';

const typeStyles: Record<MovementType, string> = {
  RECEIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  MOVE: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  DISPATCH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  INSPECT: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
};

const emptyForm = {
  cargoItemId: '', type: '' as string, fromLocationId: '', toLocationId: '',
  equipmentUsed: '', liftMethod: '', operatorName: '', actualWeight: '',
  remarks: '',
};

interface MovementListResponse {
  items: Movement[];
  total: number;
}

export function MovementsPage() {
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
    const params = new URLSearchParams({
      limit: '100',
      ...(search && { search }),
      ...(typeFilter && { type: typeFilter }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
    });
    try {
      const res = await fetch(`/api/movements?${params}`);
      const data: MovementListResponse = await res.json();
      setMovements(data.items);
    } catch {
      toast.error('Failed to fetch movements');
    } finally {
      setLoading(false);
    }
  }, [search, typeFilter, dateFrom, dateTo]);

  const fetchLookups = useCallback(async () => {
    try {
      const [cargoRes, locRes, eqRes] = await Promise.all([
        fetch('/api/cargo?limit=200'),
        fetch('/api/locations?limit=100'),
        fetch('/api/equipment?limit=100&status=AVAILABLE'),
      ]);
      const cargoData = await cargoRes.json();
      const locData = await locRes.json();
      const eqData = await eqRes.json();
      setCargoItems(cargoData.items || []);
      setLocations(locData.items || []);
      setEquipment(eqData.items || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { fetchMovements(); }, [fetchMovements]);
  useEffect(() => { fetchLookups(); }, [fetchLookups]);

  const handleSubmit = async () => {
    setSubmitting(true);
    const payload: Record<string, unknown> = {
      cargoItemId: form.cargoItemId,
      type: form.type,
      fromLocationId: form.fromLocationId && form.fromLocationId !== 'NONE' ? form.fromLocationId : null,
      toLocationId: form.toLocationId && form.toLocationId !== 'NONE' ? form.toLocationId : null,
      equipmentUsed: form.equipmentUsed && form.equipmentUsed !== 'NONE' ? form.equipmentUsed : null,
      liftMethod: form.liftMethod || null,
      operatorName: form.operatorName || null,
      actualWeight: form.actualWeight ? parseFloat(form.actualWeight) : null,
      remarks: form.remarks || null,
    };

    try {
      const res = await fetch('/api/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to record movement');
      }
      toast.success('Movement recorded');
      setShowAdd(false);
      setForm(emptyForm);
      fetchMovements();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to record movement');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Movements</h1>
          <p className="text-sm text-slate-500 mt-1">Movement log and audit trail</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setShowAdd(true); }}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium">
          <Plus className="h-4 w-4 mr-2" /> Record Movement
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input placeholder="Cargo code..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="border-slate-700 bg-slate-800 pl-9 text-slate-200 placeholder:text-slate-600" />
            </div>
            <Select value={typeFilter || 'ALL'} onValueChange={(v) => setTypeFilter(v === 'ALL' ? '' : v)}>
              <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-300">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-800">
                <SelectItem value="ALL" className="text-slate-300 focus:bg-slate-700">All Types</SelectItem>
                {(['RECEIVE', 'MOVE', 'DISPATCH', 'INSPECT'] as MovementType[]).map((t) => (
                  <SelectItem key={t} value={t} className="text-slate-300 focus:bg-slate-700">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="border-slate-700 bg-slate-800 text-slate-200" />
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="border-slate-700 bg-slate-800 text-slate-200" />
            <Button variant="outline" onClick={() => { setSearch(''); setTypeFilter(''); setDateFrom(''); setDateTo(''); }}
              className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300">
              <Filter className="h-4 w-4 mr-2" /> Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-xs text-slate-500">Ref</TableHead>
                  <TableHead className="text-xs text-slate-500 hidden sm:table-cell">Date/Time</TableHead>
                  <TableHead className="text-xs text-slate-500">Cargo</TableHead>
                  <TableHead className="text-xs text-slate-500">Type</TableHead>
                  <TableHead className="text-xs text-slate-500 hidden md:table-cell">From</TableHead>
                  <TableHead className="text-xs text-slate-500 hidden md:table-cell">To</TableHead>
                  <TableHead className="text-xs text-slate-500 hidden lg:table-cell">Equipment</TableHead>
                  <TableHead className="text-xs text-slate-500 hidden xl:table-cell">Operator</TableHead>
                  <TableHead className="text-xs text-slate-500 hidden lg:table-cell">Weight</TableHead>
                  <TableHead className="text-xs text-slate-500 hidden xl:table-cell">Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <TableRow key={i} className="border-slate-800 hover:bg-transparent">
                        {Array.from({ length: 10 }).map((_, j) => (
                          <TableCell key={j} className="py-3"><Skeleton className="h-4 w-16 bg-slate-800" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  : movements.length === 0
                    ? <TableRow className="border-slate-800 hover:bg-transparent"><TableCell colSpan={10} className="text-center py-8 text-slate-500">No movements found</TableCell></TableRow>
                    : movements.map((m) => (
                      <TableRow key={m.id} className="border-slate-800 hover:bg-slate-800/50">
                        <TableCell className="py-3 text-xs font-mono text-amber-400/80">{m.movementRef}</TableCell>
                        <TableCell className="py-3 text-xs text-slate-400 hidden sm:table-cell">
                          {new Date(m.createdAt).toLocaleDateString()} {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell className="py-3 text-xs font-mono text-slate-300">{m.cargoCode}</TableCell>
                        <TableCell className="py-3">
                          <Badge variant="outline" className={`text-[10px] ${typeStyles[m.type]}`}>{m.type}</Badge>
                        </TableCell>
                        <TableCell className="py-3 text-xs text-slate-400 hidden md:table-cell">{m.fromLocation?.code || '—'}</TableCell>
                        <TableCell className="py-3 text-xs text-slate-400 hidden md:table-cell">{m.toLocation?.code || '—'}</TableCell>
                        <TableCell className="py-3 text-xs text-slate-400 hidden lg:table-cell">{m.equipmentUsed || '—'}</TableCell>
                        <TableCell className="py-3 text-xs text-slate-400 hidden xl:table-cell">{m.operatorName || '—'}</TableCell>
                        <TableCell className="py-3 text-xs text-slate-400 hidden lg:table-cell">{m.actualWeight ? `${m.actualWeight.toLocaleString()} kg` : '—'}</TableCell>
                        <TableCell className="py-3 text-xs text-slate-500 hidden xl:table-cell max-w-[150px] truncate">{m.remarks || '—'}</TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Record Movement Dialog */}
      <Dialog open={showAdd} onOpenChange={(open) => { if (!open) { setShowAdd(false); setForm(emptyForm); } }}>
        <DialogContent className="border-slate-700 bg-slate-900 max-h-[90vh] overflow-y-auto max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Record Movement</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label className="text-slate-400">Cargo Item *</Label>
              <Select value={form.cargoItemId} onValueChange={(v) => setForm({ ...form, cargoItemId: v })}>
                <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200 mt-1">
                  <SelectValue placeholder="Search and select cargo..." />
                </SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-800 max-h-60">
                  {cargoItems.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-slate-200 focus:bg-slate-700">
                      <span className="font-mono text-amber-400">{c.cargoCode}</span> — {c.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400">Movement Type *</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200 mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-800">
                    {(['RECEIVE', 'MOVE', 'DISPATCH', 'INSPECT'] as MovementType[]).map((t) => (
                      <SelectItem key={t} value={t} className="text-slate-200 focus:bg-slate-700">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-400">Lift Method</Label>
                <Input value={form.liftMethod} onChange={(e) => setForm({ ...form, liftMethod: e.target.value })}
                  className="border-slate-700 bg-slate-800 text-slate-200 mt-1" placeholder="e.g. Crane, Forklift" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400">From Location</Label>
                <Select value={form.fromLocationId} onValueChange={(v) => setForm({ ...form, fromLocationId: v })}>
                  <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200 mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-800">
                    <SelectItem value="NONE" className="text-slate-500 focus:bg-slate-700">None</SelectItem>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id} className="text-slate-200 focus:bg-slate-700">{l.code} — {l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-400">To Location</Label>
                <Select value={form.toLocationId} onValueChange={(v) => setForm({ ...form, toLocationId: v })}>
                  <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200 mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-800">
                    <SelectItem value="NONE" className="text-slate-500 focus:bg-slate-700">None</SelectItem>
                    {locations.map((l) => (
                      <SelectItem key={l.id} value={l.id} className="text-slate-200 focus:bg-slate-700">{l.code} — {l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400">Equipment Used</Label>
                <Select value={form.equipmentUsed} onValueChange={(v) => setForm({ ...form, equipmentUsed: v })}>
                  <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200 mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-800">
                    <SelectItem value="NONE" className="text-slate-500 focus:bg-slate-700">None</SelectItem>
                    {equipment.map((eq) => (
                      <SelectItem key={eq.id} value={eq.equipmentCode} className="text-slate-200 focus:bg-slate-700">
                        {eq.equipmentCode} — {eq.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-400">Operator</Label>
                <Input value={form.operatorName} onChange={(e) => setForm({ ...form, operatorName: e.target.value })}
                  className="border-slate-700 bg-slate-800 text-slate-200 mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-slate-400">Actual Weight (kg)</Label>
              <Input type="number" value={form.actualWeight} onChange={(e) => setForm({ ...form, actualWeight: e.target.value })}
                className="border-slate-700 bg-slate-800 text-slate-200 mt-1" />
            </div>
            <div>
              <Label className="text-slate-400">Remarks</Label>
              <Textarea value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                className="border-slate-700 bg-slate-800 text-slate-200 mt-1 min-h-[60px]" placeholder="Optional notes..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setForm(emptyForm); }}
              className="border-slate-700 text-slate-300 hover:bg-slate-800">Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.cargoItemId || !form.type}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900">
              {submitting ? 'Recording...' : 'Record Movement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
