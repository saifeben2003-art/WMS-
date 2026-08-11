'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Pencil, Eye, Trash2, X } from 'lucide-react';
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
import type { CargoItem, LiftCategory, CommodityType, CargoStatus, Location, Project } from '@/types/wms';

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

export function CargoPage() {
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
      page: String(page),
      limit: '10',
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
      toast.error('Failed to fetch cargo items');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, categoryFilter, commodityFilter]);

  const fetchLookups = useCallback(async () => {
    try {
      const [locRes, projRes] = await Promise.all([
        fetch('/api/locations?limit=100'),
        fetch('/api/projects?limit=100'),
      ]);
      const locData = await locRes.json();
      const projData = await projRes.json();
      setLocations(locData.items || []);
      setProjects(projData.items || []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => { fetchCargo(); }, [fetchCargo]);
  useEffect(() => { fetchLookups(); }, [fetchLookups]);
  useEffect(() => { setPage(1); }, [search, statusFilter, categoryFilter, commodityFilter]);

  const handleSubmit = async () => {
    setSubmitting(true);
    const payload: Record<string, unknown> = {
      description: form.description,
      weight: parseFloat(form.weight) || 0,
      length: parseFloat(form.length) || 0,
      width: parseFloat(form.width) || 0,
      height: parseFloat(form.height) || 0,
      liftCategory: form.liftCategory,
      commodityType: form.commodityType,
      specialHandling: form.specialHandling || null,
      clientName: form.clientName || null,
      poReference: form.poReference || null,
      blReference: form.blReference || null,
      centerOfGravity: form.centerOfGravity || null,
      liftingPoints: form.liftingPoints ? parseInt(form.liftingPoints) : null,
      projectId: form.projectId || null,
    };

    try {
      const url = editing ? `/api/cargo/${editing.id}` : '/api/cargo';
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
      toast.success(editing ? 'Cargo updated' : 'Cargo created');
      setShowAdd(false);
      setEditing(null);
      setForm(emptyForm);
      fetchCargo();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      const res = await fetch(`/api/cargo/${deleting.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Cargo deleted');
      setDeleting(null);
      fetchCargo();
    } catch {
      toast.error('Failed to delete cargo');
    }
  };

  const openEdit = (item: CargoItem) => {
    setEditing(item);
    setForm({
      description: item.description,
      weight: String(item.weight),
      length: String(item.length),
      width: String(item.width),
      height: String(item.height),
      liftCategory: item.liftCategory,
      commodityType: item.commodityType,
      specialHandling: item.specialHandling || '',
      clientName: item.clientName || '',
      poReference: item.poReference || '',
      blReference: item.blReference || '',
      centerOfGravity: item.centerOfGravity || '',
      liftingPoints: item.liftingPoints ? String(item.liftingPoints) : '',
      projectId: item.projectId || '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Cargo Items</h1>
          <p className="text-sm text-slate-500 mt-1">Manage all cargo in the warehouse</p>
        </div>
        <Button
          onClick={() => { setForm(emptyForm); setShowAdd(true); }}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Cargo
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search code, description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-slate-700 bg-slate-800 pl-9 text-slate-200 placeholder:text-slate-600"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-300">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-800">
                {['IN_TRANSIT', 'RECEIVED', 'IN_YARD', 'IN_WAREHOUSE', 'DISPATCHED', 'DELIVERED'].map((s) => (
                  <SelectItem key={s} value={s} className="text-slate-300 focus:bg-slate-700 focus:text-slate-100">
                    {s.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-300">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-800">
                {['HEAVY_LIFT', 'OVERSIZE', 'STANDARD', 'PROJECT_CARGO'].map((c) => (
                  <SelectItem key={c} value={c} className="text-slate-300 focus:bg-slate-700 focus:text-slate-100">
                    {c.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={commodityFilter} onValueChange={setCommodityFilter}>
              <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-300">
                <SelectValue placeholder="All Commodities" />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-800">
                {['GENERAL', 'MACHINERY', 'STEEL', 'EQUIPMENT', 'MODULE'].map((c) => (
                  <SelectItem key={c} value={c} className="text-slate-300 focus:bg-slate-700 focus:text-slate-100">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                  <TableHead className="text-xs text-slate-500">Code</TableHead>
                  <TableHead className="text-xs text-slate-500">Description</TableHead>
                  <TableHead className="text-xs text-slate-500 hidden md:table-cell">Weight (kg)</TableHead>
                  <TableHead className="text-xs text-slate-500 hidden lg:table-cell">Dims (L×W×H)</TableHead>
                  <TableHead className="text-xs text-slate-500 hidden sm:table-cell">Category</TableHead>
                  <TableHead className="text-xs text-slate-500">Status</TableHead>
                  <TableHead className="text-xs text-slate-500 hidden lg:table-cell">Location</TableHead>
                  <TableHead className="text-xs text-slate-500 hidden xl:table-cell">Project</TableHead>
                  <TableHead className="text-xs text-slate-500 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-slate-800 hover:bg-transparent">
                        {Array.from({ length: 9 }).map((_, j) => (
                          <TableCell key={j} className="py-3"><Skeleton className="h-4 w-16 bg-slate-800" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  : cargo.length === 0
                    ? (
                      <TableRow className="border-slate-800 hover:bg-transparent">
                        <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                          No cargo items found
                        </TableCell>
                      </TableRow>
                    )
                    : cargo.map((item) => (
                      <TableRow key={item.id} className="border-slate-800 hover:bg-slate-800/50">
                        <TableCell className="py-3 text-xs font-mono font-medium text-amber-400/80">{item.cargoCode}</TableCell>
                        <TableCell className="py-3 text-xs text-slate-300 max-w-[200px] truncate">{item.description}</TableCell>
                        <TableCell className="py-3 text-xs text-slate-400 hidden md:table-cell">{item.weight.toLocaleString()}</TableCell>
                        <TableCell className="py-3 text-xs text-slate-400 hidden lg:table-cell font-mono">
                          {item.length}×{item.width}×{item.height}
                        </TableCell>
                        <TableCell className="py-3 hidden sm:table-cell">
                          <Badge variant="outline" className={`text-[10px] ${categoryStyles[item.liftCategory]}`}>{item.liftCategory.replace(/_/g, ' ')}</Badge>
                        </TableCell>
                        <TableCell className="py-3">
                          <Badge variant="outline" className={`text-[10px] ${statusStyles[item.status]}`}>{item.status.replace(/_/g, ' ')}</Badge>
                        </TableCell>
                        <TableCell className="py-3 text-xs text-slate-400 hidden lg:table-cell">{item.location?.code || '—'}</TableCell>
                        <TableCell className="py-3 text-xs text-slate-400 hidden xl:table-cell max-w-[120px] truncate">{item.project?.name || '—'}</TableCell>
                        <TableCell className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-cyan-400" onClick={() => setViewing(item)}>
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-amber-400" onClick={() => openEdit(item)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-red-400" onClick={() => setDeleting(item)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}
            className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700">
            Previous
          </Button>
          <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}
            className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700">
            Next
          </Button>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showAdd || !!editing} onOpenChange={(open) => { if (!open) { setShowAdd(false); setEditing(null); setForm(emptyForm); } }}>
        <DialogContent className="border-slate-700 bg-slate-900 max-h-[90vh] overflow-y-auto max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-slate-100">{editing ? 'Edit Cargo' : 'Add New Cargo'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label className="text-slate-400">Description *</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="border-slate-700 bg-slate-800 text-slate-200 mt-1" />
            </div>
            <div>
              <Label className="text-slate-400">Weight (kg) *</Label>
              <Input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })}
                className="border-slate-700 bg-slate-800 text-slate-200 mt-1" />
            </div>
            <div>
              <Label className="text-slate-400">Dimensions (m)</Label>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <Input placeholder="L" type="number" value={form.length} onChange={(e) => setForm({ ...form, length: e.target.value })}
                  className="border-slate-700 bg-slate-800 text-slate-200 text-center" />
                <Input placeholder="W" type="number" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })}
                  className="border-slate-700 bg-slate-800 text-slate-200 text-center" />
                <Input placeholder="H" type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })}
                  className="border-slate-700 bg-slate-800 text-slate-200 text-center" />
              </div>
            </div>
            <div>
              <Label className="text-slate-400">Lift Category *</Label>
              <Select value={form.liftCategory} onValueChange={(v) => setForm({ ...form, liftCategory: v })}>
                <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200 mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-800">
                  {(['HEAVY_LIFT', 'OVERSIZE', 'STANDARD', 'PROJECT_CARGO'] as LiftCategory[]).map((c) => (
                    <SelectItem key={c} value={c} className="text-slate-200 focus:bg-slate-700">{c.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-400">Commodity Type *</Label>
              <Select value={form.commodityType} onValueChange={(v) => setForm({ ...form, commodityType: v })}>
                <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200 mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-800">
                  {(['GENERAL', 'MACHINERY', 'STEEL', 'EQUIPMENT', 'MODULE'] as CommodityType[]).map((c) => (
                    <SelectItem key={c} value={c} className="text-slate-200 focus:bg-slate-700">{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-400">Project</Label>
              <Select value={form.projectId} onValueChange={(v) => setForm({ ...form, projectId: v })}>
                <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200 mt-1"><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent className="border-slate-700 bg-slate-800">
                  <SelectItem value="_none" className="text-slate-200 focus:bg-slate-700">None</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-slate-200 focus:bg-slate-700">{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-slate-400">Client Name</Label>
              <Input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                className="border-slate-700 bg-slate-800 text-slate-200 mt-1" />
            </div>
            <div>
              <Label className="text-slate-400">PO Reference</Label>
              <Input value={form.poReference} onChange={(e) => setForm({ ...form, poReference: e.target.value })}
                className="border-slate-700 bg-slate-800 text-slate-200 mt-1" />
            </div>
            <div>
              <Label className="text-slate-400">BL Reference</Label>
              <Input value={form.blReference} onChange={(e) => setForm({ ...form, blReference: e.target.value })}
                className="border-slate-700 bg-slate-800 text-slate-200 mt-1" />
            </div>
            <div>
              <Label className="text-slate-400">Center of Gravity</Label>
              <Input value={form.centerOfGravity} onChange={(e) => setForm({ ...form, centerOfGravity: e.target.value })}
                className="border-slate-700 bg-slate-800 text-slate-200 mt-1" placeholder="e.g. 5.2m from base" />
            </div>
            <div>
              <Label className="text-slate-400">Lifting Points</Label>
              <Input type="number" value={form.liftingPoints} onChange={(e) => setForm({ ...form, liftingPoints: e.target.value })}
                className="border-slate-700 bg-slate-800 text-slate-200 mt-1" placeholder="Number of points" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-slate-400">Special Handling</Label>
              <Textarea value={form.specialHandling} onChange={(e) => setForm({ ...form, specialHandling: e.target.value })}
                className="border-slate-700 bg-slate-800 text-slate-200 mt-1 min-h-[80px]" placeholder="Any special handling requirements..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setEditing(null); setForm(emptyForm); }}
              className="border-slate-700 text-slate-300 hover:bg-slate-800">Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.description || !form.liftCategory || !form.commodityType}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900">
              {submitting ? 'Saving...' : editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={!!viewing} onOpenChange={(open) => { if (!open) setViewing(null); }}>
        <DialogContent className="border-slate-700 bg-slate-900 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Cargo Details — {viewing?.cargoCode}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <div className="sm:col-span-2">
                <span className="text-slate-500">Description:</span>
                <p className="text-slate-200 font-medium mt-0.5">{viewing.description}</p>
              </div>
              <div><span className="text-slate-500">Weight:</span><p className="text-slate-200 mt-0.5">{viewing.weight.toLocaleString()} kg</p></div>
              <div><span className="text-slate-500">Dimensions:</span><p className="text-slate-200 font-mono mt-0.5">{viewing.length}m × {viewing.width}m × {viewing.height}m</p></div>
              <div><span className="text-slate-500">Category:</span><div className="mt-1"><Badge variant="outline" className={`text-[10px] ${categoryStyles[viewing.liftCategory]}`}>{viewing.liftCategory.replace(/_/g, ' ')}</Badge></div></div>
              <div><span className="text-slate-500">Status:</span><div className="mt-1"><Badge variant="outline" className={`text-[10px] ${statusStyles[viewing.status]}`}>{viewing.status.replace(/_/g, ' ')}</Badge></div></div>
              <div><span className="text-slate-500">Location:</span><p className="text-slate-200 mt-0.5">{viewing.location?.name || viewing.location?.code || 'Unassigned'}</p></div>
              <div><span className="text-slate-500">Project:</span><p className="text-slate-200 mt-0.5">{viewing.project?.name || 'None'}</p></div>
              <div><span className="text-slate-500">Commodity:</span><p className="text-slate-200 mt-0.5">{viewing.commodityType}</p></div>
              <div><span className="text-slate-500">Client:</span><p className="text-slate-200 mt-0.5">{viewing.clientName || '—'}</p></div>
              <div><span className="text-slate-500">PO Ref:</span><p className="text-slate-200 mt-0.5">{viewing.poReference || '—'}</p></div>
              <div><span className="text-slate-500">BL Ref:</span><p className="text-slate-200 mt-0.5">{viewing.blReference || '—'}</p></div>
              <div><span className="text-slate-500">Center of Gravity:</span><p className="text-slate-200 mt-0.5">{viewing.centerOfGravity || '—'}</p></div>
              <div><span className="text-slate-500">Lifting Points:</span><p className="text-slate-200 mt-0.5">{viewing.liftingPoints ?? '—'}</p></div>
              {viewing.specialHandling && (
                <div className="sm:col-span-2">
                  <span className="text-slate-500">Special Handling:</span>
                  <p className="text-slate-200 mt-0.5 bg-slate-800 rounded-lg p-3 text-xs">{viewing.specialHandling}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleting} onOpenChange={(open) => { if (!open) setDeleting(null); }}>
        <DialogContent className="border-slate-700 bg-slate-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Confirm Delete</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-400">
            Are you sure you want to delete <span className="text-amber-400 font-medium">{deleting?.cargoCode}</span>? This action cannot be undone.
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
