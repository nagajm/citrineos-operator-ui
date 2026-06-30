'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@lib/client/components/ui/button';
import { Badge } from '@lib/client/components/ui/badge';
import { Input } from '@lib/client/components/ui/input';
import { Eye, EyeOff, Plus, Trash2, Download, Pencil, FileText, X, FileDown } from 'lucide-react';
import type { Quotation, CrmProduct, ProductWithDetails } from '@lib/zappo/crm-types';

// ── local form types ──────────────────────────────────────────────────────────
interface QItem {
  id?: string;
  description: string;
  hsnCode: string;
  unit: string;
  qty: number;
  unitCost: string;
  unitPrice: string;
  gstPercent: number;
  showInPdf: boolean;
}

interface QForm {
  title: string;
  validUntil: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  discountPercent: number;
  notes: string;
  termsAndConditions: string;
  items: QItem[];
}

const BLANK_ITEM: QItem = {
  description: '', hsnCode: '', unit: 'No.', qty: 1,
  unitCost: '', unitPrice: '0', gstPercent: 18, showInPdf: true,
};

const DEFAULT_TC =
  'Payment: 50% advance, balance before delivery.\n' +
  'Warranty: 1 year on hardware.\n' +
  'Delivery: 2–4 weeks from order confirmation.\n' +
  'Prices are exclusive of GST unless stated.';

const BLANK_FORM: QForm = {
  title: 'Quotation', validUntil: '', status: 'draft',
  discountPercent: 0, notes: '', termsAndConditions: DEFAULT_TC, items: [],
};

// ── helpers ───────────────────────────────────────────────────────────────────
function inr(n: number) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 0 });
}

function calcSummary(items: QItem[], discPct: number) {
  const visible = items.filter((it) => it.showInPdf);
  const pdfSub = visible.reduce((s, it) => s + (Number(it.qty) || 0) * (parseFloat(it.unitPrice) || 0), 0);
  const allSub = items.reduce((s, it) => s + (Number(it.qty) || 0) * (parseFloat(it.unitPrice) || 0), 0);
  const cost = items.reduce((s, it) => s + (Number(it.qty) || 0) * (parseFloat(it.unitCost) || 0), 0);
  const discAmt = pdfSub * (discPct / 100);
  const taxable = pdfSub - discAmt;
  const gstGroups: Record<number, number> = {};
  for (const it of visible) {
    const rate = Number(it.gstPercent) || 0;
    if (rate > 0) {
      const base = (Number(it.qty) || 0) * (parseFloat(it.unitPrice) || 0) * (1 - discPct / 100);
      gstGroups[rate] = (gstGroups[rate] ?? 0) + base * rate / 100;
    }
  }
  const totalGst = Object.values(gstGroups).reduce((s, v) => s + v, 0);
  const grandTotal = taxable + totalGst;
  const margin = cost > 0 ? ((allSub - cost) / cost * 100).toFixed(1) : null;
  return { pdfSub, allSub, cost, discAmt, taxable, gstGroups, totalGst, grandTotal, margin };
}

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  accepted: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

// ── product picker ────────────────────────────────────────────────────────────
function ProductPicker({ onSelect, onClose }: { onSelect: (d: ProductWithDetails) => void; onClose: () => void }) {
  const [products, setProducts] = useState<CrmProduct[]>([]);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/zappo/crm/products')
      .then((r) => r.json())
      .then((d) => setProducts(Array.isArray(d) ? d : (d.data ?? [])))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const filtered = products.filter(
    (p) => p.isActive && (!search || p.name.toLowerCase().includes(search.toLowerCase())),
  );

  const pick = async (p: CrmProduct) => {
    const r = await fetch(`/api/zappo/crm/products/${p.id}`);
    const detail: ProductWithDetails = await r.json();
    onSelect(detail);
    onClose();
  };

  return (
    <div ref={ref} className="absolute left-0 top-full z-50 bg-card border border-border rounded-lg shadow-xl w-72 mt-1">
      <div className="p-2 border-b border-border flex items-center gap-1">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products…" autoFocus className="text-sm h-8" />
        <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground shrink-0"><X className="h-3.5 w-3.5" /></button>
      </div>
      <div className="max-h-56 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4 text-center">No active products found.</p>
        ) : filtered.map((p) => (
          <button key={p.id} onClick={() => pick(p)}
            className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted/60 transition-colors flex items-center justify-between gap-2 border-b border-border/50 last:border-0"
          >
            <div>
              <div className="font-medium">{p.name}</div>
              {p.sku && <div className="text-xs text-muted-foreground">{p.sku}</div>}
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{p.itemCount ?? 0} items</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────
function FL({ children }: { children: React.ReactNode }) {
  return <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">{children}</label>;
}

function SumRow({ label, value, bold, color }: { label: string; value: string; bold?: boolean; color?: string }) {
  return (
    <div className={`flex justify-between items-center py-1 text-sm ${bold ? 'font-semibold' : ''}`}>
      <span className={color ?? (bold ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
      <span className={color ?? ''}>{value}</span>
    </div>
  );
}

// ── QuotationSection (exported) ───────────────────────────────────────────────
export function QuotationSection({ leadId, leadName }: { leadId: string; leadName: string }) {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<QForm>(BLANK_FORM);
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [generatingDocx, setGeneratingDocx] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  const loadQuotations = () => {
    setLoading(true);
    fetch(`/api/zappo/crm/leads/${leadId}/quotations`)
      .then((r) => r.json())
      .then((d) => setQuotations(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadQuotations(); }, [leadId]);

  const openNew = () => {
    setEditId(null);
    setForm({ ...BLANK_FORM, title: `Quotation — ${leadName}` });
    setShowBuilder(true);
  };

  const openEdit = (q: Quotation) => {
    setEditId(q.id);
    setForm({
      title: q.title ?? 'Quotation',
      validUntil: q.validUntil ? q.validUntil.split('T')[0] : '',
      status: q.status ?? 'draft',
      discountPercent: Number(q.discountPercent) || 0,
      notes: q.notes ?? '',
      termsAndConditions: q.termsAndConditions ?? DEFAULT_TC,
      items: (q.items ?? []).map((it) => ({
        id: it.id,
        description: it.description ?? '',
        hsnCode: (it as any).hsnCode ?? '',
        unit: (it as any).unit ?? 'No.',
        qty: Number((it as any).qty ?? (it as any).quantity ?? 1),
        unitCost: (it as any).unitCost != null ? String((it as any).unitCost) : '',
        unitPrice: String((it as any).unitPrice ?? 0),
        gstPercent: Number((it as any).gstPercent ?? 18),
        showInPdf: (it as any).showInPdf !== false,
      })),
    });
    setShowBuilder(true);
  };

  const buildBody = () => ({
    leadId,
    title: form.title,
    validUntil: form.validUntil || null,
    status: form.status,
    discountPercent: form.discountPercent,
    notes: form.notes || null,
    termsAndConditions: form.termsAndConditions || null,
    items: form.items.map((it, i) => ({
      ...it,
      unitCost: it.unitCost ? parseFloat(it.unitCost) : null,
      unitPrice: parseFloat(it.unitPrice) || 0,
      qty: Number(it.qty) || 1,
      order: i,
    })),
  });

  const save = async (): Promise<number> => {
    setSaving(true);
    try {
      if (editId) {
        await fetch(`/api/zappo/crm/quotations/${editId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildBody()),
        });
        loadQuotations();
        return editId;
      } else {
        const r = await fetch('/api/zappo/crm/quotations', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildBody()),
        });
        const created = await r.json();
        setEditId(created.id);
        loadQuotations();
        return created.id;
      }
    } finally {
      setSaving(false);
    }
  };

  const generatePdf = async () => {
    setGeneratingPdf(true);
    try {
      const qId = await save();
      const res = await fetch(`/api/zappo/crm/quotations/${qId}/pdf`, { method: 'POST' });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const q = quotations.find((x) => x.id === qId);
        a.download = `${q?.quotationNumber ?? `ZAP-quote-${qId}`}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        loadQuotations();
      } else {
        alert('PDF generation failed. Check server logs.');
      }
    } finally {
      setGeneratingPdf(false);
    }
  };

  const generateDocx = async () => {
    setGeneratingDocx(true);
    try {
      const qId = await save();
      const res = await fetch(`/api/zappo/crm/quotations/${qId}/docx`, { method: 'POST' });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const q = quotations.find((x) => x.id === qId);
        a.download = `${q?.quotationNumber ?? `ZAP-quote-${qId}`}.docx`;
        a.click();
        URL.revokeObjectURL(url);
        loadQuotations();
      } else {
        alert('Word document generation failed. Check server logs.');
      }
    } finally {
      setGeneratingDocx(false);
    }
  };

  const downloadExisting = async (q: Quotation, format: 'pdf' | 'docx' = 'pdf') => {
    if (format === 'pdf' && !q.pdfPath) { alert('PDF not generated yet. Open the quotation and click Generate PDF.'); return; }
    const res = await fetch(`/api/zappo/crm/quotations/${q.id}/${format}`);
    if (!res.ok) { alert(`${format.toUpperCase()} file not found on server. Please regenerate.`); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${q.quotationNumber ?? `quote-${q.id}`}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteQuotation = async (q: Quotation) => {
    if (!confirm(`Delete ${q.quotationNumber ?? 'this quotation'}?`)) return;
    await fetch(`/api/zappo/crm/quotations/${q.id}`, { method: 'DELETE' });
    if (editId === q.id) { setShowBuilder(false); setEditId(null); }
    loadQuotations();
  };

  const setItem = (i: number, field: keyof QItem, value: string | number | boolean) =>
    setForm((f) => { const items = [...f.items]; items[i] = { ...items[i], [field]: value }; return { ...f, items }; });

  const addFromProduct = (detail: ProductWithDetails) => {
    // Always pull ALL BOM items regardless of bomVisibility — user decides showInPdf per row
    const newItems: QItem[] = detail.bomItems.map((b) => ({
      id: undefined,
      description: b.description,
      hsnCode: b.hsnCode ?? '',
      unit: b.unit,
      qty: b.qty,
      unitCost: b.unitCost != null ? String(b.unitCost) : '',
      unitPrice: String(b.unitPrice),
      gstPercent: b.gstPercent,
      showInPdf: true,
    }));
    setForm((f) => ({ ...f, items: [...f.items, ...newItems] }));
  };

  const sum = calcSummary(form.items, form.discountPercent);
  const hiddenCount = form.items.filter((it) => !it.showInPdf).length;
  const currentQuotation = editId ? quotations.find((q) => q.id === editId) : null;

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Quotations</h3>
        {!showBuilder && (
          <Button size="sm" onClick={openNew}><Plus className="h-3.5 w-3.5 mr-1" /> New Quotation</Button>
        )}
      </div>

      {/* Quotation list */}
      {!loading && quotations.length > 0 && (
        <div className="space-y-2 mb-6">
          {quotations.map((q) => {
            const visItems = (q.items ?? []).filter((it: any) => it.showInPdf !== false);
            const sub = visItems.reduce((s: number, it: any) => s + (Number(it.qty ?? it.quantity) || 1) * (Number(it.unitPrice) || 0), 0);
            const disc = sub * (Number(q.discountPercent) || 0) / 100;
            const gst = visItems.reduce((s: number, it: any) => {
              const base = (Number(it.qty ?? it.quantity) || 1) * (Number(it.unitPrice) || 0) * (1 - (Number(q.discountPercent) || 0) / 100);
              return s + base * (Number(it.gstPercent) || 0) / 100;
            }, 0);
            const total = sub - disc + gst;
            return (
              <div key={q.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">{q.quotationNumber ?? `#${q.id}`}</span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase ${STATUS_BADGE[q.status] ?? STATUS_BADGE.draft}`}>{q.status}</span>
                    {q.pdfPath && <Badge variant="outline" className="text-[10px] px-1.5">PDF ready</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {q.title} · {new Date(q.createdAt).toLocaleDateString('en-IN')}
                    {total > 0 && <> · <span className="font-medium text-foreground">{inr(total)}</span></>}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(q)} className="h-7 px-2" title="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => downloadExisting(q, 'pdf')} className="h-7 px-2" title="Download PDF"><Download className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => downloadExisting(q, 'docx')} className="h-7 px-2" title="Download Word (.docx)"><FileDown className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteQuotation(q)} className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10" title="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Builder */}
      {showBuilder && (
        <div className="border border-border rounded-lg bg-card">
          {/* Builder header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {currentQuotation?.quotationNumber && (
                <span className="text-xs font-mono text-muted-foreground shrink-0">{currentQuotation.quotationNumber}</span>
              )}
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Quotation title…" className="max-w-xs h-8 text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowBuilder(false)}>Close</Button>
              <Button variant="outline" size="sm" onClick={() => { save(); }} disabled={saving}>{saving ? 'Saving…' : 'Save Draft'}</Button>
              <Button variant="outline" size="sm" onClick={generateDocx} disabled={generatingDocx || saving} title="Download Word (.docx)">
                <FileDown className="h-3.5 w-3.5 mr-1" />{generatingDocx ? 'Generating…' : 'Word'}
              </Button>
              <Button size="sm" onClick={generatePdf} disabled={generatingPdf || saving}>{generatingPdf ? 'Generating…' : 'Generate PDF'}</Button>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-5 px-5 py-3 border-b border-border bg-muted/20 flex-wrap text-sm">
            <label className="flex items-center gap-2">
              <FL>Valid Until</FL>
              <Input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} className="h-7 text-xs w-36" />
            </label>
            <label className="flex items-center gap-2">
              <FL>Status</FL>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as QForm['status'] })} className="border border-input rounded-md px-2 py-1 text-xs bg-background h-7">
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>
            <label className="flex items-center gap-2">
              <FL>Discount %</FL>
              <Input type="number" min="0" max="100" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: Number(e.target.value) || 0 })} className="h-7 text-xs w-20 text-right" />
            </label>
            {hiddenCount > 0 && <span className="text-xs text-muted-foreground">{hiddenCount} item{hiddenCount > 1 ? 's' : ''} hidden from PDF</span>}
          </div>

          <div className="p-5">
            {/* Item table header */}
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold">Line Items</h4>
              <div className="relative flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowPicker((v) => !v)}>
                  <Plus className="h-3 w-3 mr-1" /> Add from Product
                </Button>
                {showPicker && <ProductPicker onSelect={addFromProduct} onClose={() => setShowPicker(false)} />}
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setForm((f) => ({ ...f, items: [...f.items, { ...BLANK_ITEM }] }))}>
                  <Plus className="h-3 w-3 mr-1" /> Add Row
                </Button>
              </div>
            </div>

            {/* Items table */}
            <div className="overflow-x-auto -mx-1">
              <table className="w-full text-sm min-w-[860px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="pb-2 w-7 text-center"><Eye className="h-3.5 w-3.5 text-muted-foreground mx-auto" title="Show in PDF" /></th>
                    {['Description', 'HSN', 'Unit', 'Qty', 'Cost (₹)', 'Price (₹)', 'GST%', 'Amount', ''].map((h, ci) => (
                      <th key={ci} className={`pb-2 pr-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground ${ci >= 3 && ci <= 7 ? 'text-right' : 'text-left'} ${ci === 0 ? 'w-28' : ''} ${ci === 8 ? 'w-8' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {form.items.map((row, i) => {
                    const lineAmt = (Number(row.qty) || 0) * (parseFloat(row.unitPrice) || 0);
                    return (
                      <tr key={i} className={`group ${!row.showInPdf ? 'opacity-40' : ''}`}>
                        <td className="py-1.5 pr-2 text-center">
                          <button onClick={() => setItem(i, 'showInPdf', !row.showInPdf)} title={row.showInPdf ? 'Hide from PDF' : 'Show in PDF'} className="p-0.5 rounded hover:bg-muted">
                            {row.showInPdf ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                          </button>
                        </td>
                        <td className="py-1.5 pr-2"><Input value={row.description} onChange={(e) => setItem(i, 'description', e.target.value)} placeholder="Description" className="h-8 text-sm" /></td>
                        <td className="py-1.5 pr-2"><Input value={row.hsnCode} onChange={(e) => setItem(i, 'hsnCode', e.target.value)} placeholder="—" className="h-8 text-sm w-24" /></td>
                        <td className="py-1.5 pr-2"><Input value={row.unit} onChange={(e) => setItem(i, 'unit', e.target.value)} className="h-8 text-sm w-20" /></td>
                        <td className="py-1.5 pr-2"><Input type="number" min="0" value={row.qty} onChange={(e) => setItem(i, 'qty', e.target.value)} className="h-8 text-sm text-right w-16" /></td>
                        <td className="py-1.5 pr-2"><Input type="number" min="0" value={row.unitCost} onChange={(e) => setItem(i, 'unitCost', e.target.value)} placeholder="—" className="h-8 text-sm text-right w-28" /></td>
                        <td className="py-1.5 pr-2"><Input type="number" min="0" value={row.unitPrice} onChange={(e) => setItem(i, 'unitPrice', e.target.value)} className="h-8 text-sm text-right w-28" /></td>
                        <td className="py-1.5 pr-2"><Input type="number" min="0" max="100" value={row.gstPercent} onChange={(e) => setItem(i, 'gstPercent', Number(e.target.value))} className="h-8 text-sm text-right w-16" /></td>
                        <td className="py-1.5 pr-2 text-right text-sm font-medium w-24">{lineAmt > 0 ? inr(lineAmt) : '—'}</td>
                        <td className="py-1.5">
                          <button onClick={() => setForm((f) => ({ ...f, items: f.items.filter((_, j) => j !== i) }))} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-destructive transition-opacity">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {form.items.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No items yet. Add a row or import from a product.</p>
            )}

            {/* Notes + Summary */}
            {form.items.length > 0 && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Notes + T&C */}
                <div className="space-y-4">
                  <div>
                    <FL>Notes</FL>
                    <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Notes for the client…" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                  </div>
                  <div>
                    <FL>Terms & Conditions</FL>
                    <textarea value={form.termsAndConditions} onChange={(e) => setForm({ ...form, termsAndConditions: e.target.value })} rows={5} placeholder="Terms & conditions…" className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                  </div>
                </div>

                {/* Summary */}
                <div className="border border-border rounded-lg p-4 self-start">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">Summary</p>

                  {hiddenCount > 0 && (
                    <>
                      <SumRow label="Internal total (all items)" value={inr(sum.allSub)} />
                      <SumRow label={`PDF subtotal (${form.items.length - hiddenCount} shown)`} value={inr(sum.pdfSub)} />
                      <div className="border-t border-border my-2" />
                    </>
                  )}

                  <SumRow label="Subtotal" value={inr(sum.pdfSub)} />
                  {sum.discAmt > 0 && <SumRow label={`Discount (${form.discountPercent}%)`} value={`-${inr(sum.discAmt)}`} color="text-green-500" />}
                  {sum.discAmt > 0 && <SumRow label="Taxable Amount" value={inr(sum.taxable)} bold />}

                  {Object.entries(sum.gstGroups).map(([rate, amt]) => (
                    <SumRow key={rate} label={`GST @${rate}%`} value={inr(amt)} />
                  ))}

                  <div className="border-t border-border pt-2 mt-2">
                    <SumRow label="Grand Total" value={inr(sum.grandTotal)} bold />
                  </div>

                  {sum.margin !== null && (
                    <div className="border-t border-border pt-2 mt-1">
                      <SumRow label="Internal margin" value={`${sum.margin}%`} color={parseFloat(sum.margin) >= 0 ? 'text-green-500 font-semibold' : 'text-destructive font-semibold'} />
                      {sum.cost > 0 && <SumRow label="Internal cost" value={inr(sum.cost)} />}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
