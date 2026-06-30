'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@lib/client/components/ui/button';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { Badge } from '@lib/client/components/ui/badge';
import { Input } from '@lib/client/components/ui/input';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { ArrowLeft, Plus, Check, Circle, Trash2 } from 'lucide-react';
import type { CrmLead, CrmTask, CrmComment, LeadStage } from '@lib/zappo/crm-types';
import { QuotationSection } from './quotation-builder';

const STAGE_OPTIONS: LeadStage[] = ['new', 'contacted', 'demo', 'proposal', 'onboarding', 'won', 'lost'];
const STAGE_LABELS: Record<LeadStage, string> = { new: 'New', contacted: 'Contacted', demo: 'Demo', proposal: 'Proposal', onboarding: 'Onboarding', won: 'Won', lost: 'Lost' };
const SOURCE_OPTIONS = ['referral', 'outbound', 'inbound', 'event', 'online', 'website', 'cold_call', 'walk_in', 'other'];

interface LeadDetail extends CrmLead { tasks: CrmTask[]; comments: CrmComment[]; }
interface LeadForm { name: string; phone: string; email: string; company: string; city: string; state: string; expectedStations: string; source: string; stationLocation: string; notes: string; }

export const CrmLeadDetailPage = ({ id }: { id: string }) => {
  const router = useRouter();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<LeadForm>({ name: '', phone: '', email: '', company: '', city: '', state: '', expectedStations: '', source: '', stationLocation: '', notes: '' });
  const [comment, setComment] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/zappo/crm/leads/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setLead(d);
        setForm({
          name: d.name ?? '', phone: d.phone ?? '', email: d.email ?? '',
          company: d.company ?? '', city: d.city ?? '', state: d.state ?? '',
          expectedStations: d.expectedStations ? String(d.expectedStations) : '',
          source: d.source ?? '', stationLocation: d.stationLocation ?? '', notes: d.notes ?? '',
        });
      })
      .finally(() => setLoading(false));
  };

  const saveLead = async () => {
    setSaving(true);
    try {
      const body: Record<string, any> = { name: form.name.trim() };
      if (form.phone) body.phone = form.phone;
      if (form.email) body.email = form.email;
      if (form.company) body.company = form.company;
      if (form.city) body.city = form.city;
      if (form.state) body.state = form.state;
      if (form.expectedStations) body.expectedStations = parseInt(form.expectedStations, 10);
      if (form.source) body.source = form.source;
      if (form.stationLocation) body.stationLocation = form.stationLocation;
      if (form.notes) body.notes = form.notes;
      await fetch(`/api/zappo/crm/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setEditing(false);
      load();
    } finally { setSaving(false); }
  };

  useEffect(() => { load(); }, [id]);

  const updateStage = async (stage: LeadStage) => {
    await fetch(`/api/zappo/crm/leads/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage }) });
    load();
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/zappo/crm/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: comment, leadId: id }) });
      setComment('');
      load();
    } finally { setSaving(false); }
  };

  const addTask = async () => {
    if (!taskTitle.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/zappo/crm/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: taskTitle, leadId: id, dueAt: taskDue || undefined, type: 'call' }) });
      setTaskTitle('');
      setTaskDue('');
      load();
    } finally { setSaving(false); }
  };

  const toggleTask = async (task: CrmTask) => {
    const url = `/api/zappo/crm/tasks/${task.id}/${task.completedAt ? 'reopen' : 'complete'}`;
    await fetch(url, { method: 'POST' });
    load();
  };

  const deleteComment = async (cid: string) => {
    await fetch(`/api/zappo/crm/comments/${cid}`, { method: 'DELETE' });
    load();
  };

  const deleteLead = async () => {
    if (!window.confirm(`Delete "${lead?.name}"? This cannot be undone.`)) return;
    await fetch(`/api/zappo/crm/leads/${id}`, { method: 'DELETE' });
    router.push('/zappo/crm/leads');
  };

  if (loading) return <div className={`${pageMargin}`}><p className="text-muted-foreground">Loading…</p></div>;
  if (!lead) return <div className={`${pageMargin}`}><p className="text-destructive">Lead not found.</p></div>;

  return (
    <div className={`${pageMargin} flex flex-col gap-6`}>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/zappo/crm/leads')}>
          <ArrowLeft className="size-4 mr-1" /> Back
        </Button>
        <h2 className={`${heading2Style} flex-1`}>{lead.name}</h2>
        {editing ? (
          <>
            <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
            <Button variant="success" size="sm" onClick={saveLead} disabled={saving || !form.name.trim()}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit</Button>
            <Button variant="ghost" size="sm" onClick={deleteLead} className="text-destructive hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="size-4 mr-1" /> Delete
            </Button>
          </>
        )}
      </div>

      {/* Stage selector */}
      <div className="flex gap-2 flex-wrap">
        {STAGE_OPTIONS.map((s) => (
          <Button key={s} size="sm" variant={lead.stage === s ? 'default' : 'outline'} onClick={() => updateStage(s)}>
            {STAGE_LABELS[s]}
          </Button>
        ))}
      </div>

      {/* Details */}
      <Card>
        <CardContent className="py-4">
          {editing ? (
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">Name *<Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">Phone<Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">Email<Input placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">Company<Input placeholder="Company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></label>
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">City<Input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></label>
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">State<Input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} /></label>
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">Expected stations<Input placeholder="e.g. 2" type="number" value={form.expectedStations} onChange={(e) => setForm({ ...form, expectedStations: e.target.value })} /></label>
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">Source
                <select className="border border-input rounded-md px-3 py-2 text-sm bg-background" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                  <option value="">Select…</option>
                  {SOURCE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-muted-foreground col-span-2">Station location<Input placeholder="e.g. Near Saravana Bhavan Hotel" value={form.stationLocation} onChange={(e) => setForm({ ...form, stationLocation: e.target.value })} /></label>
              <label className="flex flex-col gap-1 text-xs text-muted-foreground col-span-2">Notes<textarea className="border border-input rounded-md p-3 text-sm bg-background resize-none min-h-[70px]" placeholder="Notes…" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4 text-sm">
              {lead.company && <div><p className="text-xs text-muted-foreground mb-0.5">Company</p><p className="font-medium">{lead.company}</p></div>}
              {lead.phone && <div><p className="text-xs text-muted-foreground mb-0.5">Phone</p><p className="font-medium">{lead.phone}</p></div>}
              {lead.email && <div><p className="text-xs text-muted-foreground mb-0.5">Email</p><p className="font-medium">{lead.email}</p></div>}
              {lead.city && <div><p className="text-xs text-muted-foreground mb-0.5">Location</p><p className="font-medium">{[lead.city, lead.state].filter(Boolean).join(', ')}</p></div>}
              {lead.expectedStations && <div><p className="text-xs text-muted-foreground mb-0.5">Expected stations</p><p className="font-medium">{lead.expectedStations}</p></div>}
              {lead.source && <div><p className="text-xs text-muted-foreground mb-0.5">Source</p><p className="font-medium">{lead.source}</p></div>}
              {lead.stationLocation && <div className="col-span-2 md:col-span-3"><p className="text-xs text-muted-foreground mb-0.5">Station location</p><p className="font-medium">{lead.stationLocation}</p></div>}
              {lead.notes && <div className="col-span-2 md:col-span-3"><p className="text-xs text-muted-foreground mb-0.5">Notes</p><p className="whitespace-pre-wrap">{lead.notes}</p></div>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tasks */}
      <div>
        <h3 className="font-semibold mb-3">Follow-up Tasks</h3>
        <div className="flex gap-2 mb-3">
          <Input placeholder="Task title…" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} className="flex-1" />
          <Input type="datetime-local" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} className="w-52" />
          <Button variant="outline" onClick={addTask} disabled={saving || !taskTitle.trim()}>
            <Plus className="size-4" />
          </Button>
        </div>
        <div className="flex flex-col gap-1">
          {lead.tasks.map((task) => (
            <div key={task.id} className={`flex items-center gap-3 p-2 rounded-md ${task.completedAt ? 'opacity-50' : ''}`}>
              <button onClick={() => toggleTask(task)}>
                {task.completedAt ? <Check className="size-4 text-green-500" /> : <Circle className="size-4 text-muted-foreground" />}
              </button>
              <span className={`text-sm flex-1 ${task.completedAt ? 'line-through' : ''}`}>{task.title}</span>
              {task.dueAt && <span className="text-xs text-muted-foreground">{new Date(task.dueAt).toLocaleDateString('en-IN')}</span>}
            </div>
          ))}
          {lead.tasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks yet.</p>}
        </div>
      </div>

      {/* Comments */}
      <div>
        <h3 className="font-semibold mb-3">Comments</h3>
        <div className="flex gap-2 mb-3">
          <Input placeholder="Add a comment…" value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addComment()} className="flex-1" />
          <Button variant="outline" onClick={addComment} disabled={saving || !comment.trim()}>Post</Button>
        </div>
        <div className="flex flex-col gap-2">
          {lead.comments.map((c) => (
            <div key={c.id} className="flex items-start gap-3 p-3 rounded-md bg-muted/30">
              <div className="flex-1">
                <p className="text-sm">{c.content}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(c.createdAt).toLocaleString('en-IN')}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => deleteComment(c.id)} className="text-destructive shrink-0">
                <Trash2 className="size-3" />
              </Button>
            </div>
          ))}
          {lead.comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
        </div>
      </div>

      {/* Quotations */}
      <QuotationSection leadId={id} leadName={lead.name} />
    </div>
  );
};