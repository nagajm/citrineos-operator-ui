'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@lib/client/components/ui/button';
import { Input } from '@lib/client/components/ui/input';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { cardHeaderFlex } from '@lib/client/styles/card';
import { ChevronLeft } from 'lucide-react';

interface Props {
  operatorId: string;
}

export const OperatorsEdit = ({ operatorId }: Props) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    company: '',
    billingRate: '',
  });

  useEffect(() => {
    fetch(`/api/voltstation/operators/${operatorId}`)
      .then((r) => r.json())
      .then((op) => {
        setForm({
          name: op.name ?? '',
          phone: op.phone ?? '',
          company: op.company ?? '',
          billingRate: op.currentRate != null ? String(op.currentRate) : '',
        });
      })
      .catch(() => setError('Failed to load operator'))
      .finally(() => setLoading(false));
  }, [operatorId]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        name: form.name,
        phone: form.phone || undefined,
        company: form.company || undefined,
      };
      if (form.billingRate !== '') {
        body.billingRate = parseFloat(form.billingRate);
      }
      const res = await fetch(`/api/voltstation/operators/${operatorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Failed to update operator');
      router.push('/voltstation/operators');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update operator');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className={`${pageMargin} text-muted-foreground`}>Loading…</p>;

  return (
    <Card className={pageMargin}>
      <CardHeader>
        <div className={cardHeaderFlex}>
          <ChevronLeft onClick={() => router.back()} className="cursor-pointer" />
          <h2 className={heading2Style}>Edit Operator</h2>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Name *</label>
              <Input value={form.name} onChange={set('name')} required />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Phone</label>
              <Input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Company</label>
              <Input value={form.company} onChange={set('company')} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Billing Rate (₹/kWh)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.billingRate}
                onChange={set('billingRate')}
                placeholder="0.00"
              />
            </div>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex gap-3 mt-2">
            <Button type="submit" variant="success" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
