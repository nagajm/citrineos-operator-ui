'use client';

import { useEffect, useState } from 'react';
import { Button } from '@lib/client/components/ui/button';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { Badge } from '@lib/client/components/ui/badge';
import { Input } from '@lib/client/components/ui/input';
import { Plus, Trash2, Printer, ChevronDown, ChevronUp } from 'lucide-react';
import type { Quotation, QuotationItem } from '@lib/zappo/crm-types';

const STATUS_LABELS: Record<Quotation['status'], string> = {
  draft: 'Draft', sent: 'Sent', accepted: 'Accepted', rejected: 'Rejected',
};
const STATUS_VARIANT: Record<Quotation['status'], string> = {
  draft: 'secondary', sent: 'outline', accepted: 'default', rejected: 'destructive',
};

const BLANK_ITEM: QuotationItem = { description: '', quantity: 1, unitPrice: 0 };

function calcTotals(items: QuotationItem[], gstPercent: number) {
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const gst = parseFloat((subtotal * gstPercent / 100).toFixed(2));
  return { subtotal, gst, total: subtotal + gst };
}

function fmt(n: number) { return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }

// ── Print view ────────────────────────────────────────────────────────────────
function PrintView({ q, leadName }: { q: Quotation; leadName: string }) {
  const { subtotal, gst, total } = calcTotals(q.items, q.gstPercent);
  return (
    <div id="quotation-print" className="hidden print:block p-8 font-sans text-sm text-black">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold">Zappo EV Charging</h1>
          <p className="text-gray-500">zappoevcharging.com</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-semibold">{q.title}</p>
          <p className="text-gray-500">#{q.id}</p>
          {q.validUntil && <p className="text-gray-500">Valid until: {new Date(q.validUntil).toLocaleDateString('en-IN')}</p>}
        </div>
      </div>
      <p className="mb-6"><strong>To:</strong> {leadName}</p>
      <table className="w-full border-collapse mb-6">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left py-2 w-1/2">Description</th>
            <th className="text-right py-2 w-1/6">Qty</th>
            <th className="text-right py-2 w-1/6">Unit Price</th>
            <th className="text-right py-2 w-1/6">Amount</th>
          </tr>
        </thead>
        <tbody>
          {q.items.map((item, i) => (
            <tr key={i} className="border-b border-gray-200">
              <td className="py-2">{item.description}</td>
              <td className="text-right py-2">{item.quantity}</td>
              <td className="text-right py-2">{fmt(item.unitPrice)}</td>
              <td className="text-right py-2">{fmt(item.quantity * item.unitPrice)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ml-auto w-64">
        <div className="flex justify-between py-1"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
        <div className="flex justify-between py-1"><span>GST ({q.gstPercent}%)</span><span>{fmt(gst)}</span></div>
        <div className="flex justify-between py-2 font-bold border-t-2 border-black text-base"><span>Total</span><span>{fmt(total)}</span></div>
      </div>
      {q.notes && <p className="mt-6 text-gray-600 whitespace-pre-wrap"><strong>Notes:</strong> {q.notes}</p>}
    </div>
  );
}

// ── Quotation form ────────────────────────────────────────────────────────────
function QuotationForm({
  leadId, initial, onSaved, onCancel,
}: {
  leadId: string;
  initial?: Quotation;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? 'Quotation');
  const [validUntil, setValidUntil] = useState(initial?.validUntil ? initial.validUntil.slice(0, 10) : '');
  const [gstPercent, setGstPercent] = useState(initial?.gstPercent ?? 18);
  const [notes, setNotes] = useState(initial?.notes ?? '');
  const [items, setItems] = useState<QuotationItem[]>(
    initial?.items?.length ? initial.items : [{ ...BLANK_ITEM }],
  );
  const [saving, setSaving] = useState(false);

  const setItem = (i: number, patch: Partial<QuotationItem>) =>
    setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it));
  const addItem = () => setItems((prev) => [...prev, { ...BLANK_ITEM }]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));

  const { subtotal, gst, total } = calcTotals(items, gstPercent);

  const save = async () => {
    setSaving(true);
    try {
      const body = { leadId, title, gstPercent: Number(gstPercent), validUntil: validUntil || null, notes, items };
      if (initial) {
        await fetch(`/api/zappo/crm/quotations/${initial.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
      } else {
        await fetch('/api/zappo/crm/quotations', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        });
      }
      onSaved();
    } finally { setSaving(false); }
  };

  return (
    <Card className="border-dashed">
      <CardContent className="py-4 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} title="Valid until" />
        </div>

        {/* Line items */}
        <div>
          <div className="grid grid-cols-[1fr_80px_110px_100px_36px] gap-2 text-xs font-medium text-muted-foreground mb-1 px-1">
            <span>Description</span><span className="text-right">Qty</span><span className="text-right">Unit Price</span><span className="text-right">Amount</span><span/>
          </div>
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-[1fr_80px_110px_100px_36px] gap-2 mb-2">
              <Input placeholder="Item description" value={item.description} onChange={(e) => setItem(i, { description: e.target.value })} />
              <Input type="number" min={1} value={item.quantity} onChange={(e) => setItem(i, { quantity: Number(e.target.value) })} className="text-right" />
              <Input type="number" min={0} value={item.unitPrice} onChange={(e) => setItem(i, { unitPrice: Number(e.target.value) })} className="text-right" placeholder="₹" />
              <div className="flex items-center justify-end text-sm font-medium">
                {fmt(item.quantity * item.unitPrice)}
              </div>
              <button onClick={() => removeItem(i)} className="flex items-center justify-center text-muted-foreground hover:text-destructive">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addItem} className="mt-1">
            <Plus className="size-3 mr-1" /> Add item
          </Button>
        </div>

        {/* Totals + GST */}
        <div className="flex gap-6 justify-end items-end">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">GST %</span>
            <Input type="number" min={0} max={100} value={gstPercent} onChange={(e) => setGstPercent(Number(e.target.value))} className="w-20 text-right" />
          </div>
          <div className="text-right text-sm space-y-0.5">
            <div className="text-muted-foreground">Subtotal: <span className="text-foreground font-medium">{fmt(subtotal)}</span></div>
            <div className="text-muted-foreground">GST ({gstPercent}%): <span className="text-foreground font-medium">{fmt(gst)}</span></div>
            <div className="font-bold text-base">Total: {fmt(total)}</div>
          </div>
        </div>

        <textarea
          className="w-full border border-input rounded-md p-3 text-sm bg-background resize-none min-h-[60px]"
          placeholder="Notes (payment terms, validity, etc.)…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button variant="success" size="sm" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : initial ? 'Update' : 'Create Quotation'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Quotation card ────────────────────────────────────────────────────────────
function QuotationCard({
  q, leadName, onEdit, onDelete, onStatusChange,
}: {
  q: Quotation;
  leadName: string;
  onEdit: () => void;
  onDelete: () => void;
  onStatusChange: (status: Quotation['status']) => void;
}) {
  const [open, setOpen] = useState(false);
  const { subtotal, gst, total } = calcTotals(q.items, q.gstPercent);

  const print = () => {
    const prev = document.title;
    document.title = `${q.title} — ${leadName}`;
    window.print();
    document.title = prev;
  };

  return (
    <>
      <PrintView q={q} leadName={leadName} />
      <Card className="shadow-none">
        <CardContent className="py-3 px-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => setOpen((v) => !v)} className="text-muted-foreground">
                {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </button>
              <div>
                <p className="font-medium text-sm">{q.title} <span className="text-muted-foreground text-xs">#{q.id}</span></p>
                <p className="text-xs text-muted-foreground">{fmt(total)} total · {q.items.length} item{q.items.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={STATUS_VARIANT[q.status] as any}>{STATUS_LABELS[q.status]}</Badge>
              <button onClick={print} className="p-1.5 rounded hover:bg-muted text-muted-foreground" title="Print"><Printer className="size-4" /></button>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onEdit}>Edit</Button>
              <button onClick={onDelete} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Delete">
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>

          {open && (
            <div className="mt-4 border-t pt-4 flex flex-col gap-3">
              {/* Status actions */}
              <div className="flex gap-1.5 flex-wrap">
                {(['draft', 'sent', 'accepted', 'rejected'] as Quotation['status'][]).map((s) => (
                  <Button key={s} size="sm" variant={q.status === s ? 'default' : 'outline'}
                    className="h-7 text-xs" onClick={() => onStatusChange(s)}>
                    {STATUS_LABELS[s]}
                  </Button>
                ))}
              </div>

              {/* Items */}
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b">
                    <th className="text-left pb-1">Description</th>
                    <th className="text-right pb-1 w-16">Qty</th>
                    <th className="text-right pb-1 w-28">Unit Price</th>
                    <th className="text-right pb-1 w-28">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {q.items.map((item, i) => (
                    <tr key={i} className="border-b border-muted/50">
                      <td className="py-1.5">{item.description}</td>
                      <td className="text-right py-1.5">{item.quantity}</td>
                      <td className="text-right py-1.5">{fmt(item.unitPrice)}</td>
                      <td className="text-right py-1.5 font-medium">{fmt(item.quantity * item.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="text-sm text-right space-y-0.5">
                <div className="text-muted-foreground">Subtotal: <span className="text-foreground">{fmt(subtotal)}</span></div>
                <div className="text-muted-foreground">GST ({q.gstPercent}%): <span className="text-foreground">{fmt(gst)}</span></div>
                <div className="font-bold text-base">Total: {fmt(total)}</div>
              </div>

              {q.notes && <p className="text-sm text-muted-foreground whitespace-pre-wrap border-t pt-2">{q.notes}</p>}
              {q.validUntil && <p className="text-xs text-muted-foreground">Valid until: {new Date(q.validUntil).toLocaleDateString('en-IN')}</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export function QuotationSection({ leadId, leadName }: { leadId: string; leadName: string }) {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [showNew, setShowNew] = useState(false);
  const [editing, setEditing] = useState<Quotation | null>(null);

  const load = () => {
    fetch(`/api/zappo/crm/leads/${leadId}/quotations`)
      .then((r) => r.json())
      .then((d: any[]) => setQuotations(Array.isArray(d) ? d : []))
      .catch(() => {});
  };

  useEffect(() => { load(); }, [leadId]);

  const deleteQ = async (id: number) => {
    if (!window.confirm('Delete this quotation?')) return;
    await fetch(`/api/zappo/crm/quotations/${id}`, { method: 'DELETE' });
    load();
  };

  const changeStatus = async (id: number, status: Quotation['status']) => {
    await fetch(`/api/zappo/crm/quotations/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Quotations</h3>
        {!showNew && !editing && (
          <Button variant="outline" size="sm" onClick={() => setShowNew(true)}>
            <Plus className="size-4 mr-1" /> New Quotation
          </Button>
        )}
      </div>

      {(showNew && !editing) && (
        <QuotationForm
          leadId={leadId}
          onSaved={() => { setShowNew(false); load(); }}
          onCancel={() => setShowNew(false)}
        />
      )}

      {editing && (
        <QuotationForm
          leadId={leadId}
          initial={editing}
          onSaved={() => { setEditing(null); load(); }}
          onCancel={() => setEditing(null)}
        />
      )}

      <div className="flex flex-col gap-2 mt-2">
        {quotations.map((q) => (
          <QuotationCard
            key={q.id}
            q={q}
            leadName={leadName}
            onEdit={() => { setShowNew(false); setEditing(q); }}
            onDelete={() => deleteQ(q.id)}
            onStatusChange={(s) => changeStatus(q.id, s)}
          />
        ))}
        {quotations.length === 0 && !showNew && (
          <p className="text-sm text-muted-foreground">No quotations yet.</p>
        )}
      </div>
    </div>
  );
}