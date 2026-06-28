'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@lib/client/components/ui/button';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { Badge } from '@lib/client/components/ui/badge';
import { Input } from '@lib/client/components/ui/input';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { Plus, Search, ChevronRight, Building2 } from 'lucide-react';
import type { Vendor, CrmUser } from '@lib/zappo/crm-types';

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

interface VendorForm {
  name: string; contactName: string; phone: string; email: string;
  category: string; address: string; notes: string; assigneeId: number | null;
}
const BLANK: VendorForm = {
  name: '', contactName: '', phone: '', email: '',
  category: '', address: '', notes: '', assigneeId: null,
};

export const CrmVendorsPage = () => {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<VendorForm>(BLANK);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<CrmUser[]>([]);
  const [usersMap, setUsersMap] = useState<Record<number, CrmUser>>({});

  const load = (s = search) => {
    setLoading(true);
    const qs = s ? `?search=${encodeURIComponent(s)}` : '';
    fetch(`/api/zappo/crm/vendors${qs}`)
      .then((r) => r.json())
      .then((d) => { setVendors(d.data ?? []); setTotal(d.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    fetch('/api/zappo/users')
      .then((r) => r.json())
      .then((d: CrmUser[]) => {
        if (Array.isArray(d)) {
          setUsers(d);
          const m: Record<number, CrmUser> = {};
          d.forEach((u) => { m[u.id] = u; });
          setUsersMap(m);
        }
      })
      .catch(() => {});
  }, []);

  const createVendor = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/zappo/crm/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      setShowNew(false);
      setForm(BLANK);
      load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${pageMargin} flex flex-col gap-6`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className={heading2Style}>Vendors</h2>
          <p className="text-sm text-muted-foreground">{total} total</p>
        </div>
        <Button variant="success" onClick={() => setShowNew(true)}>
          <Plus className="size-4 mr-2" /> New Vendor
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input placeholder="Search vendors…" value={search} onChange={(e) => { setSearch(e.target.value); load(e.target.value); }} className="pl-9" />
      </div>

      {showNew && (
        <Card className="border-dashed">
          <CardHeader className="pb-2 font-semibold">New Vendor</CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Vendor name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Contact name" value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
              <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input placeholder="Category (e.g. Hardware, Software)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <Input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <Input placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            <select
              className="border border-input rounded-md px-3 py-2 text-sm bg-background"
              value={form.assigneeId ?? ''}
              onChange={(e) => setForm({ ...form, assigneeId: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">Assignee (optional)</option>
              {users.filter((u) => u.isActive).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowNew(false); setForm(BLANK); }}>Cancel</Button>
              <Button variant="success" onClick={createVendor} disabled={saving || !form.name.trim()}>
                {saving ? 'Saving…' : 'Save Vendor'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-muted-foreground">Loading…</p>}

      <div className="flex flex-col gap-2">
        {vendors.map((v) => {
          const assignee = v.assigneeId ? usersMap[v.assigneeId] : null;
          return (
            <Card key={v.id} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => router.push(`/zappo/crm/vendors/${v.id}`)}>
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Building2 className="size-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium">{v.name}</p>
                    <p className="text-xs text-muted-foreground">{[v.contactName, v.phone, v.category].filter(Boolean).join(' · ')}</p>
                  </div>
                  <Badge variant={v.isActive ? 'default' : 'secondary'}>{v.isActive ? 'Active' : 'Inactive'}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  {assignee && (
                    <span className="flex items-center gap-1.5 shrink-0">
                      <span
                        style={{ background: assignee.avatarColor }}
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-black"
                      >
                        {initials(assignee.name)}
                      </span>
                      <span className="text-xs text-muted-foreground hidden md:inline">{assignee.name}</span>
                    </span>
                  )}
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!loading && vendors.length === 0 && <p className="text-sm text-muted-foreground">No vendors yet.</p>}
      </div>
    </div>
  );
};