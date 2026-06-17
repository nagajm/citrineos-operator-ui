'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@lib/client/components/ui/button';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { Badge } from '@lib/client/components/ui/badge';
import { heading2Style, heading3Style, pageMargin } from '@lib/client/styles/page';
import { cardHeaderFlex } from '@lib/client/styles/card';
import { ChevronLeft, Trash2 } from 'lucide-react';
import type { VsStation } from '@lib/voltstation/types';

interface Props {
  operatorId: string;
}

export const OperatorsAssign = ({ operatorId }: Props) => {
  const router = useRouter();
  const [allStations, setAllStations] = useState<VsStation[]>([]);
  const [assigned, setAssigned] = useState<VsStation[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [allRes, assignedRes] = await Promise.all([
        fetch('/api/voltstation/stations'),
        fetch(`/api/voltstation/operators/${operatorId}/stations`),
      ]);
      setAllStations(await allRes.json());
      setAssigned(await assignedRes.json());
    } catch {
      setError('Failed to load station data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [operatorId]);

  const assignedIds = new Set(assigned.map((s) => s.id));
  const available = allStations.filter((s) => !assignedIds.has(s.id));

  const handleAssign = async () => {
    if (!selectedId) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/voltstation/operators/${operatorId}/stations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId: parseInt(selectedId) }),
      });
      if (!res.ok) throw new Error('Failed to assign station');
      setSelectedId('');
      await loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUnassign = async (stationId: number) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/voltstation/operators/${operatorId}/stations`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stationId }),
      });
      if (!res.ok) throw new Error('Failed to unassign station');
      await loadData();
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
          <h2 className={heading2Style}>Assign Stations</h2>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {loading && <p className="text-muted-foreground">Loading…</p>}
        {error && <p className="text-destructive text-sm">{error}</p>}

        {!loading && (
          <>
            {/* Assigned stations */}
            <div>
              <h3 className={`${heading3Style} mb-3`}>Assigned Stations</h3>
              {assigned.length === 0 ? (
                <p className="text-muted-foreground text-sm">No stations assigned yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {assigned.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-md border px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{s.ocppConnectionName}</span>
                        {s.location && <span className="text-muted-foreground text-sm">{s.location.name}</span>}
                        <Badge variant={s.isOnline ? 'default' : 'secondary'}>
                          {s.isOnline ? 'Online' : 'Offline'}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={saving}
                        onClick={() => handleUnassign(s.id)}
                      >
                        <Trash2 className="size-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assign new station */}
            {available.length > 0 && (
              <div>
                <h3 className={`${heading3Style} mb-3`}>Add Station</h3>
                <div className="flex gap-3 items-center">
                  <select
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 flex-1"
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                  >
                    <option value="">Select a station…</option>
                    {available.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.ocppConnectionName}{s.location ? ` — ${s.location.name}` : ''}
                      </option>
                    ))}
                  </select>
                  <Button variant="success" disabled={!selectedId || saving} onClick={handleAssign}>
                    {saving ? 'Assigning…' : 'Assign'}
                  </Button>
                </div>
              </div>
            )}

            {available.length === 0 && assigned.length > 0 && (
              <p className="text-muted-foreground text-sm">All stations are already assigned to this operator.</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
