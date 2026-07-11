'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { Badge } from '@lib/client/components/ui/badge';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { ChevronLeft } from 'lucide-react';
import type { VsAdminDriver, VsAdminWallet, VsAdminSession } from '@lib/zappo/types';

const inr = (n: number | string | undefined | null) =>
  `₹${Number(n ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const DriverDetail = ({ driverId }: { driverId: number }) => {
  const router = useRouter();
  const [driver, setDriver] = useState<VsAdminDriver | null>(null);
  const [wallet, setWallet] = useState<VsAdminWallet | null>(null);
  const [sessions, setSessions] = useState<VsAdminSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/zappo/drivers/${driverId}`).then((r) => r.json()),
      fetch(`/api/zappo/drivers/${driverId}/wallet`).then((r) => r.json()),
      fetch(`/api/zappo/drivers/${driverId}/sessions`).then((r) => r.json()),
    ])
      .then(([d, w, s]) => {
        setDriver(d);
        setWallet(w);
        setSessions(Array.isArray(s) ? s : []);
      })
      .catch(() => setError('Failed to load driver'))
      .finally(() => setLoading(false));
  }, [driverId]);

  if (loading) return <div className={pageMargin}><p className="text-muted-foreground">Loading…</p></div>;
  if (error) return <div className={pageMargin}><p className="text-destructive">{error}</p></div>;
  if (!driver) return <div className={pageMargin}><p className="text-muted-foreground">Driver not found.</p></div>;

  return (
    <div className={`${pageMargin} flex flex-col gap-6`}>
      <div className="flex items-center gap-3">
        <ChevronLeft className="cursor-pointer" onClick={() => router.push('/zappo/drivers')} />
        <h2 className={heading2Style}>{driver.name || 'Unnamed driver'}</h2>
        <Badge variant={driver.isVerified ? 'default' : 'secondary'}>
          {driver.isVerified ? 'Verified' : 'Unverified'}
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-2"><span className="font-semibold">Profile</span></CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div><div className="text-muted-foreground text-xs">Phone</div>{driver.phone}</div>
          <div><div className="text-muted-foreground text-xs">Email</div>{driver.email || '—'}</div>
          <div><div className="text-muted-foreground text-xs">Driver ID</div>#{driver.id}</div>
          <div><div className="text-muted-foreground text-xs">Joined</div>{new Date(driver.createdAt).toLocaleDateString()}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <span className="font-semibold">Wallet</span>
          <span className="text-lg font-bold text-success">{inr(wallet?.balance)}</span>
        </CardHeader>
        <CardContent className="flex flex-col divide-y">
          {(wallet?.transactions ?? []).map((tx) => (
            <div key={tx.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <div>{tx.description || tx.type}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(tx.createdAt).toLocaleString()}
                </div>
              </div>
              <span className={tx.type === 'credit' ? 'text-success font-medium' : 'text-destructive font-medium'}>
                {tx.type === 'credit' ? '+' : '-'}{inr(tx.amount)}
              </span>
            </div>
          ))}
          {(wallet?.transactions ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground py-2">No transactions yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><span className="font-semibold">Session History</span></CardHeader>
        <CardContent className="flex flex-col divide-y">
          {sessions.map((s) => (
            <div key={s.id} className="py-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  Session #{s.id}
                  {s.isActive && <Badge variant="default" className="ml-2">Active</Badge>}
                </div>
                <span className="font-semibold">{inr(s.totalCost ?? s.amount)}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {s.totalKwh ? `${Number(s.totalKwh).toFixed(2)} kWh · ` : ''}
                {s.startTime ? new Date(s.startTime).toLocaleString() : '—'}
              </div>
              {s.gstAmount != null && (
                <div className="text-xs text-muted-foreground mt-1">
                  Energy ₹{Number(s.amount ?? 0).toFixed(2)} + GST ₹{Number(s.gstAmount).toFixed(2)}
                  {s.gstRatePercent != null ? ` (${Number(s.gstRatePercent).toFixed(0)}%)` : ''}
                </div>
              )}
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-sm text-muted-foreground py-2">No sessions yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
