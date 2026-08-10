'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Package, Ship, MapPin, Calendar, ArrowLeft, Weight, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import type { Project, ProjectStatus, CargoItem } from '@/types/wms';

const projectStatusStyles: Record<ProjectStatus, string> = {
  PLANNED: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  RECEIVING: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  IN_STORAGE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  STAGING: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  LOADED: 'bg-yellow-600/10 text-yellow-500 border-yellow-600/20',
  SHIPPED: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  COMPLETED: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
};

const statusTabs: { value: string; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'PLANNED', label: 'Planned' },
  { value: 'RECEIVING', label: 'Receiving' },
  { value: 'IN_STORAGE', label: 'Storage' },
  { value: 'STAGING', label: 'Staging' },
  { value: 'LOADED', label: 'Loaded' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'COMPLETED', label: 'Completed' },
];

const emptyForm = {
  name: '', description: '', clientName: '', clientContact: '',
  destination: '', shippingLine: '', vesselName: '', etd: '', eta: '',
};

interface ProjectListResponse {
  items: Project[];
  total: number;
}

export function ProjectsPage() {
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
    try {
      const res = await fetch(`/api/projects?${params}`);
      const data: ProjectListResponse = await res.json();
      setProjects(data.items);
    } catch {
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          clientName: form.clientName,
          clientContact: form.clientContact || null,
          destination: form.destination || null,
          shippingLine: form.shippingLine || null,
          vesselName: form.vesselName || null,
          etd: form.etd || null,
          eta: form.eta || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create project');
      }
      toast.success('Project created');
      setShowAdd(false);
      setForm(emptyForm);
      fetchProjects();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const openProjectDetail = async (project: Project) => {
 setSelectedProject(project);
    setCargoLoading(true);
    try {
      const res = await fetch(`/api/cargo?projectId=${project.id}&limit=100`);
      const data = await res.json();
      setProjectCargo(data.items || []);
    } catch {
      toast.error('Failed to fetch project cargo');
    } finally {
      setCargoLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Projects</h1>
          <p className="text-sm text-slate-500 mt-1">Track project cargo and shipments</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setShowAdd(true); }}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium">
          <Plus className="h-4 w-4 mr-2" /> Add Project
        </Button>
      </div>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter}>
        <TabsList className="bg-slate-800/50 border border-slate-700/50 h-auto p-1 flex-wrap gap-1">
          {statusTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}
              className="data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-400 text-slate-400 text-xs px-3 py-1.5">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Project Detail View */}
      {selectedProject ? (
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setSelectedProject(null)} className="text-slate-400 hover:text-slate-200 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Projects
          </Button>
          <Card className="border-slate-800 bg-slate-900/50">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">{selectedProject.name}</h2>
                  <p className="text-sm text-slate-400 mt-1">{selectedProject.projectCode}</p>
                </div>
                <Badge variant="outline" className={`self-start ${projectStatusStyles[selectedProject.status]}`}>
                  {selectedProject.status.replace(/_/g, ' ')}
                </Badge>
              </div>
              <Separator className="my-4 bg-slate-800" />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                <div className="flex items-center gap-2 text-slate-400">
                  <Package className="h-4 w-4 text-amber-500" />
                  <span>{selectedProject.totalItems} items</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Weight className="h-4 w-4 text-amber-500" />
                  <span>{selectedProject.totalWeight.toLocaleString()} tonnes</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <MapPin className="h-4 w-4 text-amber-500" />
                  <span className="truncate">{selectedProject.destination || 'TBD'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <Ship className="h-4 w-4 text-amber-500" />
                  <span className="truncate">{selectedProject.vesselName || 'TBD'}</span>
                </div>
              </div>
              {(selectedProject.etd || selectedProject.eta) && (
                <div className="flex gap-4 mt-3 text-xs text-slate-500">
                  {selectedProject.etd && <span>ETD: {new Date(selectedProject.etd).toLocaleDateString()}</span>}
                  {selectedProject.eta && <span>ETA: {new Date(selectedProject.eta).toLocaleDateString()}</span>}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50">
            <CardContent className="p-4">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Cargo Items</h3>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-xs text-slate-500">Code</TableHead>
                      <TableHead className="text-xs text-slate-500">Description</TableHead>
                      <TableHead className="text-xs text-slate-500">Weight (kg)</TableHead>
                      <TableHead className="text-xs text-slate-500">Category</TableHead>
                      <TableHead className="text-xs text-slate-500">Status</TableHead>
                      <TableHead className="text-xs text-slate-500">Location</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cargoLoading
                      ? Array.from({ length: 3 }).map((_, i) => (
                          <TableRow key={i} className="border-slate-800 hover:bg-transparent">
                            {Array.from({ length: 6 }).map((_, j) => (
                              <TableCell key={j} className="py-2"><Skeleton className="h-4 w-16 bg-slate-800" /></TableCell>
                            ))}
                          </TableRow>
                        ))
                      : projectCargo.length === 0
                        ? <TableRow className="border-slate-800 hover:bg-transparent"><TableCell colSpan={6} className="text-center py-6 text-slate-500">No cargo items</TableCell></TableRow>
                        : projectCargo.map((c) => (
                          <TableRow key={c.id} className="border-slate-800 hover:bg-slate-800/50">
                            <TableCell className="py-2 text-xs font-mono text-amber-400/80">{c.cargoCode}</TableCell>
                            <TableCell className="py-2 text-xs text-slate-300 max-w-[200px] truncate">{c.description}</TableCell>
                            <TableCell className="py-2 text-xs text-slate-400">{c.weight.toLocaleString()}</TableCell>
                            <TableCell className="py-2"><Badge variant="outline" className="text-[10px] bg-slate-700/50 text-slate-300 border-slate-600">{c.liftCategory.replace(/_/g, ' ')}</Badge></TableCell>
                            <TableCell className="py-2"><Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">{c.status.replace(/_/g, ' ')}</Badge></TableCell>
                            <TableCell className="py-2 text-xs text-slate-400">{c.location?.code || '—'}</TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Project Cards Grid */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="border-slate-800 bg-slate-900/50">
                  <CardContent className="p-5 space-y-3">
                    <Skeleton className="h-5 w-3/4 bg-slate-800" />
                    <Skeleton className="h-4 w-1/2 bg-slate-800" />
                    <Skeleton className="h-4 w-full bg-slate-800" />
                    <Skeleton className="h-2 w-full bg-slate-800" />
                  </CardContent>
                </Card>
              ))
            : projects.length === 0
              ? <div className="col-span-full text-center py-12 text-slate-500">No projects found</div>
              : projects.map((p) => {
                  const received = p.cargoItems?.filter((c) => c.status === 'RECEIVED' || c.status === 'IN_YARD' || c.status === 'IN_WAREHOUSE' || c.status === 'STAGING').length || 0;
                  const total = p.totalItems || 0;
                  const pct = total > 0 ? Math.round((received / total) * 100) : 0;
                  return (
                    <Card
                      key={p.id}
                      className="border-slate-800 bg-slate-900/50 cursor-pointer hover:border-slate-700 hover:bg-slate-900/80 transition-all duration-200 group"
                      onClick={() => openProjectDetail(p)}
                    >
                      <CardContent className="p-5 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-slate-100 truncate group-hover:text-amber-400 transition-colors">{p.name}</h3>
                            <p className="text-[11px] font-mono text-slate-600 mt-0.5">{p.projectCode}</p>
                          </div>
                          <Badge variant="outline" className={`shrink-0 text-[10px] ${projectStatusStyles[p.status]}`}>
                            {p.status.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                          <div className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-slate-600" />{p.clientName}</div>
                          <div className="flex items-center gap-1.5"><Ship className="h-3 w-3 text-slate-600" />{p.vesselName || 'TBD'}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div><span className="text-slate-600">Items:</span> <span className="text-slate-300 font-medium">{total}</span></div>
                          <div><span className="text-slate-600">Weight:</span> <span className="text-slate-300 font-medium">{p.totalWeight}t</span></div>
                          <div><span className="text-slate-600">Vol:</span> <span className="text-slate-300 font-medium">{p.totalVolume}m³</span></div>
                        </div>
                        {(p.etd || p.eta) && (
                          <div className="flex gap-3 text-[11px] text-slate-500">
                            {p.etd && <span>ETD {new Date(p.etd).toLocaleDateString()}</span>}
                            {p.eta && <span>ETA {new Date(p.eta).toLocaleDateString()}</span>}
                          </div>
                        )}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-slate-500">Progress</span>
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

      {/* Add Project Dialog */}
      <Dialog open={showAdd} onOpenChange={(open) => { if (!open) { setShowAdd(false); setForm(emptyForm); } }}>
        <DialogContent className="border-slate-700 bg-slate-900 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Add New Project</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label className="text-slate-400">Project Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="border-slate-700 bg-slate-800 text-slate-200 mt-1" />
            </div>
            <div>
              <Label className="text-slate-400">Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="border-slate-700 bg-slate-800 text-slate-200 mt-1 min-h-[60px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400">Client Name *</Label>
                <Input value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                  className="border-slate-700 bg-slate-800 text-slate-200 mt-1" />
              </div>
              <div>
                <Label className="text-slate-400">Client Contact</Label>
                <Input value={form.clientContact} onChange={(e) => setForm({ ...form, clientContact: e.target.value })}
                  className="border-slate-700 bg-slate-800 text-slate-200 mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-slate-400">Destination</Label>
              <Input value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })}
                className="border-slate-700 bg-slate-800 text-slate-200 mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400">Shipping Line</Label>
                <Input value={form.shippingLine} onChange={(e) => setForm({ ...form, shippingLine: e.target.value })}
                  className="border-slate-700 bg-slate-800 text-slate-200 mt-1" />
              </div>
              <div>
                <Label className="text-slate-400">Vessel Name</Label>
                <Input value={form.vesselName} onChange={(e) => setForm({ ...form, vesselName: e.target.value })}
                  className="border-slate-700 bg-slate-800 text-slate-200 mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400">ETD</Label>
                <Input type="date" value={form.etd} onChange={(e) => setForm({ ...form, etd: e.target.value })}
                  className="border-slate-700 bg-slate-800 text-slate-200 mt-1" />
              </div>
              <div>
                <Label className="text-slate-400">ETA</Label>
                <Input type="date" value={form.eta} onChange={(e) => setForm({ ...form, eta: e.target.value })}
                  className="border-slate-700 bg-slate-800 text-slate-200 mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setForm(emptyForm); }}
              className="border-slate-700 text-slate-300 hover:bg-slate-800">Cancel</Button>
            <Button onClick={handleCreate} disabled={submitting || !form.name || !form.clientName}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900">
              {submitting ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
