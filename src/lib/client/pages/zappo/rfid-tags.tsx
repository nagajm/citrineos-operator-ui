'use client';

import { useEffect, useState } from 'react';
import { Button } from '@lib/client/components/ui/button';
import { Card, CardContent } from '@lib/client/components/ui/card';
import { Badge } from '@lib/client/components/ui/badge';
import { Input } from '@lib/client/components/ui/input';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { CreditCard, Plus, Power, PowerOff } from 'lucide-react';
import type { VsOperator, VsRfidTag } from '@lib/zappo/types';

const BLANK_CARD = { idToken: '', label: '' };

function CardRow({ tag, onToggle }: { tag: VsRfidTag; onToggle: (tag: VsRfidTag) => void }) {
  return (
    <Card className="shadow-none">
      <CardContent className="py-3 flex items-center gap-4">
        <CreditCard className="size-5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-mono text-sm">{tag.idToken}</p>
            {tag.cardType === 'super_admin' && (
              <Badge variant="default" className="text-xs">Super Admin</Badge>
            )}
            {!tag.isActive && <Badge variant="outline" className="text-xs text-muted-foreground">Inactive</Badge>}
            {tag.linkedDriverId
              ? <Badge variant="outline" className="text-xs">Claimed</Badge>
              : <Badge variant="outline" className="text-xs text-muted-foreground">Unclaimed</Badge>}
          </div>
          {tag.label && <p className="text-xs text-muted-foreground">{tag.label}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={() => onToggle(tag)}>
          {tag.isActive
            ? <><PowerOff className="size-4 mr-1" />Deactivate</>
            : <><Power className="size-4 mr-1" />Activate</>}
        </Button>
      </CardContent>
    </Card>
  );
}

export const RfidTagsPage = () => {
  const [operators, setOperators] = useState<VsOperator[]>([]);
  const [operatorId, setOperatorId] = useState('');
  const [operatorTags, setOperatorTags] = useState<VsRfidTag[]>([]);
  const [superAdminTags, setSuperAdminTags] = useState<VsRfidTag[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);

  const [showNewCard, setShowNewCard] = useState(false);
  const [cardForm, setCardForm] = useState(BLANK_CARD);
  const [savingCard, setSavingCard] = useState(false);
  const [cardError, setCardError] = useState('');

  const [showSuperAdminCard, setShowSuperAdminCard] = useState(false);
  const [superAdminForm, setSuperAdminForm] = useState({ idToken: '', label: '' });
  const [savingSuperAdminCard, setSavingSuperAdminCard] = useState(false);
  const [superAdminError, setSuperAdminError] = useState('');

  useEffect(() => {
    fetch('/api/zappo/operators')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setOperators(d); });
    loadSuperAdminTags();
  }, []);

  const loadSuperAdminTags = () => {
    fetch('/api/zappo/rfid-tags/super-admin')
      .then((r) => r.json())
      .then((d) => setSuperAdminTags(Array.isArray(d) ? d : []));
  };

  const loadOperatorTags = (id: string) => {
    if (!id) { setOperatorTags([]); return; }
    setLoadingTags(true);
    fetch(`/api/zappo/operators/${id}/rfid-tags`)
      .then((r) => r.json())
      .then((d) => setOperatorTags(Array.isArray(d) ? d : []))
      .finally(() => setLoadingTags(false));
  };

  useEffect(() => { loadOperatorTags(operatorId); }, [operatorId]);

  const registerCard = async (isSuperAdmin: boolean) => {
    const form = isSuperAdmin ? superAdminForm : cardForm;
    if (!form.idToken.trim()) return;
    const setSaving = isSuperAdmin ? setSavingSuperAdminCard : setSavingCard;
    const setError = isSuperAdmin ? setSuperAdminError : setCardError;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/zappo/rfid-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          isSuperAdmin
            ? { idToken: superAdminForm.idToken.trim(), label: superAdminForm.label || undefined, cardType: 'super_admin' }
            // Supply card handed to an operator — the operator decides later whether it's
            // their own or a customer's; we don't make that call for them (cardType defaults
            // to 'customer' in the DB, but it has no effect on billing/authorization either way).
            : { idToken: cardForm.idToken.trim(), label: cardForm.label || undefined, cardType: 'customer', operatorId },
        ),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? 'Failed to register card'); return; }
      if (isSuperAdmin) {
        setShowSuperAdminCard(false);
        setSuperAdminForm({ idToken: '', label: '' });
        loadSuperAdminTags();
      } else {
        setShowNewCard(false);
        setCardForm(BLANK_CARD);
        loadOperatorTags(operatorId);
      }
    } catch {
      setError('Failed to register card');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (tag: VsRfidTag, isSuperAdmin: boolean) => {
    await fetch(`/api/zappo/rfid-tags/${tag.id}/active`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !tag.isActive }),
    });
    if (isSuperAdmin) loadSuperAdminTags();
    else loadOperatorTags(operatorId);
  };

  return (
    <div className={`${pageMargin} flex flex-col gap-8`}>
      <div>
        <h2 className={heading2Style}>RFID Cards</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Add your own test cards, and supply authorized cards to station owners — they decide
          whether to use it themselves or hand it to a driver, and set any pricing from their own
          account.
        </p>
      </div>

      {/* Super admin cards */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Super Admin Cards</h3>
          <Button variant="outline" size="sm" onClick={() => setShowSuperAdminCard(true)}>
            <Plus className="size-4 mr-1" /> Register Card
          </Button>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">Valid at any station, for internal testing.</p>

        {showSuperAdminCard && (
          <Card className="border-dashed">
            <CardContent className="py-4 flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="RFID idToken *" value={superAdminForm.idToken}
                  onChange={(e) => setSuperAdminForm({ ...superAdminForm, idToken: e.target.value })} />
                <Input placeholder="Label (optional)" value={superAdminForm.label}
                  onChange={(e) => setSuperAdminForm({ ...superAdminForm, label: e.target.value })} />
              </div>
              {superAdminError && <p className="text-sm text-destructive">{superAdminError}</p>}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => { setShowSuperAdminCard(false); setSuperAdminError(''); }}>Cancel</Button>
                <Button variant="success" size="sm" disabled={savingSuperAdminCard || !superAdminForm.idToken.trim()} onClick={() => registerCard(true)}>
                  {savingSuperAdminCard ? 'Saving…' : 'Register'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col gap-2">
          {superAdminTags.map((tag) => <CardRow key={tag.id} tag={tag} onToggle={(t) => toggleActive(t, true)} />)}
          {superAdminTags.length === 0 && <p className="text-sm text-muted-foreground">No super admin cards yet.</p>}
        </div>
      </section>

      {/* Cards supplied to an operator */}
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Cards Supplied to an Operator</h3>
        <select
          className="border border-input rounded-md px-3 py-2 text-sm bg-background max-w-sm"
          value={operatorId}
          onChange={(e) => setOperatorId(e.target.value)}
        >
          <option value="">Select an operator…</option>
          {operators.map((op) => <option key={op.id} value={op.id}>{op.name}</option>)}
        </select>

        {operatorId && (
          <>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">Physical cards authorized for this operator's use</p>
              <Button variant="outline" size="sm" onClick={() => setShowNewCard(true)}>
                <Plus className="size-4 mr-1" /> Supply Card
              </Button>
            </div>

            {showNewCard && (
              <Card className="border-dashed">
                <CardContent className="py-4 flex flex-col gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input placeholder="RFID idToken *" value={cardForm.idToken}
                      onChange={(e) => setCardForm({ ...cardForm, idToken: e.target.value })} />
                    <Input placeholder="Label (optional)" value={cardForm.label}
                      onChange={(e) => setCardForm({ ...cardForm, label: e.target.value })} />
                  </div>
                  {cardError && <p className="text-sm text-destructive">{cardError}</p>}
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => { setShowNewCard(false); setCardError(''); }}>Cancel</Button>
                    <Button variant="success" size="sm" disabled={savingCard || !cardForm.idToken.trim()} onClick={() => registerCard(false)}>
                      {savingCard ? 'Saving…' : 'Supply'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {loadingTags && <p className="text-sm text-muted-foreground">Loading…</p>}
            <div className="flex flex-col gap-2">
              {operatorTags.map((tag) => <CardRow key={tag.id} tag={tag} onToggle={(t) => toggleActive(t, false)} />)}
              {!loadingTags && operatorTags.length === 0 && (
                <p className="text-sm text-muted-foreground">No cards supplied to this operator yet.</p>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
};
