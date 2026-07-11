'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@lib/client/components/ui/button';
import { Badge } from '@lib/client/components/ui/badge';
import { Input } from '@lib/client/components/ui/input';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { Plus, Pencil, Trash2, PackageOpen, ChevronUp, ChevronDown, X, Upload } from 'lucide-react';
import type { CrmProduct, ProductWithDetails } from '@lib/zappo/crm-types';

// ── local form types ──────────────────────────────────────────────────────────
interface SectionRow { id?: number; title: string; body: string; }
interface BomRow {
  id?: number; description: string; hsnCode: string; unit: string;
  qty: number; unitCost: string; unitPrice: string; gstPercent: number;
}
interface ProductForm {
  name: string; sku: string; description: string;
  bomVisibility: 'private' | 'public'; isActive: boolean;
  sections: SectionRow[]; bomItems: BomRow[];
}

const BLANK_BOM: BomRow = { description: '', hsnCode: '', unit: 'No.', qty: 1, unitCost: '', unitPrice: '0', gstPercent: 18 };
const BLANK_FORM: ProductForm = {
  name: '', sku: '', description: '', bomVisibility: 'private', isActive: true,
  sections: [], bomItems: [],
};

// ── helpers ───────────────────────────────────────────────────────────────────
function lineMargin(cost: string, price: string): string | null {
  const c = parseFloat(cost), p = parseFloat(price);
  if (!c || !p) return null;
  return ((p - c) / c * 100).toFixed(1) + '%';
}

function bomTotals(items: BomRow[]) {
  let cost = 0, price = 0;
  for (const r of items) {
    const q = Number(r.qty) || 0;
    cost += q * (parseFloat(r.unitCost) || 0);
    price += q * (parseFloat(r.unitPrice) || 0);
  }
  return { cost, price };
}

function inr(n: number) {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ── tab button ────────────────────────────────────────────────────────────────
function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  );
}

// ── label ─────────────────────────────────────────────────────────────────────
function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1 block">
      {children}
    </label>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────
export const CrmProductsPage = () => {
  const [products, setProducts] = useState<CrmProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductForm>(BLANK_FORM);
  const [tab, setTab] = useState<'info' | 'sections' | 'bom'>('info');
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imageRef = useRef<HTMLInputElement>(null);

  const loadProducts = () => {
    setLoading(true);
    fetch('/api/zappo/crm/products')
      .then((r) => r.json())
      .then((d) => setProducts(Array.isArray(d) ? d : (d.data ?? [])))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProducts(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(BLANK_FORM);
    setImageFile(null);
    setImagePreview(null);
    setTab('info');
    setShowForm(true);
  };

  const openEdit = async (id: number) => {
    const r = await fetch(`/api/zappo/crm/products/${id}`);
    const d: ProductWithDetails = await r.json();
    setForm({
      name: d.name,
      sku: d.sku ?? '',
      description: d.description ?? '',
      bomVisibility: (d.bomVisibility as 'private' | 'public') ?? 'private',
      isActive: d.isActive,
      sections: (d.sections ?? []).map((s) => ({ id: s.id, title: s.title, body: s.body ?? '' })),
      bomItems: (d.bomItems ?? []).map((b) => ({
        id: b.id,
        description: b.description,
        hsnCode: b.hsnCode ?? '',
        unit: b.unit,
        qty: b.qty,
        unitCost: b.unitCost != null ? String(b.unitCost) : '',
        unitPrice: String(b.unitPrice),
        gstPercent: b.gstPercent,
      })),
    });
    setEditId(id);
    setImageFile(null);
    setImagePreview(d.imageFilePath ? `/api/zappo/crm/products/${id}/image` : null);
    setTab('info');
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name.trim()) { alert('Product name is required.'); return; }
    setSaving(true);
    try {
      const body = {
        name: form.name.trim(),
        sku: form.sku || undefined,
        description: form.description || undefined,
        bomVisibility: form.bomVisibility,
        isActive: form.isActive,
        sections: form.sections.map((s, i) => ({ ...s, order: i })),
        bomItems: form.bomItems.map((b, i) => ({
          ...b,
          order: i,
          unitCost: b.unitCost ? parseFloat(b.unitCost) : null,
          unitPrice: parseFloat(b.unitPrice) || 0,
          qty: Number(b.qty) || 1,
        })),
      };
      let productId = editId;
      if (productId) {
        await fetch(`/api/zappo/crm/products/${productId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        const r = await fetch('/api/zappo/crm/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const created = await r.json();
        productId = created.id;
      }
      if (imageFile && productId) {
        const fd = new FormData();
        fd.append('file', imageFile);
        await fetch(`/api/zappo/crm/products/${productId}/image`, { method: 'POST', body: fd });
      }
      setShowForm(false);
      loadProducts();
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Delete this product and all its BOM items?')) return;
    await fetch(`/api/zappo/crm/products/${id}`, { method: 'DELETE' });
    loadProducts();
  };

  const setBom = (i: number, field: keyof BomRow, value: string | number) =>
    setForm((f) => {
      const items = [...f.bomItems];
      items[i] = { ...items[i], [field]: value };
      return { ...f, bomItems: items };
    });

  const setSection = (i: number, field: 'title' | 'body', value: string) =>
    setForm((f) => {
      const sections = [...f.sections];
      sections[i] = { ...sections[i], [field]: value };
      return { ...f, sections };
    });

  const moveSection = (i: number, dir: -1 | 1) =>
    setForm((f) => {
      const s = [...f.sections];
      [s[i], s[i + dir]] = [s[i + dir], s[i]];
      return { ...f, sections: s };
    });

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // ── render ──────────────────────────────────────────────────────────────────
  return (
    <div className={pageMargin}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className={heading2Style}>Products & Catalog</h2>
        {!showForm && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> New Product
          </Button>
        )}
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="border border-border rounded-lg bg-card mb-8">
          {/* Form header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <span className="font-semibold text-foreground">
              {editId ? 'Edit Product' : 'New Product'}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save Product'}
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-border px-5">
            <TabBtn label="Info" active={tab === 'info'} onClick={() => setTab('info')} />
            <TabBtn label="Sections" active={tab === 'sections'} onClick={() => setTab('sections')} />
            <TabBtn label="BOM" active={tab === 'bom'} onClick={() => setTab('bom')} />
          </div>

          <div className="p-5">
            {/* ── Info tab ── */}
            {tab === 'info' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <FieldLabel>Product Name *</FieldLabel>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Zeon 7.4kW AC Charger"
                    />
                  </div>
                  <div>
                    <FieldLabel>SKU / Model No.</FieldLabel>
                    <Input
                      value={form.sku}
                      onChange={(e) => setForm({ ...form, sku: e.target.value })}
                      placeholder="e.g. ZN-AC-7400"
                    />
                  </div>
                  <div>
                    <FieldLabel>Description</FieldLabel>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={5}
                      placeholder="Product description…"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>
                  <div className="flex gap-8">
                    <div>
                      <FieldLabel>BOM Visibility</FieldLabel>
                      <div className="flex gap-4 mt-1.5">
                        {(['private', 'public'] as const).map((v) => (
                          <label key={v} className="flex items-center gap-1.5 cursor-pointer text-sm capitalize">
                            <input
                              type="radio"
                              name="bomVis"
                              value={v}
                              checked={form.bomVisibility === v}
                              onChange={() => setForm({ ...form, bomVisibility: v })}
                            />
                            {v}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <FieldLabel>Status</FieldLabel>
                      <label className="flex items-center gap-1.5 cursor-pointer text-sm mt-1.5">
                        <input
                          type="checkbox"
                          checked={form.isActive}
                          onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                        />
                        Active
                      </label>
                    </div>
                  </div>
                </div>

                {/* Image upload */}
                <div>
                  <FieldLabel>Product Image</FieldLabel>
                  <div
                    className="border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center h-52 cursor-pointer hover:border-primary/50 transition-colors relative overflow-hidden bg-muted/20"
                    onClick={() => imageRef.current?.click()}
                  >
                    {imagePreview ? (
                      <>
                        <img
                          src={imagePreview}
                          alt=""
                          className="w-full h-full object-contain p-3"
                        />
                        <button
                          className="absolute top-2 right-2 bg-background/90 rounded-full p-0.5 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setImageFile(null);
                            setImagePreview(null);
                            if (imageRef.current) imageRef.current.value = '';
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col items-center text-muted-foreground pointer-events-none">
                        <Upload className="h-8 w-8 mb-2 opacity-50" />
                        <span className="text-sm">Click to upload image</span>
                        <span className="text-xs mt-1 opacity-70">PNG, JPG, WebP</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={imageRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={pickImage}
                  />
                </div>
              </div>
            )}

            {/* ── Sections tab ── */}
            {tab === 'sections' && (
              <div className="space-y-3">
                {form.sections.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No sections yet. Add a section to build the product page content.
                  </p>
                )}
                {form.sections.map((s, i) => (
                  <div key={i} className="border border-border rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={s.title}
                        onChange={(e) => setSection(i, 'title', e.target.value)}
                        placeholder="Section heading…"
                        className="font-medium"
                      />
                      <button
                        onClick={() => i > 0 && moveSection(i, -1)}
                        disabled={i === 0}
                        className="p-1 rounded hover:bg-muted disabled:opacity-30"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => i < form.sections.length - 1 && moveSection(i, 1)}
                        disabled={i === form.sections.length - 1}
                        className="p-1 rounded hover:bg-muted disabled:opacity-30"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() =>
                          setForm((f) => ({ ...f, sections: f.sections.filter((_, j) => j !== i) }))
                        }
                        className="p-1 rounded hover:bg-destructive/10 text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <textarea
                      value={s.body}
                      onChange={(e) => setSection(i, 'body', e.target.value)}
                      rows={3}
                      placeholder="Section content…"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setForm((f) => ({ ...f, sections: [...f.sections, { title: '', body: '' }] }))
                  }
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Section
                </Button>
              </div>
            )}

            {/* ── BOM tab ── */}
            {tab === 'bom' && (
              <div>
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-sm min-w-[780px]">
                    <thead>
                      <tr className="text-left border-b border-border">
                        <th className="pb-2 pr-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Description</th>
                        <th className="pb-2 pr-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-24">HSN</th>
                        <th className="pb-2 pr-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-20">Unit</th>
                        <th className="pb-2 pr-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-16 text-right">Qty</th>
                        <th className="pb-2 pr-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-28 text-right">Cost (₹)</th>
                        <th className="pb-2 pr-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-28 text-right">Price (₹)</th>
                        <th className="pb-2 pr-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-20 text-right">GST%</th>
                        <th className="pb-2 pr-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground w-20 text-center">Margin</th>
                        <th className="pb-2 w-8" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {form.bomItems.map((row, i) => {
                        const m = lineMargin(row.unitCost, row.unitPrice);
                        const mPos = m ? parseFloat(m) >= 0 : true;
                        return (
                          <tr key={i} className="group">
                            <td className="py-1.5 pr-2">
                              <Input value={row.description} onChange={(e) => setBom(i, 'description', e.target.value)} placeholder="Item description" />
                            </td>
                            <td className="py-1.5 pr-2">
                              <Input value={row.hsnCode} onChange={(e) => setBom(i, 'hsnCode', e.target.value)} placeholder="—" />
                            </td>
                            <td className="py-1.5 pr-2">
                              <Input value={row.unit} onChange={(e) => setBom(i, 'unit', e.target.value)} />
                            </td>
                            <td className="py-1.5 pr-2">
                              <Input type="number" min="0" value={row.qty} onChange={(e) => setBom(i, 'qty', e.target.value)} className="text-right" />
                            </td>
                            <td className="py-1.5 pr-2">
                              <Input type="number" min="0" value={row.unitCost} onChange={(e) => setBom(i, 'unitCost', e.target.value)} placeholder="—" className="text-right" />
                            </td>
                            <td className="py-1.5 pr-2">
                              <Input type="number" min="0" value={row.unitPrice} onChange={(e) => setBom(i, 'unitPrice', e.target.value)} className="text-right" />
                            </td>
                            <td className="py-1.5 pr-2">
                              <Input type="number" min="0" max="100" value={row.gstPercent} onChange={(e) => setBom(i, 'gstPercent', Number(e.target.value))} className="text-right" />
                            </td>
                            <td className="py-1.5 pr-2 text-center">
                              {m ? (
                                <span className={`text-xs font-semibold ${mPos ? 'text-green-500' : 'text-destructive'}`}>{m}</span>
                              ) : (
                                <span className="text-muted-foreground text-xs">—</span>
                              )}
                            </td>
                            <td className="py-1.5">
                              <button
                                onClick={() => setForm((f) => ({ ...f, bomItems: f.bomItems.filter((_, j) => j !== i) }))}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-destructive transition-opacity"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {form.bomItems.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No BOM items yet. Add items to build the bill of materials.
                  </p>
                )}

                <div className="flex items-center justify-between mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setForm((f) => ({ ...f, bomItems: [...f.bomItems, { ...BLANK_BOM }] }))}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
                  </Button>

                  {form.bomItems.length > 0 && (() => {
                    const { cost, price } = bomTotals(form.bomItems);
                    const om = cost ? ((price - cost) / cost * 100).toFixed(1) + '%' : null;
                    return (
                      <div className="flex items-center gap-5 text-sm">
                        {om && (
                          <span className="text-muted-foreground">
                            Margin:{' '}
                            <span className={`font-semibold ${parseFloat(om) >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                              {om}
                            </span>
                          </span>
                        )}
                        {cost > 0 && (
                          <span className="text-muted-foreground">
                            Cost: <span className="font-semibold text-foreground">{inr(cost)}</span>
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          Total: <span className="font-semibold text-foreground">{inr(price)}</span>
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Product list */}
      {loading ? (
        <div className="text-muted-foreground text-sm text-center py-16">Loading products…</div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <PackageOpen className="h-14 w-14 mb-4 opacity-25" />
          <p className="text-sm">No products yet.</p>
          <p className="text-xs mt-1 opacity-70">Create your first product to start building a catalog.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((p) => {
            const margin =
              p.totalCost && p.totalPrice && p.totalCost > 0
                ? ((p.totalPrice - p.totalCost) / p.totalCost * 100).toFixed(1) + '%'
                : null;
            return (
              <div key={p.id} className="border border-border rounded-lg bg-card overflow-hidden">
                {/* Product image */}
                {p.imageFilePath && (
                  <div className="h-40 bg-muted/20 flex items-center justify-center overflow-hidden">
                    <img
                      src={`/api/zappo/crm/products/${p.id}/image`}
                      alt={p.name}
                      className="max-h-full max-w-full object-contain p-3"
                    />
                  </div>
                )}

                <div className="p-4 space-y-3">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{p.name}</h3>
                      {p.sku && (
                        <p className="text-xs text-muted-foreground mt-0.5">{p.sku}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge
                        variant={p.isActive ? 'default' : 'secondary'}
                        className="text-[10px] px-1.5"
                      >
                        {p.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] px-1.5">
                        {p.bomVisibility === 'public' ? 'Public BOM' : 'Private BOM'}
                      </Badge>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs flex-wrap">
                    <span className="text-muted-foreground">
                      {p.itemCount ?? 0} item{(p.itemCount ?? 0) !== 1 ? 's' : ''}
                    </span>
                    {(p.totalPrice ?? 0) > 0 && (
                      <span className="font-semibold text-foreground">{inr(p.totalPrice ?? 0)}</span>
                    )}
                    {margin && (
                      <span className={`font-semibold ${parseFloat(margin) >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                        {margin} margin
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 justify-center"
                      onClick={() => openEdit(p.id)}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteProduct(p.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
