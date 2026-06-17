'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@lib/client/components/ui/button';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { Badge } from '@lib/client/components/ui/badge';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { Plus, Link2 } from 'lucide-react';
import type { VsOperator } from '@lib/voltstation/types';

export const OperatorsList = () => {
  const router = useRouter();
  const [operators, setOperators] = useState<VsOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/voltstation/operators')
      .then((r) => r.json())
      .then(setOperators)
      .catch(() => setError('Failed to load operators'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className={`${pageMargin} flex flex-col gap-6`}>
      <div className="flex items-center justify-between">
        <h2 className={heading2Style}>Operators</h2>
        <Button variant="success" onClick={() => router.push('/voltstation/operators/new')}>
          <Plus className="size-4 mr-2" />
          New Operator
        </Button>
      </div>

      {loading && <p className="text-muted-foreground">Loading…</p>}
      {error && <p className="text-destructive">{error}</p>}

      {!loading && !error && operators.length === 0 && (
        <p className="text-muted-foreground">No operators yet. Create one to get started.</p>
      )}

      <div className="flex flex-col gap-3">
        {operators.map((op) => (
          <Card key={op.id}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-semibold">{op.name}</span>
                <Badge variant={op.isActive ? 'default' : 'secondary'}>
                  {op.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/voltstation/operators/${op.id}/assign`)}
              >
                <Link2 className="size-4 mr-2" />
                Assign Station
              </Button>
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
