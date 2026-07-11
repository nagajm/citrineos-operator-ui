'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@lib/client/components/ui/button';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { Badge } from '@lib/client/components/ui/badge';
import { Input } from '@lib/client/components/ui/input';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { Plus, Search, ChevronRight, CheckSquare, Trash2 } from 'lucide-react';
import type { CrmLead, CrmUser, LeadStage } from '@lib/zappo/crm-types';

const STAGE_LABELS: Record<LeadStage, string> = {
  new: 'New',
  contacted: 'Contacted',
  demo: 'Demo',
  proposal: 'Proposal',
  onboarding: 'Onboarding',
  won: 'Won',
  lost: 'Lost',
};

const STAGE_COLORS: Record<LeadStage, string> = {
  new: 'secondary',
  contacted: 'outline',
  demo: 'outline',
  proposal: 'outline',
  onboarding: 'outline',
  won: 'default',
  lost: 'destructive',
};

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

interface NewLeadForm {
  name: string; phone: string; email: string; company: string; city: string; state: string;
  expectedStations: string; source: string; notes: string; stationLocation: string; assigneeId: number | null;
}

const BLANK: NewLeadForm = {
  name: '', phone: '', email: '', company: '', city: '', state: '',
  expectedStations: '', source: '', notes: '', stationLocation: '', assigneeId: null,
};

export const CrmLeadsPage = () => {
  const router = useRouter();
  const [leads, setLeads] = useState<CrmLead[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<NewLeadForm>(BLANK);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<CrmUser[]>([]);
  const [usersMap, setUsersMap] = useState<Record<number, CrmUser>>({});

  const load = (s = search, st = stageFilter) => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (s) qs.set('search', s);
    if (st) qs.set('stage', st);
    fetch(`/api/zappo/crm/leads?${qs}`)
      .then((r) => r.json())
      .then((d) => { setLeads(d.data ?? []); setTotal(d.total ?? 0); })
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

  const handleSearch = (v: string) => { setSearch(v); load(v, stageFilter); };
  const handleStage = (v: string) => { setStageFilter(v); load(search, v); };

  const deleteLead = async (id: number) => {
    if (!window.confirm('Delete this lead? This cannot be undone.')) return;
    await fetch(`/api/zappo/crm/leads/${id}`, { method: 'DELETE' });
    load();
  };

  const createLead = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/zappo/crm/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          ...(form.phone && { phone: form.phone }),
          ...(form.email && { email: form.email }),
          ...(form.company && { company: form.company }),
          ...(form.city && { city: form.city }),
          ...(form.state && { state: form.state }),
          ...(form.expectedStations && { expectedStations: parseInt(form.expectedStations, 10) }),
          ...(form.source && { source: form.source }),
          ...(form.notes && { notes: form.notes }),
          ...(form.stationLocation && { stationLocation: form.stationLocation }),
          ...(form.assigneeId != null && { assigneeId: form.assigneeId }),
        }),
      });
      if (!res.ok) { alert(`Failed to save lead: ${(await res.json()).message}`); return; }
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
          <h2 className={heading2Style}>Leads</h2>
          <p className="text-sm text-muted-foreground">{total} total</p>
        </div>
        <Button variant="success" onClick={() => setShowNew(true)}>
          <Plus className="size-4 mr-2" /> New Lead
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Search leads…" value={search} onChange={(e) => handleSearch(e.target.value)} className="pl-9 w-64" />
        </div>
        <select
          className="border border-input rounded-md px-3 py-2 text-sm bg-background"
          value={stageFilter}
          onChange={(e) => handleStage(e.target.value)}
        >
          <option value="">All stages</option>
          {(Object.keys(STAGE_LABELS) as LeadStage[]).map((s) => (
            <option key={s} value={s}>{STAGE_LABELS[s]}</option>
          ))}
        </select>
      </div>

      {/* New lead form */}
      {showNew && (
        <Card className="border-dashed">
          <CardHeader className="pb-2 font-semibold">New Lead</CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              <Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <Input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
              <Input placeholder="Expected stations" type="number" value={form.expectedStations} onChange={(e) => setForm({ ...form, expectedStations: e.target.value })} />
              <select className="border border-input rounded-md px-3 py-2 text-sm bg-background" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                <option value="">Source…</option>
                <option value="referral">Referral</option>
                <option value="outbound">Outbound</option>
                <option value="inbound">Inbound</option>
                <option value="event">Event</option>
                <option value="online">Online</option>
              </select>
            </div>
            <Input placeholder="Station location (where they plan to install)" value={form.stationLocation} onChange={(e) => setForm({ ...form, stationLocation: e.target.value })} />
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
              <Button variant="success" onClick={createLead} disabled={saving || !form.name.trim()}>
                {saving ? 'Saving…' : 'Save Lead'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-muted-foreground">Loading…</p>}

      <div className="flex flex-col gap-2">
        {leads.map((lead) => {
          const assignee = lead.assigneeId ? usersMap[lead.assigneeId] : null;
          return (
            <Card key={lead.id} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => router.push(`/zappo/crm/leads/${lead.id}`)}>
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-xs text-muted-foreground">{[lead.company, lead.city, lead.state].filter(Boolean).join(' · ')}</p>
                  </div>
                  <Badge variant={STAGE_COLORS[lead.stage] as any}>{STAGE_LABELS[lead.stage]}</Badge>
                  {lead.pendingTasks && lead.pendingTasks > 0 ? (
                    <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                      <CheckSquare className="size-3" /> {lead.pendingTasks}
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
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
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteLead(lead.id); }}
                    className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete lead"
                  >
                    <Trash2 className="size-4" />
                  </button>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!loading && leads.length === 0 && (
          <p className="text-muted-foreground text-sm">No leads found.</p>
        )}
      </div>
    </div>
  );
};