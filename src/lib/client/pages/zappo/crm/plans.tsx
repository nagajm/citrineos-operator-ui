'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@lib/client/components/ui/button';
import { Card, CardContent } from '@lib/client/components/ui/card';
import { Badge } from '@lib/client/components/ui/badge';
import { Input } from '@lib/client/components/ui/input';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import Link from 'next/link';
import { Plus, Check, Circle, Clock, LayoutList, LayoutGrid, ArrowUpDown, Tag, Settings2, Trash2 } from 'lucide-react';
import type { CrmPlan, CrmTag, CrmUser } from '@lib/zappo/crm-types';

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

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

function AssigneeChip({ user }: { user: CrmUser }) {
  return (
    <span className="flex items-center gap-1 shrink-0">
      <span
        style={{ background: user.avatarColor }}
        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-black"
      >
        {initials(user.name)}
      </span>
      <span className="text-xs text-muted-foreground hidden sm:inline">{user.name}</span>
    </span>
  );
}

function TagPill({ tag }: { tag: CrmTag }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium text-white"
      style={{ background: tag.color }}
    >
      {tag.name}
    </span>
  );
}

// ─── shared plan card ──────────────────────────────────────────────────────────
function PlanCard({
  plan, onEdit, onDelete, compact, usersMap,
}: {
  plan: CrmPlan;
  onEdit: (p: CrmPlan) => void;
  onDelete: (id: string) => void;
  compact?: boolean;
  usersMap: Record<number, CrmUser>;
}) {
  const assignee = plan.assigneeId ? usersMap[plan.assigneeId] : null;
  const tags = plan.tags ?? [];
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
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {tags.map((t) => <TagPill key={t.id} tag={t} />)}
              </div>
            )}
            <div className="flex items-center gap-3 mt-1">
              {plan.dueAt && <p className="text-xs text-muted-foreground">Due: {formatDue(plan.dueAt)}</p>}
              {assignee && <AssigneeChip user={assignee} />}
            </div>
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



// ─── inline edit / create form ────────────────────────────────────────────────
interface PlanFormState { title: string; description: string; status: string; dueAt: string; assigneeId: number | null; tagIds: string[]; }
function EditForm({
  form, onChange, onSave, onCancel, saving, users, tags,
}: {
  form: PlanFormState;
  onChange: (f: PlanFormState) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  users: CrmUser[];
  tags: CrmTag[];
}) {
  const toggleTag = (id: string) => {
    const next = form.tagIds.includes(id) ? form.tagIds.filter((t) => t !== id) : [...form.tagIds, id];
    onChange({ ...form, tagIds: next });
  };
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
        {tags.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1">
              <Tag className="size-3" /> Tags
            </p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => {
                const active = form.tagIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.id)}
                    className={`px-2.5 py-0.5 rounded-full border text-[11px] font-medium text-white transition-all ${active ? 'ring-2 ring-offset-1 ring-foreground/30' : 'opacity-40 hover:opacity-70'}`}
                    style={{ background: t.color, borderColor: t.color }}
                  >
                    {t.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <select className="border border-input rounded-md px-3 py-2 text-sm bg-background" value={form.status} onChange={(e) => onChange({ ...form, status: e.target.value })}>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
          <Input type="date" value={form.dueAt} onChange={(e) => onChange({ ...form, dueAt: e.target.value })} />
        </div>
        <select
          className="border border-input rounded-md px-3 py-2 text-sm bg-background"
          value={form.assigneeId ?? ''}
          onChange={(e) => onChange({ ...form, assigneeId: e.target.value ? Number(e.target.value) : null })}
        >
          <option value="">Assignee (optional)</option>
          {users.filter((u) => u.isActive).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
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

const BLANK_FORM: PlanFormState = { title: '', description: '', dueAt: '', status: 'open', assigneeId: null, tagIds: [] };

// ─── main page ─────────────────────────────────────────────────────────────────
export const CrmPlansPage = () => {
  const [plans, setPlans] = useState<CrmPlan[]>([]);
  const [tags, setTags] = useState<CrmTag[]>([]);
  const [users, setUsers] = useState<CrmUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTagId, setFilterTagId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('dueAt_asc');
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<PlanFormState>(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<PlanFormState>(BLANK_FORM);

  const usersMap = useMemo(() => {
    const m: Record<number, CrmUser> = {};
    users.forEach((u) => { m[u.id] = u; });
    return m;
  }, [users]);

  const loadTags = () =>
    fetch('/api/zappo/crm/tags').then((r) => r.json()).then((d) => setTags(Array.isArray(d) ? d : [])).catch(() => {});

  const load = () => {
    setLoading(true);
    fetch('/api/zappo/crm/plans')
      .then((r) => r.json())
      .then((d) => setPlans(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    loadTags();
    fetch('/api/zappo/users').then((r) => r.json()).then((d) => setUsers(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    let list = plans;
    if (filterTagId) list = list.filter((p) => (p.tags ?? []).some((t) => t.id === filterTagId));
    if (filterStatus) list = list.filter((p) => p.status === filterStatus);
    return sortPlans(list, sortKey);
  }, [plans, filterTagId, filterStatus, sortKey]);

  const byStatus = useMemo(() => {
    const m: Record<Status, CrmPlan[]> = { open: [], in_progress: [], done: [] };
    filtered.forEach((p) => { if (p.status in m) m[p.status as Status].push(p); });
    return m;
  }, [filtered]);

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
      setForm(BLANK_FORM);
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
    setEditForm({
      title: plan.title,
      description: plan.description ?? '',
      status: plan.status,
      dueAt: plan.dueAt ? plan.dueAt.slice(0, 10) : '',
      assigneeId: plan.assigneeId ?? null,
      tagIds: (plan.tags ?? []).map((t) => t.id),
    });
  };

  const activeTag = tags.find((t) => t.id === filterTagId);

  return (
    <div className={`${pageMargin} flex flex-col gap-4`}>
      {/* header */}
      <div className="flex items-center justify-between">
        <h2 className={heading2Style}>Plans</h2>
        <Button variant="success" onClick={() => setShowNew(true)}>
          <Plus className="size-4 mr-2" /> New Plan
        </Button>
      </div>

      {/* ── tag filter row ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5">
        <Tag className="size-3.5 text-muted-foreground shrink-0" />
        <button
          onClick={() => setFilterTagId('')}
          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filterTagId === '' ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-input text-muted-foreground hover:border-primary/50'}`}
        >
          All
        </button>
        {tags.map((t) => (
          <button
            key={t.id}
            onClick={() => setFilterTagId(filterTagId === t.id ? '' : t.id)}
            className={`px-3 py-1 rounded-full border text-xs font-medium text-white transition-all ${filterTagId === t.id ? 'ring-2 ring-offset-1 ring-foreground/30' : 'opacity-60 hover:opacity-90'}`}
            style={{ background: t.color, borderColor: t.color }}
          >
            {t.name}
          </button>
        ))}
        <Link
          href="/zappo/crm/tags"
          className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings2 className="size-3.5" /> Manage tags
        </Link>
      </div>

      {/* ── status filter + sort + view toggle ──────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {view === 'list' && (['', ...STATUS_OPTIONS] as const).map((s) => (
          <Button
            key={s}
            variant={filterStatus === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus(s)}
          >
            {s === '' ? 'All' : STATUS_LABELS[s]}
          </Button>
        ))}

        <div className="ml-auto flex items-center gap-2">
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
          onCancel={() => { setShowNew(false); setForm(BLANK_FORM); }}
          saving={saving}
          users={users}
          tags={tags}
        />
      )}

      {loading && <p className="text-muted-foreground">Loading…</p>}

      {/* ── LIST VIEW ── */}
      {!loading && view === 'list' && (
        <div className="flex flex-col gap-2">
          {filtered.map((plan) =>
            editing === plan.id ? (
              <EditForm
                key={plan.id}
                form={editForm}
                onChange={setEditForm}
                onSave={() => savePlan(plan.id)}
                onCancel={() => setEditing(null)}
                saving={saving}
                users={users}
                tags={tags}
              />
            ) : (
              <PlanCard key={plan.id} plan={plan} onEdit={startEdit} onDelete={deletePlan} usersMap={usersMap} />
            )
          )}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No plans{activeTag ? ` tagged "${activeTag.name}"` : ''}.
            </p>
          )}
        </div>
      )}

      {/* ── KANBAN VIEW ── */}
      {!loading && view === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {STATUS_OPTIONS.map((col) => (
            <div key={col} className={`rounded-xl border border-t-4 ${COLUMN_COLORS[col]} ${COLUMN_BG[col]} flex flex-col gap-2 p-3`}>
              <div className="flex items-center gap-2 px-1 pb-1">
                <span>{STATUS_ICONS[col]}</span>
                <span className="font-semibold text-sm">{STATUS_LABELS[col]}</span>
                <span className="ml-auto text-xs font-medium bg-background border border-input rounded-full px-2 py-0.5">
                  {byStatus[col].length}
                </span>
              </div>

              {byStatus[col].map((plan) =>
                editing === plan.id ? (
                  <EditForm
                    key={plan.id}
                    form={editForm}
                    onChange={setEditForm}
                    onSave={() => savePlan(plan.id)}
                    onCancel={() => setEditing(null)}
                    saving={saving}
                    users={users}
                    tags={tags}
                  />
                ) : (
                  <PlanCard key={plan.id} plan={plan} onEdit={startEdit} onDelete={deletePlan} compact usersMap={usersMap} />
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
