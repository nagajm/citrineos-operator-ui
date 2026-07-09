'use client';

import { useEffect, useState } from 'react';
import { Button } from '@lib/client/components/ui/button';
import { Card, CardContent } from '@lib/client/components/ui/card';
import { Badge } from '@lib/client/components/ui/badge';
import { Input } from '@lib/client/components/ui/input';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { Plus, Pencil, Trash2, UserCheck, UserX } from 'lucide-react';
import type { CrmUser } from '@lib/zappo/crm-types';

const AVATAR_COLORS = [
  '#00C896', '#6366F1', '#F59E0B', '#EF4444',
  '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6',
];

const ROLES: { value: string; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin',       label: 'Admin' },
  { value: 'ops',         label: 'Operations' },
  { value: 'sales',       label: 'Sales' },
];

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function Avatar({ name, color, size = 'md' }: { name: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'sm' ? 'w-6 h-6 text-[10px]' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-9 h-9 text-sm';
  return (
    <span style={{ background: color }} className={`${sz} rounded-full flex items-center justify-center font-bold text-black shrink-0`}>
      {initials(name || '?')}
    </span>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground">Color:</span>
      {AVATAR_COLORS.map((c) => (
        <button key={c} type="button" style={{ background: c }}
          className={`w-6 h-6 rounded-full transition-transform ${value === c ? 'ring-2 ring-offset-1 ring-foreground scale-110' : 'hover:scale-105'}`}
          onClick={() => onChange(c)} />
      ))}
    </div>
  );
}

interface UserForm { name: string; email: string; password: string; role: string; avatarColor: string; }
const BLANK: UserForm = { name: '', email: '', password: '', role: 'admin', avatarColor: '#00C896' };

export const CrmUsersPage = () => {
  const [users, setUsers] = useState<CrmUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<UserForm>(BLANK);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Omit<UserForm, 'password'> & { newPassword: string; isActive: boolean }>({
    name: '', email: '', newPassword: '', role: 'admin', avatarColor: '#00C896', isActive: true,
  });

  const load = () => {
    setLoading(true);
    fetch('/api/zappo/users')
      .then((r) => r.json())
      .then((d) => setUsers(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const createUser = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.password) return;
    setSaving(true);
    try {
      const res = await fetch('/api/zappo/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { setShowNew(false); setForm(BLANK); load(); }
    } finally { setSaving(false); }
  };

  const saveUser = async (id: number) => {
    setSaving(true);
    try {
      const payload: any = {
        name: editForm.name, email: editForm.email,
        role: editForm.role, avatarColor: editForm.avatarColor, isActive: editForm.isActive,
      };
      if (editForm.newPassword) payload.password = editForm.newPassword;
      await fetch(`/api/zappo/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setEditing(null);
      load();
    } finally { setSaving(false); }
  };

  const toggleActive = async (user: CrmUser) => {
    await fetch(`/api/zappo/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    load();
  };

  const deleteUser = async (id: number) => {
    if (!confirm('Delete this user? They will lose access immediately.')) return;
    await fetch(`/api/zappo/users/${id}`, { method: 'DELETE' });
    load();
  };

  const startEdit = (u: CrmUser) => {
    setEditing(u.id);
    setEditForm({ name: u.name, email: u.email ?? '', newPassword: '', role: u.role, avatarColor: u.avatarColor, isActive: u.isActive });
  };

  const roleLabel = (role: string) => ROLES.find((r) => r.value === role)?.label ?? role;

  return (
    <div className={`${pageMargin} flex flex-col gap-6`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className={heading2Style}>Team Users</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Login accounts for the operator dashboard, with role-based access</p>
        </div>
        <Button variant="success" onClick={() => setShowNew(true)}>
          <Plus className="size-4 mr-2" /> Add User
        </Button>
      </div>

      {/* new user form */}
      {showNew && (
        <Card className="border-dashed">
          <CardContent className="py-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <Avatar name={form.name || '?'} color={form.avatarColor} size="lg" />
              <div className="flex-1 grid grid-cols-2 gap-3">
                <Input placeholder="Full name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                <Input placeholder="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <Input placeholder="Password *" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <select className="border border-input rounded-md px-3 py-2 text-sm bg-background" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
            </div>
            <ColorPicker value={form.avatarColor} onChange={(c) => setForm({ ...form, avatarColor: c })} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => { setShowNew(false); setForm(BLANK); }}>Cancel</Button>
              <Button variant="success" size="sm" onClick={createUser} disabled={saving || !form.name.trim() || !form.email.trim() || !form.password}>
                {saving ? 'Saving…' : 'Add User'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-muted-foreground">Loading…</p>}

      <div className="flex flex-col gap-2">
        {users.map((u) =>
          editing === u.id ? (
            <Card key={u.id} className="border-dashed">
              <CardContent className="py-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={editForm.name || '?'} color={editForm.avatarColor} size="lg" />
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <Input placeholder="Full name *" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                    <Input placeholder="Email *" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                    <Input placeholder="New password (leave blank to keep)" type="password" value={editForm.newPassword} onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })} />
                    <select className="border border-input rounded-md px-3 py-2 text-sm bg-background" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                      {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-wrap">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })} />
                    Active (can log in)
                  </label>
                  <ColorPicker value={editForm.avatarColor} onChange={(c) => setEditForm({ ...editForm, avatarColor: c })} />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
                  <Button variant="success" size="sm" onClick={() => saveUser(u.id)} disabled={saving || !editForm.name.trim()}>
                    {saving ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card key={u.id} className="shadow-none">
              <CardContent className="py-3 flex items-center gap-4">
                <Avatar name={u.name} color={u.avatarColor} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{u.name}</p>
                    <Badge variant={u.role === 'super_admin' ? 'default' : 'secondary'} className="text-xs">{roleLabel(u.role)}</Badge>
                    {!u.isActive && <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>}
                  </div>
                  {u.email && <p className="text-xs text-muted-foreground">{u.email}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button title={u.isActive ? 'Deactivate' : 'Activate'}
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => toggleActive(u)}>
                    {u.isActive ? <UserCheck className="size-4" /> : <UserX className="size-4" />}
                  </button>
                  <button title="Edit"
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => startEdit(u)}>
                    <Pencil className="size-4" />
                  </button>
                  <button title="Delete"
                    className="p-1.5 rounded hover:bg-muted text-destructive hover:text-destructive/80 transition-colors"
                    onClick={() => deleteUser(u.id)}>
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          )
        )}
        {!loading && users.length === 0 && (
          <p className="text-sm text-muted-foreground">No users yet. Add the first team member.</p>
        )}
      </div>
    </div>
  );
};