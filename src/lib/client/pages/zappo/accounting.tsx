'use client';

import { useEffect, useState } from 'react';
import { Button } from '@lib/client/components/ui/button';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { Input } from '@lib/client/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lib/client/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@lib/client/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@lib/client/components/ui/tabs';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { Plus } from 'lucide-react';
import type {
  VsLedgerAccount,
  VsJournalEntry,
  VsTrialBalanceRow,
  VsProfitAndLoss,
  VsBalanceSheet,
} from '@lib/zappo/types';

const inr = (n: number | string) =>
  `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

function defaultRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const toInput = (d: Date) => d.toISOString().slice(0, 10);
  return { start: toInput(start), end: toInput(now) };
}

type EntryType = 'expense' | 'capital' | 'payout' | 'loan-repayment';

export const AccountingPage = () => {
  const { start: defaultStart, end: defaultEnd } = defaultRange();
  const [asOf, setAsOf] = useState(defaultEnd);
  const [from, setFrom] = useState(defaultStart);
  const [to, setTo] = useState(defaultEnd);

  const [accounts, setAccounts] = useState<VsLedgerAccount[]>([]);
  const [trialBalance, setTrialBalance] = useState<VsTrialBalanceRow[]>([]);
  const [pnl, setPnl] = useState<VsProfitAndLoss | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<VsBalanceSheet | null>(null);
  const [entries, setEntries] = useState<VsJournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [entryDialog, setEntryDialog] = useState<EntryType | null>(null);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/zappo/accounting/accounts').then((r) => r.json()),
      fetch(`/api/zappo/accounting/reports/trial-balance?asOf=${asOf}`).then(
        (r) => r.json(),
      ),
      fetch(
        `/api/zappo/accounting/reports/profit-and-loss?from=${from}&to=${to}`,
      ).then((r) => r.json()),
      fetch(`/api/zappo/accounting/reports/balance-sheet?asOf=${asOf}`).then(
        (r) => r.json(),
      ),
      fetch('/api/zappo/accounting/journal-entries').then((r) => r.json()),
    ])
      .then(([acc, tb, pl, bs, je]) => {
        if (Array.isArray(acc)) setAccounts(acc);
        if (Array.isArray(tb)) setTrialBalance(tb);
        setPnl(pl);
        setBalanceSheet(bs);
        if (Array.isArray(je)) setEntries(je);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asOf, from, to]);

  return (
    <div className={`${pageMargin} flex flex-col gap-6`}>
      <div className="flex items-center justify-between">
        <h2 className={heading2Style}>Accounting</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEntryDialog('expense')}>
            <Plus className="size-4 mr-1" /> Expense
          </Button>
          <Button variant="outline" onClick={() => setEntryDialog('capital')}>
            <Plus className="size-4 mr-1" /> Capital / Loan
          </Button>
          <Button variant="outline" onClick={() => setEntryDialog('payout')}>
            <Plus className="size-4 mr-1" /> Operator Payout
          </Button>
          <Button
            variant="outline"
            onClick={() => setEntryDialog('loan-repayment')}
          >
            <Plus className="size-4 mr-1" /> Loan Repayment
          </Button>
        </div>
      </div>

      <Tabs defaultValue="trial-balance">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <TabsList>
            <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
            <TabsTrigger value="pnl">Profit &amp; Loss</TabsTrigger>
            <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
          </TabsList>
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">From</label>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">
                To / As of
              </label>
              <Input
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setAsOf(e.target.value);
                }}
                className="w-40"
              />
            </div>
          </div>
        </div>

        <TabsContent value="trial-balance">
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <span className="font-semibold">
                Trial Balance as of {fmtDate(asOf)}
              </span>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-3 text-xs font-semibold text-muted-foreground uppercase pb-2 border-b">
                <span className="col-span-2">Account</span>
                <span className="text-right">Debit</span>
                <span className="text-right">Credit</span>
                <span className="text-right">Balance</span>
              </div>
              <div className="flex flex-col divide-y">
                {trialBalance.map((row) => (
                  <div
                    key={row.code}
                    className="grid grid-cols-5 gap-3 py-2 text-sm"
                  >
                    <span className="col-span-2">
                      {row.code} · {row.name}
                    </span>
                    <span className="text-right text-muted-foreground">
                      {inr(row.totalDebit)}
                    </span>
                    <span className="text-right text-muted-foreground">
                      {inr(row.totalCredit)}
                    </span>
                    <span className="text-right font-medium">
                      {inr(row.balance)}
                    </span>
                  </div>
                ))}
                {!loading && trialBalance.length === 0 && (
                  <p className="text-sm text-muted-foreground py-3">
                    No activity yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pnl">
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <span className="font-semibold">
                Profit &amp; Loss —{' '}
                {pnl ? `${fmtDate(pnl.from)} to ${fmtDate(pnl.to)}` : ''}
              </span>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Revenue
                </p>
                {pnl?.revenue.map((r) => (
                  <div
                    key={r.code}
                    className="flex justify-between text-sm py-1"
                  >
                    <span>
                      {r.code} · {r.name}
                    </span>
                    <span>{inr(r.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold pt-2 border-t mt-1">
                  <span>Total Revenue</span>
                  <span>{inr(pnl?.totalRevenue ?? 0)}</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Expenses
                </p>
                {pnl?.expenses.map((r) => (
                  <div
                    key={r.code}
                    className="flex justify-between text-sm py-1"
                  >
                    <span>
                      {r.code} · {r.name}
                    </span>
                    <span className="text-destructive">-{inr(r.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold pt-2 border-t mt-1">
                  <span>Total Expenses</span>
                  <span className="text-destructive">
                    -{inr(pnl?.totalExpenses ?? 0)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-base font-bold pt-3 border-t">
                <span>Net Income</span>
                <span
                  className={
                    (pnl?.netIncome ?? 0) < 0
                      ? 'text-destructive'
                      : 'text-success'
                  }
                >
                  {inr(pnl?.netIncome ?? 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance-sheet">
          <Card className="mt-4">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <span className="font-semibold">
                Balance Sheet as of {fmtDate(asOf)}
              </span>
              {balanceSheet && (
                <span
                  className={`text-xs font-semibold ${balanceSheet.balanced ? 'text-success' : 'text-destructive'}`}
                >
                  {balanceSheet.balanced
                    ? 'Balanced'
                    : 'NOT BALANCED — check entries'}
                </span>
              )}
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Assets
                </p>
                {balanceSheet?.assets.map((r) => (
                  <div
                    key={r.code}
                    className="flex justify-between text-sm py-1"
                  >
                    <span>{r.name}</span>
                    <span>{inr(r.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold pt-2 border-t mt-1">
                  <span>Total Assets</span>
                  <span>{inr(balanceSheet?.totalAssets ?? 0)}</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                  Liabilities &amp; Equity
                </p>
                {balanceSheet?.liabilities.map((r) => (
                  <div
                    key={r.code}
                    className="flex justify-between text-sm py-1"
                  >
                    <span>{r.name}</span>
                    <span>{inr(r.balance)}</span>
                  </div>
                ))}
                {balanceSheet?.equity.map((r) => (
                  <div
                    key={r.code}
                    className="flex justify-between text-sm py-1"
                  >
                    <span>{r.name}</span>
                    <span>{inr(r.balance)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold pt-2 border-t mt-1">
                  <span>Total Liabilities + Equity</span>
                  <span>
                    {inr(
                      (balanceSheet?.totalLiabilities ?? 0) +
                        (balanceSheet?.totalEquity ?? 0),
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader className="pb-2">
          <span className="font-semibold">Journal Entries</span>
        </CardHeader>
        <CardContent className="flex flex-col divide-y">
          {entries.map((je) => (
            <div key={je.id} className="py-3 text-sm">
              <div className="flex justify-between">
                <span className="font-medium">{je.description}</span>
                <span className="text-muted-foreground text-xs">
                  {fmtDate(je.date)}
                  {je.source ? ` · ${je.source}` : ''}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 mt-1">
                {je.lines.map((l, i) => (
                  <div
                    key={i}
                    className="flex justify-between text-xs text-muted-foreground"
                  >
                    <span>
                      {l.account} · {l.accountName}
                    </span>
                    <span>
                      {Number(l.debit) > 0
                        ? `Dr ${inr(l.debit)}`
                        : `Cr ${inr(l.credit)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {!loading && entries.length === 0 && (
            <p className="text-sm text-muted-foreground py-3">
              No journal entries yet.
            </p>
          )}
        </CardContent>
      </Card>

      <EntryDialog
        type={entryDialog}
        accounts={accounts}
        onClose={() => setEntryDialog(null)}
        onPosted={() => {
          setEntryDialog(null);
          loadAll();
        }}
      />
    </div>
  );
};

function EntryDialog({
  type,
  accounts,
  onClose,
  onPosted,
}: {
  type: EntryType | null;
  accounts: VsLedgerAccount[];
  onClose: () => void;
  onPosted: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [amount, setAmount] = useState('');
  const [principal, setPrincipal] = useState('');
  const [interest, setInterest] = useState('');
  const [description, setDescription] = useState('');
  const [accountCode, setAccountCode] = useState('');
  const [paidFrom, setPaidFrom] = useState<'bank' | 'payable'>('bank');
  const [capitalType, setCapitalType] = useState<'equity' | 'loan'>('equity');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (type) {
      setDate(today);
      setAmount('');
      setPrincipal('');
      setInterest('');
      setDescription('');
      setAccountCode('');
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  if (!type) return null;

  const expenseAccounts = accounts.filter((a) => a.type === 'expense');

  const titles: Record<EntryType, string> = {
    expense: 'Record Expense',
    capital: 'Record Capital / Loan Injection',
    payout: 'Record Operator Payout',
    'loan-repayment': 'Record Loan Repayment',
  };

  const submit = async () => {
    setError('');
    if (!description.trim()) {
      setError('Description is required');
      return;
    }
    setSaving(true);
    try {
      let path = '';
      let body: Record<string, unknown> = {};
      if (type === 'expense') {
        if (!accountCode) {
          setError('Choose an expense account');
          setSaving(false);
          return;
        }
        path = '/api/zappo/accounting/expenses';
        body = {
          date,
          accountCode,
          amount: parseFloat(amount),
          description,
          paidFrom,
        };
      } else if (type === 'capital') {
        path = '/api/zappo/accounting/capital';
        body = {
          date,
          amount: parseFloat(amount),
          type: capitalType,
          description,
        };
      } else if (type === 'payout') {
        path = '/api/zappo/accounting/operator-payouts';
        body = { date, amount: parseFloat(amount), description };
      } else {
        path = '/api/zappo/accounting/loan-repayments';
        body = {
          date,
          principal: parseFloat(principal) || 0,
          interest: parseFloat(interest) || 0,
          description,
        };
      }

      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        onPosted();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? 'Failed to post entry');
      }
    } catch {
      setError('Failed to post entry');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{titles[type]}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          {type === 'expense' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Expense Account</label>
              <Select value={accountCode} onValueChange={setAccountCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {expenseAccounts.map((a) => (
                    <SelectItem key={a.code} value={a.code}>
                      {a.code} · {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {type === 'capital' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Type</label>
              <Select
                value={capitalType}
                onValueChange={(v) => setCapitalType(v as 'equity' | 'loan')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equity">Equity (Share Capital)</SelectItem>
                  <SelectItem value="loan">Loan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {type === 'expense' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Paid from</label>
              <Select
                value={paidFrom}
                onValueChange={(v) => setPaidFrom(v as 'bank' | 'payable')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bank (paid now)</SelectItem>
                  <SelectItem value="payable">
                    Payable (accrued, not yet paid)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {type === 'loan-repayment' ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Principal (₹)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={principal}
                  onChange={(e) => setPrincipal(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Interest (₹)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Amount (₹)</label>
              <Input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. July office rent"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={submit}>
            {saving ? 'Saving…' : 'Post Entry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
