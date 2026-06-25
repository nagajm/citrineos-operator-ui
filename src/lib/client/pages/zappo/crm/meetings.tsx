'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@lib/client/components/ui/button';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { Input } from '@lib/client/components/ui/input';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { Plus, ChevronRight, Calendar } from 'lucide-react';
import type { MeetingNote } from '@lib/zappo/crm-types';

interface MeetingForm { title: string; attendees: string; meetingAt: string; content: string; }
const BLANK: MeetingForm = { title: '', attendees: '', meetingAt: '', content: '' };

export const CrmMeetingsPage = () => {
  const router = useRouter();
  const [meetings, setMeetings] = useState<MeetingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<MeetingForm>(BLANK);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/zappo/crm/meetings')
      .then((r) => r.json())
      .then((d) => setMeetings(d.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

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
        {meetings.map((m) => (
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
              <ChevronRight className="size-4 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
        {!loading && meetings.length === 0 && <p className="text-sm text-muted-foreground">No meetings yet.</p>}
      </div>
    </div>
  );
};