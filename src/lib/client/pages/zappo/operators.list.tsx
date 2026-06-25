'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@lib/client/components/ui/button';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { Badge } from '@lib/client/components/ui/badge';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { Pencil, Plus, PowerOff, Search, Zap } from 'lucide-react';
import { Input } from '@lib/client/components/ui/input';
import type { VsOperator } from '@lib/zappo/types';

export const OperatorsList = () => {
  const router = useRouter();
  const [operators, setOperators] = useState<VsOperator[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadOperators = () => {
    setLoading(true);
    fetch('/api/zappo/operators')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setOperators(data);
        else setError('Failed to load operators');
      })
      .catch(() => setError('Failed to load operators'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadOperators(); }, []);

  const q = search.toLowerCase();
  const filtered = operators.filter(
    (op) =>
      op.name.toLowerCase().includes(q) ||
      op.email.toLowerCase().includes(q) ||
      (op.company ?? '').toLowerCase().includes(q),
  );

  const toggleActive = async (op: VsOperator) => {
    setToggling(op.id);
    try {
      await fetch(`/api/zappo/operators/${op.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !op.isActive }),
      });
      loadOperators();
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className={`${pageMargin} flex flex-col gap-6`}>
      <div className="flex items-center justify-between">
        <h2 className={heading2Style}>Operators</h2>
        <Button variant="success" onClick={() => router.push('/zappo/operators/new')}>
          <Plus className="size-4 mr-2" />
          New Operator
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email or company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">{error}</p>}

      {!loading && !error && operators.length === 0 && (
        <p className="text-muted-foreground">No operators yet. Create one to get started.</p>
      )}

      {!loading && !error && operators.length > 0 && filtered.length === 0 && (
        <p className="text-muted-foreground text-sm">No operators match "{search}".</p>
      )}

      <div className="flex flex-col gap-3">
        {filtered.map((op) => (
          <Card key={op.id}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-semibold">{op.name}</span>
                <Badge variant={op.isActive ? 'default' : 'secondary'}>
                  {op.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/zappo/operators/${op.id}/edit`)}
                >
                  <Pencil className="size-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={toggling === op.id}
                  onClick={() => toggleActive(op)}
                >
                  {op.isActive
                    ? <><PowerOff className="size-4 mr-1" />Deactivate</>
                    : <><Zap className="size-4 mr-1" />Activate</>}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/zappo/operators/${op.id}/assign`)}
                >
                  <Plus className="size-4 mr-1" />
                  Assign Station
                </Button>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground flex gap-6">
              <span>{op.email}</span>
              {op.company && <span>{op.company}</span>}
              {op.phone && <span>{op.phone}</span>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
