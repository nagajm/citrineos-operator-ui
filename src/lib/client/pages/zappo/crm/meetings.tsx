'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@lib/client/components/ui/button';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { Input } from '@lib/client/components/ui/input';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { Plus, ChevronRight, Calendar } from 'lucide-react';
import type { MeetingNote, CrmUser } from '@lib/zappo/crm-types';

function initials(name: string) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
}

interface MeetingForm {
  title: string; attendees: string; meetingAt: string; content: string; assigneeId: number | null;
}
const BLANK: MeetingForm = { title: '', attendees: '', meetingAt: '', content: '', assigneeId: null };

export const CrmMeetingsPage = () => {
  const router = useRouter();
  const [meetings, setMeetings] = useState<MeetingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<MeetingForm>(BLANK);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<CrmUser[]>([]);
  const [usersMap, setUsersMap] = useState<Record<number, CrmUser>>({});

  const load = () => {
    setLoading(true);
    fetch('/api/zappo/crm/meetings')
      .then((r) => r.json())
      .then((d) => setMeetings(d.data ?? []))
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

  const createMeeting = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/zappo/crm/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, meetingAt: form.meetingAt || undefined }),
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
        <h2 className={heading2Style}>Meeting Notes</h2>
        <Button variant="success" onClick={() => setShowNew(true)}>
          <Plus className="size-4 mr-2" /> New Meeting
        </Button>
      </div>

      {showNew && (
        <Card className="border-dashed">
          <CardHeader className="pb-2 font-semibold">New Meeting Note</CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Input placeholder="Title *" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Attendees" value={form.attendees} onChange={(e) => setForm({ ...form, attendees: e.target.value })} />
              <Input type="datetime-local" value={form.meetingAt} onChange={(e) => setForm({ ...form, meetingAt: e.target.value })} />
            </div>
            <textarea
              className="w-full border border-input rounded-md p-3 text-sm bg-background resize-none min-h-[80px]"
              placeholder="Meeting notes…"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
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
              <Button variant="success" onClick={createMeeting} disabled={saving || !form.title.trim()}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-muted-foreground">Loading…</p>}

      <div className="flex flex-col gap-2">
        {meetings.map((m) => {
          const assignee = m.assigneeId ? usersMap[m.assigneeId] : null;
          return (
            <Card key={m.id} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => router.push(`/zappo/crm/meetings/${m.id}`)}>
              <CardContent className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Calendar className="size-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="font-medium">{m.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {m.meetingAt ? new Date(m.meetingAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'No date set'}
                      {m.attendees ? ` · ${m.attendees}` : ''}
                    </p>
                  </div>
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
        {!loading && meetings.length === 0 && <p className="text-sm text-muted-foreground">No meetings yet.</p>}
      </div>
    </div>
  );
};