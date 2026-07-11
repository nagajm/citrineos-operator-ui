'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { Input } from '@lib/client/components/ui/input';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { Search } from 'lucide-react';
import type { VsOperatorEarnings } from '@lib/zappo/types';

const inr = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const OperatorEarningsList = () => {
  const [rows, setRows] = useState<VsOperatorEarnings[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/zappo/operators/earnings')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setRows(data);
        else setError('Failed to load earnings');
      })
      .catch(() => setError('Failed to load earnings'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((r) => r.operatorName?.toLowerCase().includes(q));
  }, [rows, search]);

  const totals = useMemo(
    () =>
      filtered.reduce(
        (acc, r) => ({
          totalSessions: acc.totalSessions + r.totalSessions,
          grossCollected: acc.grossCollected + r.grossCollected,
          gstCollected: acc.gstCollected + r.gstCollected,
          platformCommission: acc.platformCommission + r.platformCommission,
          payoutOwed: acc.payoutOwed + r.payoutOwed,
        }),
        { totalSessions: 0, grossCollected: 0, gstCollected: 0, platformCommission: 0, payoutOwed: 0 },
      ),
    [filtered],
  );

  return (
    <div className={`${pageMargin} flex flex-col gap-6`}>
      <div className="flex items-center justify-between">
        <h2 className={heading2Style}>Operator Earnings</h2>
      </div>
      <p className="text-sm text-muted-foreground -mt-4">
        All-time totals from billed sessions. "Payout owed" is cumulative — there's no
        settlement/payout-run tracking yet, so this doesn't net out anything already paid out.
      </p>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by operator name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">{error}</p>}

      {!loading && !error && (
        <Card>
          <CardHeader className="pb-2">
            <div className="grid grid-cols-6 gap-4 text-xs font-semibold text-muted-foreground uppercase">
              <span className="col-span-2">Operator</span>
              <span className="text-right">Gross collected</span>
              <span className="text-right">GST collected</span>
              <span className="text-right">Platform commission</span>
              <span className="text-right">Payout owed</span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col divide-y">
            {filtered.map((r) => (
              <div key={r.operatorId} className="grid grid-cols-6 gap-4 py-3 text-sm items-center">
                <div className="col-span-2">
                  <div className="font-medium">{r.operatorName}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.totalSessions} sessions · {r.totalKwh.toFixed(2)} kWh
                  </div>
                </div>
                <span className="text-right">{inr(r.grossCollected)}</span>
                <span className="text-right text-muted-foreground">{inr(r.gstCollected)}</span>
                <span className="text-right text-muted-foreground">-{inr(r.platformCommission)}</span>
                <span className="text-right font-semibold text-success">{inr(r.payoutOwed)}</span>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground py-4">No operators match.</p>
            )}
            {filtered.length > 0 && (
              <div className="grid grid-cols-6 gap-4 pt-3 text-sm font-semibold">
                <span className="col-span-2">Total ({totals.totalSessions} sessions)</span>
                <span className="text-right">{inr(totals.grossCollected)}</span>
                <span className="text-right">{inr(totals.gstCollected)}</span>
                <span className="text-right">-{inr(totals.platformCommission)}</span>
                <span className="text-right text-success">{inr(totals.payoutOwed)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
