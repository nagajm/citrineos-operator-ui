'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@lib/client/components/ui/button';
import { Card, CardContent } from '@lib/client/components/ui/card';
import { Input } from '@lib/client/components/ui/input';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { ArrowLeft, Trash2 } from 'lucide-react';
import type { Vendor, CrmComment } from '@lib/zappo/crm-types';

interface VendorDetail extends Vendor { comments: CrmComment[]; }

export const CrmVendorDetailPage = ({ id }: { id: string }) => {
  const router = useRouter();
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Vendor>>({});
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    fetch(`/api/zappo/crm/vendors/${id}`)
      .then((r) => r.json())
      .then((d) => { setVendor(d); setForm(d); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      await fetch(`/api/zappo/crm/vendors/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      setEditing(false);
      load();
    } finally { setSaving(false); }
  };

  const addComment = async () => {
    if (!comment.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/zappo/crm/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: comment, vendorId: id }) });
      setComment('');
      load();
    } finally { setSaving(false); }
  };

  const deleteComment = async (cid: string) => {
    await fetch(`/api/zappo/crm/comments/${cid}`, { method: 'DELETE' });
    load();
  };

  const deleteVendor = async () => {
    if (!confirm('Delete this vendor?')) return;
    await fetch(`/api/zappo/crm/vendors/${id}`, { method: 'DELETE' });
    router.push('/zappo/crm/vendors');
  };

  if (loading) return <div className={pageMargin}><p className="text-muted-foreground">Loading…</p></div>;
  if (!vendor) return <div className={pageMargin}><p className="text-destructive">Vendor not found.</p></div>;

  return (
    <div className={`${pageMargin} flex flex-col gap-6`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push('/zappo/crm/vendors')}>
            <ArrowLeft className="size-4 mr-1" /> Back
          </Button>
          <h2 className={heading2Style}>{vendor.name}</h2>
        </div>
        <div className="flex gap-2">
          {editing
            ? <><Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button><Button variant="success" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button></>
            : <><Button variant="outline" onClick={() => setEditing(true)}>Edit</Button><Button variant="destructive" onClick={deleteVendor}>Delete</Button></>
          }
        </div>
      </div>

      <Card>
        <CardContent className="py-4">
          {editing ? (
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Vendor name" value={form.name ?? ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder="Contact name" value={form.contactName ?? ''} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
              <Input placeholder="Phone" value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input placeholder="Email" value={form.email ?? ''} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input placeholder="Category" value={form.category ?? ''} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              <Input placeholder="Address" value={form.address ?? ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              <textarea className="col-span-2 border border-input rounded-md p-3 text-sm bg-background resize-none min-h-[60px]" placeholder="Notes" value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm">
              {vendor.contactName && <><span className="text-muted-foreground">Contact</span><span>{vendor.contactName}</span></>}
              {vendor.phone && <><span className="text-muted-foreground">Phone</span><span>{vendor.phone}</span></>}
              {vendor.email && <><span className="text-muted-foreground">Email</span><span>{vendor.email}</span></>}
              {vendor.category && <><span className="text-muted-foreground">Category</span><span>{vendor.category}</span></>}
              {vendor.address && <><span className="text-muted-foreground">Address</span><span>{vendor.address}</span></>}
              {vendor.notes && <><span className="text-muted-foreground col-span-2">Notes</span><span className="col-span-2 whitespace-pre-wrap">{vendor.notes}</span></>}
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
          {(vendor.comments ?? []).map((c) => (
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
          {(vendor.comments ?? []).length === 0 && <p className="text-sm text-muted-foreground">No comments yet.</p>}
        </div>
      </div>
    </div>
  );
};