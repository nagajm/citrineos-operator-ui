'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@lib/client/components/ui/button';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { Input } from '@lib/client/components/ui/input';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { ChevronLeft, Download, FileText } from 'lucide-react';
import type { VsOperatorStatement, VsOperatorInvoice } from '@lib/zappo/types';

const inr = (n: number | string) =>
  `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDateTime = (d: string) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

// Defaults to the current calendar month — a sensible starting window for "generate this
// month's bill", not a hidden all-time query that could silently include prior periods.
function defaultRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const toInput = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toInput(start), end: toInput(end) };
}

export const OperatorStatement = ({ operatorId }: { operatorId: number }) => {
  const router = useRouter();
  const { start: defaultStart, end: defaultEnd } = defaultRange();
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [statement, setStatement] = useState<VsOperatorStatement | null>(null);
  const [invoices, setInvoices] = useState<VsOperatorInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [genMessage, setGenMessage] = useState('');

  const loadStatement = () => {
    setLoading(true);
    setError('');
    fetch(`/api/zappo/operators/${operatorId}/statement?start=${start}&end=${end}`)
      .then((r) => r.json())
      .then(setStatement)
      .catch(() => setError('Failed to load statement'))
      .finally(() => setLoading(false));
  };

  const loadInvoices = () => {
    fetch(`/api/zappo/operators/${operatorId}/invoices`)
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setInvoices(data))
      .catch(() => {});
  };

  useEffect(() => {
    loadStatement();
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [operatorId]);

  const generateInvoice = async () => {
    setGenerating(true);
    setGenMessage('');
    setError('');
    try {
      const res = await fetch(`/api/zappo/operators/${operatorId}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ periodStart: start, periodEnd: end }),
      });
      if (res.ok) {
        const invoice: VsOperatorInvoice = await res.json();
        setGenMessage(`Generated ${invoice.invoiceNumber}.`);
        loadInvoices();
      } else {
        setError('Failed to generate invoice');
      }
    } catch {
      setError('Failed to generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className={`${pageMargin} flex flex-col gap-6`}>
      <div className="flex items-center gap-3">
        <ChevronLeft className="cursor-pointer" onClick={() => router.push('/zappo/operator-earnings')} />
        <h2 className={heading2Style}>Operator Statement</h2>
      </div>

      <Card>
        <CardContent className="py-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">Start date</label>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="w-40" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground">End date</label>
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="w-40" />
          </div>
          <Button variant="outline" onClick={loadStatement}>Load Statement</Button>
          <Button disabled={generating} onClick={generateInvoice}>
            <FileText className="size-4 mr-2" />
            {generating ? 'Generating…' : 'Generate Invoice'}
          </Button>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {genMessage && <p className="text-sm text-success">{genMessage}</p>}

      {loading && <p className="text-muted-foreground">Loading…</p>}

      {!loading && statement && (
        <Card>
          <CardHeader className="pb-2">
            <span className="font-semibold">
              Transactions ({statement.totals.totalSessions})
            </span>
          </CardHeader>
          <CardContent className="flex flex-col gap-0">
            <div className="grid grid-cols-7 gap-3 text-xs font-semibold text-muted-foreground uppercase pb-2 border-b">
              <span>Date</span>
              <span>Station</span>
              <span className="text-right">kWh</span>
              <span className="text-right">Rate</span>
              <span className="text-right">Energy</span>
              <span className="text-right">GST</span>
              <span className="text-right">Total</span>
            </div>
            <div className="flex flex-col divide-y">
              {statement.transactions.map((t) => (
                <div key={t.sessionId} className="grid grid-cols-7 gap-3 py-2 text-sm">
                  <span>{fmtDateTime(t.startedAt)}</span>
                  <span>#{t.stationId}</span>
                  <span className="text-right">{t.totalKwh.toFixed(3)}</span>
                  <span className="text-right">{inr(t.ratePerKwh)}</span>
                  <span className="text-right">{inr(t.amount)}</span>
                  <span className="text-right text-muted-foreground">{inr(t.gstAmount)}</span>
                  <span className="text-right font-medium">{inr(t.totalAmount)}</span>
                </div>
              ))}
              {statement.transactions.length === 0 && (
                <p className="text-sm text-muted-foreground py-3">No sessions in this period.</p>
              )}
            </div>
            {statement.transactions.length > 0 && (
              <div className="grid grid-cols-2 gap-6 pt-4 mt-2 border-t">
                <div />
                <div className="flex flex-col gap-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Energy Charges</span><span>{inr(statement.totals.grossAmount)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">GST</span><span>{inr(statement.totals.gstAmount)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Platform Commission</span><span className="text-destructive">-{inr(statement.totals.commissionAmount)}</span></div>
                  <div className="flex justify-between font-bold text-base pt-1 border-t"><span>Payout Owed</span><span className="text-success">{inr(statement.totals.payoutAmount)}</span></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2"><span className="font-semibold">Generated Invoices</span></CardHeader>
        <CardContent className="flex flex-col divide-y">
          {invoices.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between py-3 text-sm">
              <div>
                <div className="font-medium">{inv.invoiceNumber}</div>
                <div className="text-xs text-muted-foreground">
                  {fmtDate(inv.periodStart)} – {fmtDate(inv.periodEnd)} · Generated {fmtDate(inv.generatedAt)}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-semibold text-success">{inr(inv.payoutAmount)}</span>
                <a
                  href={`/api/zappo/operators/${operatorId}/invoices/${inv.id}/pdf`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <Download className="size-4" /> PDF
                </a>
              </div>
            </div>
          ))}
          {invoices.length === 0 && (
            <p className="text-sm text-muted-foreground py-3">No invoices generated yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
