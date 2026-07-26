'use client';

import { useEffect, useState } from 'react';
import { Button } from '@lib/client/components/ui/button';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { Input } from '@lib/client/components/ui/input';
import { Badge } from '@lib/client/components/ui/badge';
import { Switch } from '@lib/client/components/ui/switch';
import { Label } from '@lib/client/components/ui/label';
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
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { AlertTriangle, Inbox, Pencil } from 'lucide-react';
import type {
  VsAlertCatalogEntry,
  VsAlertSeverity,
  VsDriverAction,
} from '@lib/zappo/types';

const SEVERITIES: VsAlertSeverity[] = ['ok', 'warning', 'failed'];
const CATEGORIES = [
  'voltage',
  'current',
  'temperature',
  'electrical',
  'hardware',
  'software',
  'vehicle',
  'connectivity',
  'other',
];

// What we tell the driver to actually do. Kept to the handful of things a driver can
// realistically try, so "which of these is it" is the only judgement an admin has to make.
const ACTIONS: { value: VsDriverAction; label: string }[] = [
  { value: 'none', label: 'Nothing — informational' },
  { value: 'retry', label: 'Try starting again' },
  { value: 'reconnect', label: 'Unplug and replug the connector' },
  { value: 'try_other', label: 'Use another connector' },
  { value: 'wait', label: 'Wait and try shortly' },
  { value: 'support', label: 'Technicians have been notified' },
];

const severityStyle: Record<VsAlertSeverity, string> = {
  ok: 'bg-muted text-muted-foreground',
  warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  failed: 'bg-destructive/15 text-destructive',
};

export const AlertsCatalogPage = () => {
  const [entries, setEntries] = useState<VsAlertCatalogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<VsAlertCatalogEntry | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/zappo/alerts/catalog')
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setEntries(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const uncurated = entries.filter((e) => !e.isCurated);
  const curated = entries.filter((e) => e.isCurated);

  return (
    <div className={`${pageMargin} flex flex-col gap-6`}>
      <div>
        <h2 className={heading2Style}>Alert Messages</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-3xl">
          What a driver and a station owner are told when a charger reports a
          problem. Every code is shown to someone — an uncurated code still
          surfaces an honest generic message; wording it here just makes it
          specific and useful. Raw payloads stay admin-only regardless.
        </p>
      </div>

      {loading && <p className="text-muted-foreground">Loading…</p>}

      {!loading && uncurated.length > 0 && (
        <Card className="border-amber-500/40">
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <Inbox className="size-4 text-amber-500" />
            <span className="font-semibold">
              New codes awaiting wording ({uncurated.length})
            </span>
          </CardHeader>
          <CardContent className="flex flex-col divide-y">
            {uncurated.map((e) => (
              <AlertRow key={e.id} entry={e} onEdit={() => setEditing(e)} />
            ))}
          </CardContent>
        </Card>
      )}

      {!loading && (
        <Card>
          <CardHeader className="pb-2">
            <span className="font-semibold">
              Curated messages ({curated.length})
            </span>
          </CardHeader>
          <CardContent className="flex flex-col divide-y">
            {curated.map((e) => (
              <AlertRow key={e.id} entry={e} onEdit={() => setEditing(e)} />
            ))}
            {curated.length === 0 && (
              <p className="text-sm text-muted-foreground py-3">
                Nothing curated yet.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <CurateDialog
        entry={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />
    </div>
  );
};

function AlertRow({
  entry,
  onEdit,
}: {
  entry: VsAlertCatalogEntry;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{entry.code}</span>
          <Badge className={severityStyle[entry.severity]}>
            {entry.severity}
          </Badge>
          <Badge variant="secondary">{entry.category}</Badge>
          {entry.source === 'vendor' && (
            <Badge variant="outline">{entry.vendorId || 'vendor'}</Badge>
          )}
          {entry.isSensitive && (
            <Badge variant="outline" className="gap-1">
              <AlertTriangle className="size-3" /> sensitive
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          <span className="font-medium text-foreground/70">Driver:</span>{' '}
          {entry.driverMessage}
        </p>
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground/70">Owner:</span>{' '}
          {entry.ownerMessage}
        </p>
        {entry.lastSeenAt && (
          <p className="text-xs text-muted-foreground mt-1">
            Last seen {new Date(entry.lastSeenAt).toLocaleString('en-IN')}
          </p>
        )}
      </div>
      <Button variant="outline" size="sm" onClick={onEdit}>
        <Pencil className="size-4 mr-1" />
        {entry.isCurated ? 'Edit' : 'Curate'}
      </Button>
    </div>
  );
}

function CurateDialog({
  entry,
  onClose,
  onSaved,
}: {
  entry: VsAlertCatalogEntry | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [severity, setSeverity] = useState<VsAlertSeverity>('warning');
  const [category, setCategory] = useState('other');
  const [driverMessage, setDriverMessage] = useState('');
  const [driverAction, setDriverAction] = useState<VsDriverAction>('support');
  const [ownerMessage, setOwnerMessage] = useState('');
  const [isSensitive, setIsSensitive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!entry) return;
    setSeverity(entry.severity);
    setCategory(entry.category);
    setDriverMessage(entry.driverMessage ?? '');
    setDriverAction(entry.driverAction);
    setOwnerMessage(entry.ownerMessage ?? '');
    setIsSensitive(entry.isSensitive);
    setError('');
  }, [entry]);

  if (!entry) return null;

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/zappo/alerts/catalog/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          severity,
          category,
          driverMessage,
          driverAction,
          ownerMessage,
          isSensitive,
        }),
      });
      if (res.ok) onSaved();
      else setError('Failed to save');
    } catch {
      setError('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{entry.code}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Severity</label>
              <Select
                value={severity}
                onValueChange={(v) => setSeverity(v as VsAlertSeverity)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                &lsquo;failed&rsquo; marks the connector unusable.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Category</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">What the driver sees</label>
            <Input
              value={driverMessage}
              onChange={(e) => setDriverMessage(e.target.value)}
              placeholder="Plain language, no jargon, no raw codes"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              What the driver should do
            </label>
            <Select
              value={driverAction}
              onValueChange={(v) => setDriverAction(v as VsDriverAction)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIONS.map((a) => (
                  <SelectItem key={a.value} value={a.value}>
                    {a.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              What the station owner sees
            </label>
            <Input
              value={ownerMessage}
              onChange={(e) => setOwnerMessage(e.target.value)}
              placeholder="More technical, but still readable"
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              id="sensitive"
              checked={isSensitive}
              onCheckedChange={setIsSensitive}
            />
            <Label htmlFor="sensitive" className="cursor-pointer">
              Hide the raw code from the owner
            </Label>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            The owner still sees your wording above — this only suppresses the
            technical code alongside it. Admins always see everything.
          </p>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={save}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
