'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@lib/client/components/ui/button';
import { Card, CardContent } from '@lib/client/components/ui/card';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { Upload, FileText, Trash2, Download } from 'lucide-react';
import type { CrmDocument } from '@lib/zappo/crm-types';

function fmt(bytes?: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const CrmDocumentsPage = () => {
  const [docs, setDocs] = useState<CrmDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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

  const deleteDoc = async (id: string) => {
    await fetch(`/api/zappo/crm/documents/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className={`${pageMargin} flex flex-col gap-6`}>
      <div className="flex items-center justify-between">
        <h2 className={heading2Style}>Documents</h2>
        <Button variant="success" onClick={() => fileRef.current?.click()} disabled={uploading}>
          <Upload className="size-4 mr-2" /> {uploading ? 'Uploading…' : 'Upload File'}
        </Button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
      </div>

      {loading && <p className="text-muted-foreground">Loading…</p>}

      <div className="flex flex-col gap-2">
        {docs.map((d) => (
          <Card key={d.id}>
            <CardContent className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="size-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="font-medium text-sm">{d.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {[d.mimeType, fmt(d.size), new Date(d.createdAt).toLocaleDateString('en-IN')].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href={`/api/zappo/crm/documents/${d.id}/download`} target="_blank" rel="noopener noreferrer">
                    <Download className="size-4" />
                  </a>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteDoc(d.id)} className="text-destructive">
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {!loading && docs.length === 0 && <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>}
      </div>
    </div>
  );
};