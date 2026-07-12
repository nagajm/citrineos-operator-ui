'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@lib/client/components/ui/button';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { Badge } from '@lib/client/components/ui/badge';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { Copy, KeyRound, Pencil, Plus, PowerOff, Search, Trash2, Zap } from 'lucide-react';
import { Input } from '@lib/client/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@lib/client/components/ui/dialog';
import type { VsOperator } from '@lib/zappo/types';

export const OperatorsList = () => {
  const router = useRouter();
  const [operators, setOperators] = useState<VsOperator[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<number | null>(null);
  const [resetTarget, setResetTarget] = useState<VsOperator | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [submittingReset, setSubmittingReset] = useState(false);
  const [resetResult, setResetResult] = useState<{ name: string; password: string } | null>(null);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<VsOperator | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

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

  const submitReset = async () => {
    if (!resetTarget) return;
    if (passwordInput && passwordInput.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    setPasswordError('');
    setSubmittingReset(true);
    try {
      const res = await fetch(`/api/zappo/operators/${resetTarget.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordInput || undefined }),
      });
      const data = await res.json();
      if (res.ok && data.password) {
        setResetResult({ name: resetTarget.name, password: data.password });
        setResetTarget(null);
      } else {
        setPasswordError(data.message ?? 'Failed to reset password');
      }
    } catch {
      setPasswordError('Failed to reset password');
    } finally {
      setSubmittingReset(false);
    }
  };

  const submitDelete = async () => {
    if (!deleteTarget) return;
    setDeleteError('');
    setDeleting(true);
    try {
      const res = await fetch(`/api/zappo/operators/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setDeleteTarget(null);
        loadOperators();
      } else {
        const data = await res.json().catch(() => ({}));
        setDeleteError(data.message ?? 'Failed to delete operator');
      }
    } catch {
      setDeleteError('Failed to delete operator');
    } finally {
      setDeleting(false);
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
                {op.gstEnabled && (
                  <Badge variant="secondary" title={op.gstin ?? undefined}>GST Registered</Badge>
                )}
                {op.commissionPercent != null && (
                  <Badge variant="secondary" title="Overrides the platform default commission rate">
                    {op.commissionPercent}% commission
                  </Badge>
                )}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setResetTarget(op); setPasswordInput(''); setPasswordError(''); }}
                >
                  <KeyRound className="size-4 mr-1" />
                  Reset Password
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => { setDeleteTarget(op); setDeleteError(''); }}
                >
                  <Trash2 className="size-4 mr-1" />
                  Delete
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

      <Dialog open={!!resetTarget} onOpenChange={(open) => { if (!open) setResetTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password for {resetTarget?.name}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Enter a new password, or leave blank to auto-generate one. This immediately
            invalidates the operator's current password.
          </p>
          <Input
            type="text"
            placeholder="New password (optional)"
            value={passwordInput}
            onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(''); }}
          />
          {passwordError && <p className="text-sm text-destructive">{passwordError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetTarget(null)}>
              Cancel
            </Button>
            <Button disabled={submittingReset} onClick={submitReset}>
              {passwordInput ? 'Set Password' : 'Generate & Reset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {deleteTarget?.name}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This permanently removes the operator account, including any RFID cards and driver
            pricing overrides tied to it. This can't be undone — use Deactivate instead if you
            just want to disable their login. Blocked if any stations are still assigned to them.
          </p>
          {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={submitDelete}>
              {deleting ? 'Deleting…' : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetResult} onOpenChange={(open) => { if (!open) setResetResult(null); }}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Password reset for {resetResult?.name}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Share this password with the operator directly — it won't be shown again. There's no
            self-service reset yet, so this is the only copy.
          </p>
          <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2 font-mono text-sm">
            <span className="flex-1 select-all">{resetResult?.password}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => resetResult && navigator.clipboard.writeText(resetResult.password)}
            >
              <Copy className="size-4" />
            </Button>
          </div>
          <DialogFooter>
            <Button onClick={() => setResetResult(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
