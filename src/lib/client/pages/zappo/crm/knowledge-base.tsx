'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@lib/client/components/ui/button';
import { Card, CardContent } from '@lib/client/components/ui/card';
import { Input } from '@lib/client/components/ui/input';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { Upload, FileText, Link2, AlignLeft, Trash2, Download, ExternalLink, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import type { CrmDocument } from '@lib/zappo/crm-types';

function fmtSize(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  file: <FileText className="size-5 text-blue-500 shrink-0" />,
  url:  <Link2   className="size-5 text-green-500 shrink-0" />,
  text: <AlignLeft className="size-5 text-purple-500 shrink-0" />,
};

type AddMode = 'url' | 'text' | null;

export const CrmKnowledgeBasePage = () => {
  const [docs, setDocs] = useState<CrmDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // URL form
  const [urlName, setUrlName] = useState('');
  const [urlValue, setUrlValue] = useState('');
  const [urlDesc, setUrlDesc] = useState('');

  // Text form
  const [textName, setTextName] = useState('');
  const [textContent, setTextContent] = useState('');
  const [textDesc, setTextDesc] = useState('');

  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/zappo/crm/documents')
      .then((r) => r.json())
      .then((d) => setDocs(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('name', file.name);
    try {
      await fetch('/api/zappo/crm/documents', { method: 'POST', body: fd });
      load();
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const saveEntry = async () => {
    if (!addMode) return;
    setSaving(true);
    try {
      const body =
        addMode === 'url'
          ? { type: 'url', name: urlName.trim() || urlValue, url: urlValue, description: urlDesc || undefined }
          : { type: 'text', name: textName.trim(), content: textContent, description: textDesc || undefined };
      await fetch('/api/zappo/crm/documents/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setAddMode(null);
      setUrlName(''); setUrlValue(''); setUrlDesc('');
      setTextName(''); setTextContent(''); setTextDesc('');
      load();
    } finally { setSaving(false); }
  };

  const del = async (id: string) => {
    await fetch(`/api/zappo/crm/documents/${id}`, { method: 'DELETE' });
    load();
  };

  const canSaveUrl = urlValue.trim().startsWith('http');
  const canSaveText = textName.trim() && textContent.trim();

  return (
    <div className={`${pageMargin} flex flex-col gap-6`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className={heading2Style}>Knowledge Base</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setAddMode(addMode === 'url' ? null : 'url')}>
            <Link2 className="size-4 mr-1.5" /> Add Link
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAddMode(addMode === 'text' ? null : 'text')}>
            <AlignLeft className="size-4 mr-1.5" /> Add Note
          </Button>
          <Button variant="success" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload className="size-4 mr-1.5" /> {uploading ? 'Uploading…' : 'Upload File'}
          </Button>
          <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
        </div>
      </div>

      {/* URL form */}
      {addMode === 'url' && (
        <Card className="border-dashed">
          <CardContent className="py-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Add Link</p>
              <button onClick={() => setAddMode(null)}><X className="size-4 text-muted-foreground" /></button>
            </div>
            <Input placeholder="URL (https://…) *" value={urlValue} onChange={(e) => setUrlValue(e.target.value)} />
            <Input placeholder="Title (optional — defaults to URL)" value={urlName} onChange={(e) => setUrlName(e.target.value)} />
            <Input placeholder="Description (optional)" value={urlDesc} onChange={(e) => setUrlDesc(e.target.value)} />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setAddMode(null)}>Cancel</Button>
              <Button variant="success" size="sm" onClick={saveEntry} disabled={saving || !canSaveUrl}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Text / note form */}
      {addMode === 'text' && (
        <Card className="border-dashed">
          <CardContent className="py-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Add Note</p>
              <button onClick={() => setAddMode(null)}><X className="size-4 text-muted-foreground" /></button>
            </div>
            <Input placeholder="Title *" value={textName} onChange={(e) => setTextName(e.target.value)} />
            <Input placeholder="Description (optional)" value={textDesc} onChange={(e) => setTextDesc(e.target.value)} />
            <textarea
              className="w-full border border-input rounded-md p-3 text-sm bg-background resize-none min-h-[120px]"
              placeholder="Note content *"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setAddMode(null)}>Cancel</Button>
              <Button variant="success" size="sm" onClick={saveEntry} disabled={saving || !canSaveText}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-muted-foreground">Loading…</p>}

      <div className="flex flex-col gap-2">
        {docs.map((d) => {
          const type = (d.type ?? 'file') as 'file' | 'url' | 'text';
          const isExpanded = expanded === d.id;
          return (
            <Card key={d.id}>
              <CardContent className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {TYPE_ICON[type]}
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{d.name}</p>
                      {d.description && <p className="text-xs text-muted-foreground mt-0.5">{d.description}</p>}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {[
                          type === 'file' ? d.mimeType : null,
                          type === 'file' ? fmtSize(d.size) : null,
                          new Date(d.createdAt).toLocaleDateString('en-IN'),
                        ].filter(Boolean).join(' · ')}
                      </p>
                      {type === 'url' && d.url && (
                        <a href={d.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline truncate block max-w-xs mt-0.5">
                          {d.url}
                        </a>
                      )}
                      {type === 'text' && d.content && isExpanded && (
                        <p className="text-sm mt-2 whitespace-pre-wrap border-l-2 border-muted pl-3 text-muted-foreground">
                          {d.content}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {type === 'file' && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/api/zappo/crm/documents/${d.id}/download`} target="_blank" rel="noopener noreferrer">
                          <Download className="size-4" />
                        </a>
                      </Button>
                    )}
                    {type === 'url' && d.url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={d.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="size-4" />
                        </a>
                      </Button>
                    )}
                    {type === 'text' && (
                      <Button variant="outline" size="sm" onClick={() => setExpanded(isExpanded ? null : d.id)}>
                        {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => del(d.id)} className="text-destructive">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!loading && docs.length === 0 && (
          <p className="text-sm text-muted-foreground">Nothing in the knowledge base yet. Upload a file, add a link, or write a note.</p>
        )}
      </div>
    </div>
  );
};
