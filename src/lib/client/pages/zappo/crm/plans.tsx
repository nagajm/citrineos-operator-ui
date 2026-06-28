'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@lib/client/components/ui/button';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { Badge } from '@lib/client/components/ui/badge';
import { Input } from '@lib/client/components/ui/input';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { Plus, Check, Circle, Clock, LayoutList, LayoutGrid, ArrowUpDown } from 'lucide-react';
import type { CrmPlan } from '@lib/zappo/crm-types';

const STATUS_OPTIONS = ['open', 'in_progress', 'done'] as const;
type Status = typeof STATUS_OPTIONS[number];
const STATUS_LABELS: Record<Status, string> = { open: 'Open', in_progress: 'In Progress', done: 'Done' };
const STATUS_ICONS: Record<Status, React.ReactNode> = {
  open: <Circle className="size-4" />,
  in_progress: <Clock className="size-4 text-amber-500" />,
  done: <Check className="size-4 text-green-500" />,
};
const COLUMN_COLORS: Record<Status, string> = {
  open: 'border-t-slate-400',
  in_progress: 'border-t-amber-400',
  done: 'border-t-green-500',
};
const COLUMN_BG: Record<Status, string> = {
  open: 'bg-slate-50',
  in_progress: 'bg-amber-50/50',
  done: 'bg-green-50/50',
};

type SortKey = 'dueAt_asc' | 'dueAt_desc' | 'title_asc' | 'title_desc' | 'status';
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'dueAt_asc',   label: 'Due Date ↑' },
  { value: 'dueAt_desc',  label: 'Due Date ↓' },
  { value: 'title_asc',   label: 'Title A–Z' },
  { value: 'title_desc',  label: 'Title Z–A' },
  { value: 'status',      label: 'Status' },
];

function sortPlans(plans: CrmPlan[], key: SortKey): CrmPlan[] {
  return [...plans].sort((a, b) => {
    if (key === 'dueAt_asc')  return (a.dueAt ?? 'z') < (b.dueAt ?? 'z') ? -1 : 1;
    if (key === 'dueAt_desc') return (a.dueAt ?? '') > (b.dueAt ?? '') ? -1 : 1;
    if (key === 'title_asc')  return a.title.localeCompare(b.title);
    if (key === 'title_desc') return b.title.localeCompare(a.title);
    if (key === 'status')     return STATUS_OPTIONS.indexOf(a.status as Status) - STATUS_OPTIONS.indexOf(b.status as Status);
    return 0;
  });
}

function formatDue(dueAt?: string | null) {
  if (!dueAt) return null;
  return new Date(dueAt).toLocaleDateString('en-IN');
}

// ─── shared plan card (used in both list and kanban) ───────────────────────
function PlanCard({
  plan, onEdit, onDelete, compact,
}: {
  plan: CrmPlan;
  onEdit: (p: CrmPlan) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
}) {
  return (
    <Card className="shadow-none">
      <CardContent className={`${compact ? 'py-3 px-4' : 'py-3'} flex items-start justify-between gap-3`}>
        <div className="flex items-start gap-2 min-w-0">
          <span className="mt-0.5 shrink-0">{STATUS_ICONS[plan.status as Status]}</span>
          <div className="min-w-0">
            <p className="font-medium text-sm leading-snug">{plan.title}</p>
            {!compact && plan.description && (
              <p className="text-xs text-muted-foreground mt-0.5 whitespace-pre-wrap line-clamp-2">{plan.description}</p>
            )}
            {plan.dueAt && (
              <p className="text-xs text-muted-foreground mt-1">Due: {formatDue(plan.dueAt)}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {!compact && (
            <Badge variant={plan.status === 'done' ? 'default' : plan.status === 'in_progress' ? 'outline' : 'secondary'} className="text-xs">
              {STATUS_LABELS[plan.status as Status]}
            </Badge>
          )}
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onEdit(plan)}>Edit</Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-destructive" onClick={() => onDelete(plan.id)}>Delete</Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── inline edit form (shared) ─────────────────────────────────────────────
function EditForm({
  form, onChange, onSave, onCancel, saving,
}: {
  form: { title: string; description: string; status: string; dueAt: string };
  onChange: (f: typeof form) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="py-4 flex flex-col gap-3">
        <Input value={form.title} onChange={(e) => onChange({ ...form, title: e.target.value })} placeholder="Title *" />
        <textarea
          className="w-full border border-input rounded-md p-3 text-sm bg-background resize-none min-h-[60px]"
          value={form.description}
          onChange={(e) => onChange({ ...form, description: e.target.value })}
          placeholder="Description…"
        />
        <div className="grid grid-cols-2 gap-3">
          <select className="border border-input rounded-md px-3 py-2 text-sm bg-background" value={form.status} onChange={(e) => onChange({ ...form, status: e.target.value })}>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <Input type="date" value={form.dueAt} onChange={(e) => onChange({ ...form, dueAt: e.target.value })} />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button variant="success" size="sm" onClick={onSave} disabled={saving || !form.title.trim()}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── main page ─────────────────────────────────────────────────────────────
export const CrmPlansPage = () => {
  const [plans, setPlans] = useState<CrmPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('dueAt_asc');
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', dueAt: '', status: 'open' });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', status: 'open', dueAt: '' });

  const load = (s = filterStatus) => {
    setLoading(true);
    const qs = s ? `?status=${s}` : '';
    fetch(`/api/zappo/crm/plans${qs}`)
      .then((r) => r.json())
      .then((d) => setPlans(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const sorted = useMemo(() => sortPlans(plans, sortKey), [plans, sortKey]);

  const byStatus = useMemo(() => {
    const m: Record<Status, CrmPlan[]> = { open: [], in_progress: [], done: [] };
    sortPlans(plans, sortKey).forEach((p) => {
      if (p.status in m) m[p.status as Status].push(p);
    });
    return m;
  }, [plans, sortKey]);

  const createPlan = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/zappo/crm/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, dueAt: form.dueAt || undefined }),
      });
      setShowNew(false);
      setForm({ title: '', description: '', dueAt: '', status: 'open' });
      load();
    } finally { setSaving(false); }
  };

  const savePlan = async (id: string) => {
    setSaving(true);
    try {
      await fetch(`/api/zappo/crm/plans/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editForm, dueAt: editForm.dueAt || undefined }),
      });
      setEditing(null);
      load();
    } finally { setSaving(false); }
  };

  const deletePlan = async (id: string) => {
    await fetch(`/api/zappo/crm/plans/${id}`, { method: 'DELETE' });
    load();
  };

  const startEdit = (plan: CrmPlan) => {
    setEditing(plan.id);
    setEditForm({ title: plan.title, description: plan.description ?? '', status: plan.status, dueAt: plan.dueAt ? plan.dueAt.slice(0, 10) : '' });
  };

  return (
    <div className={`${pageMargin} flex flex-col gap-6`}>
      {/* header */}
      <div className="flex items-center justify-between">
        <h2 className={heading2Style}>Plans</h2>
        <Button variant="success" onClick={() => setShowNew(true)}>
          <Plus className="size-4 mr-2" /> New Plan
        </Button>
      </div>

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        {/* status filter — only in list view */}
        {view === 'list' && (['', ...STATUS_OPTIONS] as const).map((s) => (
          <Button
            key={s}
            variant={filterStatus === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setFilterStatus(s); load(s); }}
          >
            {s === '' ? 'All' : STATUS_LABELS[s]}
          </Button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          {/* sort */}
          <div className="flex items-center gap-1.5 border border-input rounded-md px-2 py-1 bg-background">
            <ArrowUpDown className="size-3.5 text-muted-foreground" />
            <select
              className="text-sm bg-transparent border-none outline-none cursor-pointer"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* view toggle */}
          <div className="flex border border-input rounded-md overflow-hidden">
            <button
              className={`px-2.5 py-1.5 flex items-center gap-1.5 text-sm transition-colors ${view === 'list' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
              onClick={() => setView('list')}
              title="List view"
            >
              <LayoutList className="size-4" />
            </button>
            <button
              className={`px-2.5 py-1.5 flex items-center gap-1.5 text-sm transition-colors border-l border-input ${view === 'kanban' ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-muted'}`}
              onClick={() => setView('kanban')}
              title="Kanban view"
            >
              <LayoutGrid className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* new plan form */}
      {showNew && (
        <EditForm
          form={form}
          onChange={setForm}
          onSave={createPlan}
          onCancel={() => { setShowNew(false); setForm({ title: '', description: '', dueAt: '', status: 'open' }); }}
          saving={saving}
        />
      )}

      {loading && <p className="text-muted-foreground">Loading…</p>}

      {/* ── LIST VIEW ── */}
      {!loading && view === 'list' && (
        <div className="flex flex-col gap-2">
          {sorted.map((plan) =>
            editing === plan.id ? (
              <EditForm
                key={plan.id}
                form={editForm}
                onChange={setEditForm}
                onSave={() => savePlan(plan.id)}
                onCancel={() => setEditing(null)}
                saving={saving}
              />
            ) : (
              <PlanCard key={plan.id} plan={plan} onEdit={startEdit} onDelete={deletePlan} />
            )
          )}
          {sorted.length === 0 && <p className="text-sm text-muted-foreground">No plans yet.</p>}
        </div>
      )}

      {/* ── KANBAN VIEW ── */}
      {!loading && view === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {STATUS_OPTIONS.map((col) => (
            <div key={col} className={`rounded-xl border border-t-4 ${COLUMN_COLORS[col]} ${COLUMN_BG[col]} flex flex-col gap-2 p-3`}>
              {/* column header */}
              <div className="flex items-center gap-2 px-1 pb-1">
                <span>{STATUS_ICONS[col]}</span>
                <span className="font-semibold text-sm">{STATUS_LABELS[col]}</span>
                <span className="ml-auto text-xs font-medium bg-background border border-input rounded-full px-2 py-0.5">
                  {byStatus[col].length}
                </span>
              </div>

              {/* plan cards */}
              {byStatus[col].map((plan) =>
                editing === plan.id ? (
                  <EditForm
                    key={plan.id}
                    form={editForm}
                    onChange={setEditForm}
                    onSave={() => savePlan(plan.id)}
                    onCancel={() => setEditing(null)}
                    saving={saving}
                  />
                ) : (
                  <PlanCard key={plan.id} plan={plan} onEdit={startEdit} onDelete={deletePlan} compact />
                )
              )}

              {byStatus[col].length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">No plans</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};