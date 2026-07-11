'use client';

import { useEffect, useState } from 'react';
import { Button } from '@lib/client/components/ui/button';
import { Card, CardContent } from '@lib/client/components/ui/card';
import { Input } from '@lib/client/components/ui/input';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import type { CrmTag } from '@lib/zappo/crm-types';

const PRESET_COLORS = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F97316',
  '#EAB308', '#22C55E', '#14B8A6', '#3B82F6', '#64748B',
];

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={`w-6 h-6 rounded-full border-2 transition-transform ${value === c ? 'border-foreground scale-110' : 'border-transparent hover:scale-105'}`}
          style={{ background: c }}
        />
      ))}
    </div>
  );
}

export const CrmTagsPage = () => {
  const [tags, setTags] = useState<CrmTag[]>([]);
  const [loading, setLoading] = useState(true);

  // New tag form
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [creating, setCreating] = useState(false);

  // Inline edit
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/zappo/crm/tags')
      .then((r) => r.json())
      .then((d) => setTags(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const createTag = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/zappo/crm/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });
      if (!res.ok) { alert('A tag with that name already exists.'); return; }
      setNewName('');
      setNewColor(PRESET_COLORS[0]);
      load();
    } finally { setCreating(false); }
  };

  const startEdit = (tag: CrmTag) => {
    setEditId(tag.id);
    setEditName(tag.name);
    setEditColor(tag.color);
  };

  const saveEdit = async () => {
    if (!editId || !editName.trim()) return;
    setSaving(true);
    try {
      await fetch(`/api/zappo/crm/tags/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName.trim(), color: editColor }),
      });
      setEditId(null);
      load();
    } finally { setSaving(false); }
  };

  const deleteTag = async (id: number, name: string) => {
    if (!window.confirm(`Delete tag "${name}"? It will be removed from all plans.`)) return;
    await fetch(`/api/zappo/crm/tags/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className={`${pageMargin} flex flex-col gap-6`}>
      <h2 className={heading2Style}>Tags</h2>

      {/* Create new tag */}
      <Card>
        <CardContent className="py-4 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">New Tag</p>
          <div className="flex items-center gap-3">
            <Input
              placeholder="Tag name…"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && createTag()}
              className="max-w-xs"
            />
            <span
              className="w-8 h-8 rounded-full border-2 border-foreground/20 shrink-0"
              style={{ background: newColor }}
            />
          </div>
          <ColorPicker value={newColor} onChange={setNewColor} />
          <div>
            <Button variant="success" size="sm" onClick={createTag} disabled={creating || !newName.trim()}>
              <Plus className="size-4 mr-1.5" /> {creating ? 'Creating…' : 'Create Tag'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tag list */}
      {loading && <p className="text-muted-foreground">Loading…</p>}

      <div className="flex flex-col gap-2">
        {tags.map((tag) =>
          editId === tag.id ? (
            /* inline edit row */
            <Card key={tag.id} className="border-primary/40">
              <CardContent className="py-3 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full shrink-0" style={{ background: editColor }} />
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="max-w-xs"
                    autoFocus
                  />
                  <div className="flex gap-1 ml-auto">
                    <Button size="sm" variant="ghost" onClick={() => setEditId(null)} title="Cancel">
                      <X className="size-4" />
                    </Button>
                    <Button size="sm" variant="success" onClick={saveEdit} disabled={saving || !editName.trim()} title="Save">
                      <Check className="size-4" />
                    </Button>
                  </div>
                </div>
                <ColorPicker value={editColor} onChange={setEditColor} />
              </CardContent>
            </Card>
          ) : (
            /* read row */
            <Card key={tag.id} className="shadow-none">
              <CardContent className="py-3 flex items-center gap-3">
                <span className="w-7 h-7 rounded-full shrink-0" style={{ background: tag.color }} />
                <span
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                  style={{ background: tag.color }}
                >
                  {tag.name}
                </span>
                <span className="text-xs text-muted-foreground ml-1">
                  Added {new Date(tag.createdAt).toLocaleDateString('en-IN')}
                </span>
                <div className="ml-auto flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(tag)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteTag(tag.id, tag.name)} className="text-destructive">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        )}
        {!loading && tags.length === 0 && (
          <p className="text-sm text-muted-foreground">No tags yet. Create your first tag above.</p>
        )}
      </div>
    </div>
  );
};
