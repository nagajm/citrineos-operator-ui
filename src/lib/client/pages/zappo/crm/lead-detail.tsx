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

const STAGE_OPTIONS: LeadStage[] = ['new', 'contacted', 'demo', 'proposal', 'onboarding', 'won', 'lost'];
const STAGE_LABELS: Record<LeadStage, string> = { new: 'New', contacted: 'Contacted', demo: 'Demo', proposal: 'Proposal', onboarding: 'Onboarding', won: 'Won', lost: 'Lost' };

interface LeadDetail extends CrmLead { tasks: CrmTask[]; comments: CrmComment[]; }

export const CrmLeadDetailPage = ({ id }: { id: string }) => {
  const router = useRouter();
  const [lead, setLead] = useState<LeadDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/zappo/crm/leads/${id}`)
      .then((r) => r.json())
      .then((d) => setLead(d))
      .finally(() => setLoading(false));
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

  if (loading) return <div className={`${pageMargin}`}><p className="text-muted-foreground">Loading…</p></div>;
  if (!lead) return <div className={`${pageMargin}`}><p className="text-destructive">Lead not found.</p></div>;

  return (
    <div className={`${pageMargin} flex flex-col gap-6`}>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/zappo/crm/leads')}>
          <ArrowLeft className="size-4 mr-1" /> Back
        </Button>
        <h2 className={heading2Style}>{lead.name}</h2>
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
        <CardContent className="py-4 grid grid-cols-2 gap-3 text-sm">
          {lead.company && <><span className="text-muted-foreground">Company</span><span>{lead.company}</span></>}
          {lead.phone && <><span className="text-muted-foreground">Phone</span><span>{lead.phone}</span></>}
          {lead.email && <><span className="text-muted-foreground">Email</span><span>{lead.email}</span></>}
          {lead.city && <><span className="text-muted-foreground">Location</span><span>{[lead.city, lead.state].filter(Boolean).join(', ')}</span></>}
          {lead.expectedStations && <><span className="text-muted-foreground">Expected stations</span><span>{lead.expectedStations}</span></>}
          {lead.source && <><span className="text-muted-foreground">Source</span><span>{lead.source}</span></>}
          {lead.notes && <><span className="text-muted-foreground col-span-2">Notes</span><span className="col-span-2 whitespace-pre-wrap">{lead.notes}</span></>}
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
    </div>
  );
};