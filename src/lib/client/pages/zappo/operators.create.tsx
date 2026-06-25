'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@lib/client/components/ui/button';
import { Input } from '@lib/client/components/ui/input';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { cardHeaderFlex } from '@lib/client/styles/card';
import { ChevronLeft } from 'lucide-react';

export const OperatorsCreate = () => {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    company: '',
    initialBillingRate: '',
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/zappo/operators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
          company: form.company || undefined,
          initialBillingRate: form.initialBillingRate ? parseFloat(form.initialBillingRate) : 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Failed to create operator');
      router.push('/zappo/operators');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className={pageMargin}>
      <CardHeader>
        <div className={cardHeaderFlex}>
          <ChevronLeft onClick={() => router.back()} className="cursor-pointer" />
          <h2 className={heading2Style}>New Operator</h2>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-lg">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Name *</label>
              <Input value={form.name} onChange={set('name')} required placeholder="Full name" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Email *</label>
              <Input type="email" value={form.email} onChange={set('email')} required placeholder="email@example.com" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Password *</label>
              <Input type="password" value={form.password} onChange={set('password')} required minLength={8} placeholder="Min 8 characters" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Phone</label>
              <Input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Company</label>
              <Input value={form.company} onChange={set('company')} placeholder="Company name" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium">Initial Billing Rate (₹/kWh)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={form.initialBillingRate}
                onChange={set('initialBillingRate')}
                placeholder="e.g. 12.00"
              />
            </div>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <div className="flex gap-3 mt-2">
            <Button type="submit" variant="success" disabled={saving}>
              {saving ? 'Creating…' : 'Create Operator'}
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
