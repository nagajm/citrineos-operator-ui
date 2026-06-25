'use client';

import { useEffect, useState } from 'react';
import { Button } from '@lib/client/components/ui/button';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { Badge } from '@lib/client/components/ui/badge';
import { Input } from '@lib/client/components/ui/input';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { Plus, Check, Circle, Clock } from 'lucide-react';
import type { CrmPlan } from '@lib/zappo/crm-types';

const STATUS_OPTIONS = ['open', 'in_progress', 'done'] as const;
const STATUS_LABELS = { open: 'Open', in_progress: 'In Progress', done: 'Done' };
const STATUS_ICONS = {
  open: <Circle className="size-4" />,
  in_progress: <Clock className="size-4 text-amber-500" />,
  done: <Check className="size-4 text-green-500" />,
};

export const CrmPlansPage = () => {
  const [plans, setPlans] = useState<CrmPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
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
    } finally {
      setSaving(false);
    }
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
    } finally {
      setSaving(false);
    }
  };

  const deletePlan = async (id: string) => {
    await fetch(`/api/zappo/crm/plans/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className={`${pageMargin} flex flex-col gap-6`}>
      <div className="flex items-center justify-between">
        <h2 className={heading2Style}>Plans</h2>
        <Button variant="success" onClick={() => setShowNew(true)}>
          <Plus className="size-4 mr-2" /> New Plan
        </Button>
      </div>

      <div className="flex gap-2">
        {(['', ...STATUS_OPTIONS] as const).map((s) => (
          <Button
            key={s}
            variant={filterStatus === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setFilterStatus(s); load(s); }}
          >
            {s === '' ? 'All' : STATUS_LABELS[s]}
          </Button>
        ))}
      </div>

      {showNew && (
        <Card className="border-dashed">
          <CardHeader className="pb-2 font-semibold">New Plan</CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Input placeholder="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <textarea
              className="w-full border border-input rounded-md p-3 text-sm bg-background resize-none min-h-[80px]"
              placeholder="Description…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <select className="border border-input rounded-md px-3 py-2 text-sm bg-background" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
              <Input type="date" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} placeholder="Due date" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancel</Button>
              <Button variant="success" onClick={createPlan} disabled={saving || !form.title.trim()}>
                {saving ? 'Saving…' : 'Save Plan'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-muted-foreground">Loading…</p>}

      <div className="flex flex-col gap-2">
        {plans.map((plan) => (
          <Card key={plan.id}>
            {editing === plan.id ? (
              <CardContent className="py-4 flex flex-col gap-3">
                <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Title" />
                <textarea
                  className="w-full border border-input rounded-md p-3 text-sm bg-background resize-none min-h-[60px]"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <select className="border border-input rounded-md px-3 py-2 text-sm bg-background" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                    {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                  </select>
                  <Input type="date" value={editForm.dueAt} onChange={(e) => setEditForm({ ...editForm, dueAt: e.target.value })} />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setEditing(null)}>Cancel</Button>
                  <Button variant="success" size="sm" onClick={() => savePlan(plan.id)} disabled={saving}>Save</Button>
                </div>
              </CardContent>
            ) : (
              <CardContent className="py-3 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  {STATUS_ICONS[plan.status]}
                  <div>
                    <p className="font-medium">{plan.title}</p>
                    {plan.description && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{plan.description}</p>}
                    {plan.dueAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Due: {new Date(plan.dueAt).toLocaleDateString('en-IN')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={plan.status === 'done' ? 'default' : plan.status === 'in_progress' ? 'outline' : 'secondary'}>
                    {STATUS_LABELS[plan.status]}
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => { setEditing(plan.id); setEditForm({ title: plan.title, description: plan.description ?? '', status: plan.status, dueAt: plan.dueAt ? plan.dueAt.slice(0, 10) : '' }); }}>
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deletePlan(plan.id)} className="text-destructive">
                    Delete
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
        {!loading && plans.length === 0 && <p className="text-sm text-muted-foreground">No plans yet.</p>}
      </div>
    </div>
  );
};