'use client';

import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import { Button } from '@lib/client/components/ui/button';
import { Card, CardContent } from '@lib/client/components/ui/card';
import { Input } from '@lib/client/components/ui/input';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import {
  Plus, Trash2, Download, ExternalLink, Link2, FileText,
  Pencil, Check, X, ChevronDown, ChevronUp, Paperclip,
} from 'lucide-react';
import type { KnowledgeEntry, KnowledgeFile } from '@lib/zappo/crm-types';

function fmtSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function domain(url: string) {
  try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
}

// ─── link row inside the form ─────────────────────────────────────────────────
interface LinkRow { label?: string; url: string; }

function LinkInput({ row, onChange, onRemove }: {
  row: LinkRow;
  onChange: (r: LinkRow) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-2 items-center">
      <Input
        placeholder="https://…"
        value={row.url}
        onChange={(e) => onChange({ ...row, url: e.target.value })}
        className="flex-1"
      />
      <Input
        placeholder="Label (optional)"
        value={row.label}
        onChange={(e) => onChange({ ...row, label: e.target.value })}
        className="w-40"
      />
      <button onClick={onRemove} className="text-muted-foreground hover:text-destructive shrink-0">
        <X className="size-4" />
      </button>
    </div>
  );
}

// ─── add / edit form ──────────────────────────────────────────────────────────
interface KnowledgeForm {
  title: string;
  content: string;
  links: LinkRow[];
  pendingFiles: File[];
}

const BLANK: KnowledgeForm = { title: '', content: '', links: [], pendingFiles: [] };

function KnowledgeFormCard({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial: KnowledgeForm;
  onSave: (form: KnowledgeForm) => Promise<void>;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<KnowledgeForm>(initial);
  const fileRef = useRef<HTMLInputElement>(null);

  const addLink = () => setForm((f) => ({ ...f, links: [...f.links, { url: '', label: '' }] }));
  const setLink = (i: number, row: LinkRow) =>
    setForm((f) => { const links = [...f.links]; links[i] = row; return { ...f, links }; });
  const removeLink = (i: number) =>
    setForm((f) => ({ ...f, links: f.links.filter((_, j) => j !== i) }));

  const pickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    setForm((f) => ({ ...f, pendingFiles: [...f.pendingFiles, ...picked] }));
    if (fileRef.current) fileRef.current.value = '';
  };
  const removeFile = (i: number) =>
    setForm((f) => ({ ...f, pendingFiles: f.pendingFiles.filter((_, j) => j !== i) }));

  const validLinks = form.links.filter((l) => l.url.trim().startsWith('http'));

  return (
    <Card className="border-primary/30">
      <CardContent className="py-5 flex flex-col gap-4">
        {/* title */}
        <Input
          placeholder="Title *"
          value={form.title}
          autoFocus
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          className="text-base font-semibold"
        />

        {/* content */}
        <textarea
          className="w-full border border-input rounded-md p-3 text-sm bg-background resize-none min-h-[120px] leading-relaxed"
          placeholder="Write notes, context, decisions, anything useful…"
          value={form.content}
          onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
        />

        {/* links */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <Link2 className="size-3" /> Links
          </p>
          {form.links.map((row, i) => (
            <LinkInput key={i} row={row} onChange={(r) => setLink(i, r)} onRemove={() => removeLink(i)} />
          ))}
          <button
            type="button"
            onClick={addLink}
            className="self-start text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Plus className="size-3" /> Add link
          </button>
        </div>

        {/* files */}
        <div className="flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <Paperclip className="size-3" /> Files
          </p>
          {form.pendingFiles.map((f, i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <FileText className="size-4 text-blue-500 shrink-0" />
              <span className="flex-1 truncate">{f.name}</span>
              <span className="text-xs text-muted-foreground">{fmtSize(f.size)}</span>
              <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive">
                <X className="size-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="self-start text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Paperclip className="size-3" /> Attach file
          </button>
          <input ref={fileRef} type="file" multiple className="hidden" onChange={pickFiles} />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button
            variant="success"
            size="sm"
            disabled={saving || !form.title.trim()}
            onClick={() => onSave({ ...form, links: validLinks })}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── knowledge card ───────────────────────────────────────────────────────────
function KnowledgeCard({
  entry,
  onEdit,
  onDelete,
  onDeleteFile,
}: {
  entry: KnowledgeEntry;
  onEdit: (e: KnowledgeEntry) => void;
  onDelete: (id: number) => void;
  onDeleteFile: (entryId: number, fileId: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const longContent = (entry.content?.length ?? 0) > 280;
  const displayContent = longContent && !expanded
    ? entry.content!.slice(0, 280) + '…'
    : entry.content;

  return (
    <Card className="shadow-none">
      <CardContent className="py-4 flex flex-col gap-3">
        {/* header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-semibold text-sm leading-snug">{entry.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {new Date(entry.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => onEdit(entry)}>
              <Pencil className="size-3.5" />
            </Button>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-destructive" onClick={() => onDelete(entry.id)}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        </div>

        {/* content */}
        {entry.content && (
          <div>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{displayContent}</p>
            {longContent && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="mt-1 text-xs text-primary hover:underline flex items-center gap-1"
              >
                {expanded ? <><ChevronUp className="size-3" /> Show less</> : <><ChevronDown className="size-3" /> Read more</>}
              </button>
            )}
          </div>
        )}

        {/* links */}
        {entry.links?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {entry.links.map((l, i) => (
              <a
                key={i}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-input bg-muted/40 text-xs font-medium hover:bg-muted transition-colors"
              >
                <ExternalLink className="size-3 text-primary" />
                {l.label || domain(l.url)}
              </a>
            ))}
          </div>
        )}

        {/* files */}
        {entry.files?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {entry.files.map((f) => (
              <div key={f.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-input bg-blue-50/60 text-xs">
                <FileText className="size-3.5 text-blue-500 shrink-0" />
                <span className="max-w-[180px] truncate font-medium">{f.name}</span>
                {f.size && <span className="text-muted-foreground">{fmtSize(f.size)}</span>}
                <a
                  href={`/api/zappo/crm/knowledge/${entry.id}/files/${f.id}/download`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/70"
                >
                  <Download className="size-3.5" />
                </a>
                <button
                  onClick={() => onDeleteFile(entry.id, f.id)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────
export const CrmKnowledgeBasePage = () => {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<KnowledgeEntry | null>(null);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/zappo/crm/knowledge')
      .then((r) => r.json())
      .then((d) => setEntries(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const uploadFiles = async (entryId: number, files: File[]) => {
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      await fetch(`/api/zappo/crm/knowledge/${entryId}/files`, { method: 'POST', body: fd });
    }
  };

  const handleCreate = async (form: { title: string; content: string; links: LinkRow[]; pendingFiles: File[] }) => {
    setSaving(true);
    try {
      const res = await fetch('/api/zappo/crm/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          content: form.content.trim() || undefined,
          links: form.links,
        }),
      });
      const created = await res.json();
      if (form.pendingFiles.length) await uploadFiles(created.id, form.pendingFiles);
      setShowForm(false);
      load();
    } finally { setSaving(false); }
  };

  const handleEdit = async (form: { title: string; content: string; links: LinkRow[]; pendingFiles: File[] }) => {
    if (!editEntry) return;
    setSaving(true);
    try {
      await fetch(`/api/zappo/crm/knowledge/${editEntry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          content: form.content.trim() || undefined,
          links: form.links,
        }),
      });
      if (form.pendingFiles.length) await uploadFiles(editEntry.id, form.pendingFiles);
      setEditEntry(null);
      load();
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    const entry = entries.find((e) => e.id === id);
    if (!window.confirm(`Delete "${entry?.title}"?`)) return;
    await fetch(`/api/zappo/crm/knowledge/${id}`, { method: 'DELETE' });
    load();
  };

  const handleDeleteFile = async (entryId: number, fileId: number) => {
    await fetch(`/api/zappo/crm/knowledge/${entryId}/files/${fileId}`, { method: 'DELETE' });
    load();
  };

  const startEdit = (entry: KnowledgeEntry) => {
    setShowForm(false);
    setEditEntry(entry);
  };

  const editInitial: KnowledgeForm = editEntry
    ? { title: editEntry.title, content: editEntry.content ?? '', links: editEntry.links ?? [], pendingFiles: [] }
    : BLANK;

  return (
    <div className={`${pageMargin} flex flex-col gap-5`}>
      <div className="flex items-center justify-between">
        <h2 className={heading2Style}>Knowledge Base</h2>
        {!showForm && !editEntry && (
          <Button variant="success" onClick={() => setShowForm(true)}>
            <Plus className="size-4 mr-2" /> Add Knowledge
          </Button>
        )}
      </div>

      {showForm && (
        <KnowledgeFormCard
          initial={BLANK}
          onSave={handleCreate}
          onCancel={() => setShowForm(false)}
          saving={saving}
        />
      )}

      {loading && <p className="text-muted-foreground text-sm">Loading…</p>}

      <div className="flex flex-col gap-3">
        {entries.map((entry) =>
          editEntry?.id === entry.id ? (
            <KnowledgeFormCard
              key={entry.id}
              initial={editInitial}
              onSave={handleEdit}
              onCancel={() => setEditEntry(null)}
              saving={saving}
            />
          ) : (
            <KnowledgeCard
              key={entry.id}
              entry={entry}
              onEdit={startEdit}
              onDelete={handleDelete}
              onDeleteFile={handleDeleteFile}
            />
          )
        )}
        {!loading && entries.length === 0 && !showForm && (
          <p className="text-sm text-muted-foreground">
            Nothing here yet — add knowledge entries with notes, links, and file attachments.
          </p>
        )}
      </div>
    </div>
  );
};
