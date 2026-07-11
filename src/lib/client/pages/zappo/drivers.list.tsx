'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@lib/client/components/ui/card';
import { Input } from '@lib/client/components/ui/input';
import { Badge } from '@lib/client/components/ui/badge';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { Search } from 'lucide-react';
import type { VsAdminDriver, VsAdminDriverListResponse } from '@lib/zappo/types';

export const DriversList = () => {
  const router = useRouter();
  const [drivers, setDrivers] = useState<VsAdminDriver[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    const qs = search ? `?search=${encodeURIComponent(search)}` : '';
    const timeout = setTimeout(() => {
      fetch(`/api/zappo/drivers${qs}`)
        .then((r) => r.json())
        .then((data: VsAdminDriverListResponse) => {
          setDrivers(data.data ?? []);
          setTotal(data.total ?? 0);
        })
        .catch(() => setError('Failed to load drivers'))
        .finally(() => setLoading(false));
    }, 300); // debounce search
    return () => clearTimeout(timeout);
  }, [search]);

  return (
    <div className={`${pageMargin} flex flex-col gap-6`}>
      <h2 className={heading2Style}>Drivers</h2>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by phone or name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">{error}</p>}

      {!loading && !error && (
        <>
          <p className="text-sm text-muted-foreground">{total} driver{total === 1 ? '' : 's'}</p>
          <div className="flex flex-col gap-2">
            {drivers.map((d) => (
              <Card
                key={d.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => router.push(`/zappo/drivers/${d.id}`)}
              >
                <CardContent className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{d.name || 'Unnamed driver'}</div>
                    <div className="text-sm text-muted-foreground">{d.phone}</div>
                  </div>
                  <Badge variant={d.isVerified ? 'default' : 'secondary'}>
                    {d.isVerified ? 'Verified' : 'Unverified'}
                  </Badge>
                </CardContent>
              </Card>
            ))}
            {drivers.length === 0 && (
              <p className="text-sm text-muted-foreground">No drivers match.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
