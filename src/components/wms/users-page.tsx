'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Users, Shield, Pencil, UserX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { languageList } from '@/lib/i18n';

interface Props {
  t: (key: string, params?: Record<string, string | number>) => string;
  language: string;
  formatNum: (v: number) => string;
}

interface UserRecord {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string | null;
  language: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
}

interface UserListResponse {
  items: UserRecord[];
  totalPages: number;
}

const ROLES = ['ADMIN', 'SUPERVISOR', 'OPERATOR', 'VIEWER'] as const;

const roleStyles: Record<string, string> = {
  ADMIN: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  SUPERVISOR: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
  OPERATOR: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  VIEWER: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
};

const emptyAddForm = { name: '', email: '', password: '', role: 'VIEWER', language: 'en' };
const emptyEditForm = { name: '', role: 'VIEWER', language: 'en', isActive: true };

export function UsersPage({ t, language }: Props) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [deleteUser, setDeleteUser] = useState<UserRecord | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: '100' });
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    try {
      const res = await fetch(`/api/users?${params}`);
      const data: UserListResponse = await res.json();
      setUsers(data.items);
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleAdd = async () => {
    if (!addForm.name || !addForm.email || !addForm.password) return;
    setAddSubmitting(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      toast.success(t('users.userCreated'));
      setShowAdd(false);
      setAddForm(emptyAddForm);
      fetchUsers();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setAddSubmitting(false);
    }
  };

  const openEdit = (user: UserRecord) => {
    setEditUser(user);
    setEditForm({ name: user.name, role: user.role, language: user.language, isActive: user.isActive });
  };

  const handleEdit = async () => {
    if (!editUser) return;
    setEditSubmitting(true);
    try {
      const res = await fetch(`/api/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      toast.success(t('users.userUpdated'));
      setEditUser(null);
      setEditForm(emptyEditForm);
      fetchUsers();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!deleteUser) return;
    setDeleteSubmitting(true);
    try {
      const res = await fetch(`/api/users/${deleteUser.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed');
      }
      toast.success(t('users.userDeactivated'));
      setDeleteUser(null);
      fetchUsers();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">{t('users.title')}</h1>
          <p className="text-sm text-slate-500 mt-1">{t('users.subtitle')}</p>
        </div>
        <Button onClick={() => { setAddForm(emptyAddForm); setShowAdd(true); }} className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-medium">
          <Plus className="h-4 w-4 mr-2" />
          {t('users.addUser')}
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder={t('users.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-slate-700 bg-slate-800 pl-9 text-slate-200 placeholder:text-slate-600"
              />
            </div>
            <Select value={roleFilter || 'ALL'} onValueChange={(v) => setRoleFilter(v === 'ALL' ? '' : v)}>
              <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-slate-700 bg-slate-800">
                <SelectItem value="ALL" className="text-slate-300 focus:bg-slate-700">{t('users.allRoles')}</SelectItem>
                {ROLES.map((role) => (
                  <SelectItem key={role} value={role} className="text-slate-300 focus:bg-slate-700">
                    {t(`roles.${role}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setSearch(''); setRoleFilter(''); }} className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300 sm:col-span-2 lg:col-span-1">
              {t('common.clear')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-slate-800 bg-slate-900/50">
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left text-xs text-slate-500 px-4 py-3">{t('users.name')}</th>
                  <th className="text-left text-xs text-slate-500 px-4 py-3 hidden sm:table-cell">{t('users.email')}</th>
                  <th className="text-left text-xs text-slate-500 px-4 py-3">{t('users.role')}</th>
                  <th className="text-left text-xs text-slate-500 px-4 py-3 hidden md:table-cell">{t('users.language')}</th>
                  <th className="text-left text-xs text-slate-500 px-4 py-3 hidden md:table-cell">{t('users.status')}</th>
                  <th className="text-left text-xs text-slate-500 px-4 py-3 hidden lg:table-cell">{t('users.lastLogin')}</th>
                  <th className="text-left text-xs text-slate-500 px-4 py-3 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i} className="border-b border-slate-800/50">
                      {Array.from({ length: 7 }).map((_, j) => (
                        <td key={j} className="py-3 px-4">
                          <Skeleton className="h-4 w-16 bg-slate-800" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12">
                      <div className="flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 mb-4">
                          <Users className="h-7 w-7 text-slate-500" />
                        </div>
                        <p className="text-sm font-medium text-slate-400">{t('users.emptyTitle')}</p>
                        <p className="text-xs text-slate-600 mt-1">{t('users.emptyDesc')}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="border-b border-slate-800/50 hover:bg-slate-800/50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold">
                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <span className="text-sm text-slate-200 truncate max-w-[120px]">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400 hidden sm:table-cell">{user.email}</td>
                      <td className="py-3 px-4">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${roleStyles[user.role] || roleStyles.VIEWER}`}>
                          {t(`roles.${user.role}`)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-400 hidden md:table-cell">
                        {languageList.find((l) => l.code === user.language)?.name || user.language}
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${
                            user.isActive
                              ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10'
                              : 'border-red-500/20 text-red-400 bg-red-500/10'
                          }`}
                        >
                          <span className={`inline-block h-1.5 w-1.5 rounded-full mr-1 ${user.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          {user.isActive ? t('users.active') : t('users.inactive')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-500 hidden lg:table-cell">
                        {user.lastLogin
                          ? `${new Date(user.lastLogin).toLocaleDateString()} ${new Date(user.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(user)} className="h-8 w-8 text-slate-400 hover:text-slate-200 hover:bg-slate-700">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {user.isActive && (
                            <Button variant="ghost" size="icon" onClick={() => setDeleteUser(user)} className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10">
                              <UserX className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={showAdd} onOpenChange={(open) => { if (!open) { setShowAdd(false); setAddForm(emptyAddForm); } }}>
        <DialogContent className="border-slate-700 bg-slate-900 max-h-[90vh] overflow-y-auto max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-100">{t('users.addUser')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label className="text-slate-400">{t('users.name')} *</Label>
              <Input
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                className="border-slate-700 bg-slate-800 text-slate-200 mt-1"
                placeholder={t('users.name')}
              />
            </div>
            <div>
              <Label className="text-slate-400">{t('users.email')} *</Label>
              <Input
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                className="border-slate-700 bg-slate-800 text-slate-200 mt-1"
                placeholder={t('users.email')}
              />
            </div>
            <div>
              <Label className="text-slate-400">{t('users.password')} *</Label>
              <Input
                type="password"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                className="border-slate-700 bg-slate-800 text-slate-200 mt-1"
                placeholder={t('users.password')}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400">{t('users.role')}</Label>
                <Select value={addForm.role} onValueChange={(v) => setAddForm({ ...addForm, role: v })}>
                  <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-800">
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role} className="text-slate-200 focus:bg-slate-700">
                        {t(`roles.${role}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-400">{t('users.language')}</Label>
                <Select value={addForm.language} onValueChange={(v) => setAddForm({ ...addForm, language: v })}>
                  <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-800">
                    {languageList.map((l) => (
                      <SelectItem key={l.code} value={l.code} className="text-slate-200 focus:bg-slate-700">
                        {l.flag} {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setAddForm(emptyAddForm); }} className="border-slate-700 text-slate-300 hover:bg-slate-800">
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleAdd}
              disabled={addSubmitting || !addForm.name || !addForm.email || !addForm.password}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900"
            >
              {addSubmitting ? t('common.saving') : t('common.add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) { setEditUser(null); setEditForm(emptyEditForm); } }}>
        <DialogContent className="border-slate-700 bg-slate-900 max-h-[90vh] overflow-y-auto max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-100">{t('users.editUser')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label className="text-slate-400">{t('users.name')}</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="border-slate-700 bg-slate-800 text-slate-200 mt-1"
              />
            </div>
            <div>
              <Label className="text-slate-400">{t('users.email')}</Label>
              <Input
                value={editUser?.email || ''}
                disabled
                className="border-slate-700 bg-slate-800/60 text-slate-500 mt-1 cursor-not-allowed"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-400">{t('users.role')}</Label>
                <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                  <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-800">
                    {ROLES.map((role) => (
                      <SelectItem key={role} value={role} className="text-slate-200 focus:bg-slate-700">
                        {t(`roles.${role}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-400">{t('users.language')}</Label>
                <Select value={editForm.language} onValueChange={(v) => setEditForm({ ...editForm, language: v })}>
                  <SelectTrigger className="border-slate-700 bg-slate-800 text-slate-200 mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-slate-700 bg-slate-800">
                    {languageList.map((l) => (
                      <SelectItem key={l.code} value={l.code} className="text-slate-200 focus:bg-slate-700">
                        {l.flag} {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-slate-700 p-3">
              <Label className="text-slate-400">{t('users.status')}</Label>
              <button
                type="button"
                onClick={() => setEditForm({ ...editForm, isActive: !editForm.isActive })}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                  editForm.isActive ? 'bg-emerald-500' : 'bg-slate-600'
                }`}
              >
                <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform duration-200 ${editForm.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditUser(null); setEditForm(emptyEditForm); }} className="border-slate-700 text-slate-300 hover:bg-slate-800">
              {t('common.cancel')}
            </Button>
            <Button onClick={handleEdit} disabled={editSubmitting || !editForm.name} className="bg-amber-500 hover:bg-amber-600 text-slate-900">
              {editSubmitting ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <Dialog open={!!deleteUser} onOpenChange={(open) => { if (!open) setDeleteUser(null); }}>
        <DialogContent className="border-slate-700 bg-slate-900 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-100">{t('users.deleteUser')}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {t('users.deactivateConfirm')}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                <UserX className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-200">{deleteUser?.name}</p>
                <p className="text-xs text-slate-500">{deleteUser?.email}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-2">{t('users.deactivateNote')}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)} className="border-slate-700 text-slate-300 hover:bg-slate-800">
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleDeactivate}
              disabled={deleteSubmitting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleteSubmitting ? t('common.saving') : t('users.deactivate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
