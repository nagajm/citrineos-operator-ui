'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@lib/client/components/ui/button';
import { Card, CardContent } from '@lib/client/components/ui/card';
import { Input } from '@lib/client/components/ui/input';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { ArrowLeft, Trash2 } from 'lucide-react';
import type { MeetingNote, CrmComment } from '@lib/zappo/crm-types';

interface MeetingDetail extends MeetingNote { comments: CrmComment[]; }

export const CrmMeetingDetailPage = ({ id }: { id: string }) => {
  const router = useRouter();
  const [meeting, setMeeting] = useState<MeetingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<MeetingNote>>({});
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/zappo/crm/meetings/${id}`)
      .then((r) => r.json())
      .then((d) => { setMeeting(d); setForm(d); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`/api/zappo/crm/meetings/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      setEditing(false);
      load();
    } finally { setSaving(false); }
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/zappo/crm/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: comment, meetingId: id }) });
      setComment('');
      load();
    } finally { setSaving(false); }
  };

  const deleteComment = async (cid: string) => {
    await fetch(`/api/zappo/crm/comments/${cid}`, { method: 'DELETE' });
    load();
  };

  const deleteMeeting = async () => {
    if (!confirm('Delete this meeting note?')) return;
    await fetch(`/api/zappo/crm/meetings/${id}`, { method: 'DELETE' });
    router.push('/zappo/crm/meetings');
  };

  if (loading) return <div className={pageMargin}><p className="text-muted-foreground">Loading…</p></div>;
  if (!meeting) return <div className={pageMargin}><p className="text-destructive">Meeting not found.</p></div>;

  return (
    <div className={`${pageMargin} flex flex-col gap-6`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/zappo/crm/meetings')}>
            <ArrowLeft className="size-4 mr-1" /> Back
          </Button>
          <h2 className={heading2Style}>{meeting.title}</h2>
        </div>
        <div className="flex gap-2">
          {editing
            ? <><Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button><Button variant="success" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button></>
            : <><Button variant="outline" onClick={() => setEditing(true)}>Edit</Button><Button variant="destructive" onClick={deleteMeeting}>Delete</Button></>
          }
        </div>
      </div>

      <Card>
        <CardContent className="py-4">
          {editing ? (
            <div className="flex flex-col gap-3">
              <Input placeholder="Title" value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Attendees" value={form.attendees ?? ''} onChange={(e) => setForm({ ...form, attendees: e.target.value })} />
                <Input type="datetime-local" value={form.meetingAt ? form.meetingAt.slice(0, 16) : ''} onChange={(e) => setForm({ ...form, meetingAt: e.target.value })} />
              </div>
              <textarea className="w-full border border-input rounded-md p-3 text-sm bg-background resize-none min-h-[120px]" value={form.content ?? ''} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Notes…" />
            </div>
          ) : (
            <div className="flex flex-col gap-3 text-sm">
              {meeting.meetingAt && <p className="text-muted-foreground">{new Date(meeting.meetingAt).toLocaleString('en-IN')}</p>}
              {meeting.attendees && <p><span className="text-muted-foreground">Attendees: </span>{meeting.attendees}</p>}
              {meeting.content && <p className="whitespace-pre-wrap mt-2">{meeting.content}</p>}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments */}
      <div>
        <h3 className="font-semibold mb-3">Comments</h3>
        <div className="flex gap-2 mb-3">
          <Input placeholder="Add a comment…" value={comment} onChange={(e) => setComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addComment()} className="flex-1" />
          <Button variant="outline" onClick={addComment} disabled={saving || !comment.trim()}>Post</Button>
        </div>
        <div className="flex flex-col gap-2">
          {(meeting.comments ?? []).map((c) => (
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
          {(meeting.comments ?? []).length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
        </div>
      </div>
    </div>
  );
};