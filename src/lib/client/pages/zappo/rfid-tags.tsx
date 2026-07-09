'use client';

import { useEffect, useState } from 'react';
import { Button } from '@lib/client/components/ui/button';
import { Card, CardContent } from '@lib/client/components/ui/card';
import { Badge } from '@lib/client/components/ui/badge';
import { Input } from '@lib/client/components/ui/input';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { CreditCard, Plus, Power, PowerOff } from 'lucide-react';
import type { VsOperator, VsRfidCardType, VsRfidTag, VsPricingMode, VsDiscountType } from '@lib/zappo/types';

const BLANK_CARD = { idToken: '', label: '', cardType: 'customer' as VsRfidCardType };
const BLANK_DISCOUNT = {
  phone: '',
  pricingMode: 'discounted' as VsPricingMode,
  discountType: 'percent' as VsDiscountType,
  discountValue: '',
};

function CardRow({ tag, onToggle }: { tag: VsRfidTag; onToggle: (tag: VsRfidTag) => void }) {
  return (
    <Card className="shadow-none">
      <CardContent className="py-3 flex items-center gap-4">
        <CreditCard className="size-5 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-mono text-sm">{tag.idToken}</p>
            <Badge variant={tag.cardType === 'owner' ? 'default' : 'secondary'} className="text-xs">
              {tag.cardType === 'super_admin' ? 'Super Admin' : tag.cardType === 'owner' ? 'Owner' : 'Customer'}
            </Badge>
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

  const [discountForm, setDiscountForm] = useState(BLANK_DISCOUNT);
  const [savingDiscount, setSavingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState('');
  const [discountResult, setDiscountResult] = useState<{ phone: string; driverId: string } | null>(null);

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
            : { idToken: cardForm.idToken.trim(), label: cardForm.label || undefined, cardType: cardForm.cardType, operatorId },
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

  const grantDiscount = async () => {
    if (!operatorId || !discountForm.phone.trim()) return;
    if (discountForm.pricingMode === 'discounted' && !discountForm.discountValue) {
      setDiscountError('Enter a discount value');
      return;
    }
    setSavingDiscount(true);
    setDiscountError('');
    try {
      const res = await fetch(`/api/zappo/operators/${operatorId}/pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: discountForm.phone.trim(),
          pricingMode: discountForm.pricingMode,
          discountType: discountForm.pricingMode === 'discounted' ? discountForm.discountType : undefined,
          discountValue: discountForm.pricingMode === 'discounted' ? Number(discountForm.discountValue) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setDiscountError(data.message ?? 'Failed to set pricing'); return; }
      setDiscountResult({ phone: discountForm.phone.trim(), driverId: data.driver?.id ?? '' });
      setDiscountForm(BLANK_DISCOUNT);
    } catch {
      setDiscountError('Failed to set pricing');
    } finally {
      setSavingDiscount(false);
    }
  };

  return (
    <div className={`${pageMargin} flex flex-col gap-8`}>
      <div>
        <h2 className={heading2Style}>RFID Cards & Pricing</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Register test/customer cards per operator, and grant per-driver discounts that apply
          whether the driver taps a card or pays through the app.
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

      {/* Per-operator cards + pricing */}
      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Operator Cards & Discounts</h3>
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
              <p className="text-xs text-muted-foreground">Owner test cards and customer cards for this operator</p>
              <Button variant="outline" size="sm" onClick={() => setShowNewCard(true)}>
                <Plus className="size-4 mr-1" /> Register Card
              </Button>
            </div>

            {showNewCard && (
              <Card className="border-dashed">
                <CardContent className="py-4 flex flex-col gap-3">
                  <div className="grid grid-cols-3 gap-3">
                    <Input placeholder="RFID idToken *" value={cardForm.idToken}
                      onChange={(e) => setCardForm({ ...cardForm, idToken: e.target.value })} />
                    <Input placeholder="Label (optional)" value={cardForm.label}
                      onChange={(e) => setCardForm({ ...cardForm, label: e.target.value })} />
                    <select
                      className="border border-input rounded-md px-3 py-2 text-sm bg-background"
                      value={cardForm.cardType}
                      onChange={(e) => setCardForm({ ...cardForm, cardType: e.target.value as VsRfidCardType })}
                    >
                      <option value="owner">Owner (operator's own)</option>
                      <option value="customer">Customer</option>
                    </select>
                  </div>
                  {cardError && <p className="text-sm text-destructive">{cardError}</p>}
                  <div className="flex gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => { setShowNewCard(false); setCardError(''); }}>Cancel</Button>
                    <Button variant="success" size="sm" disabled={savingCard || !cardForm.idToken.trim()} onClick={() => registerCard(false)}>
                      {savingCard ? 'Saving…' : 'Register'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {loadingTags && <p className="text-sm text-muted-foreground">Loading…</p>}
            <div className="flex flex-col gap-2">
              {operatorTags.map((tag) => <CardRow key={tag.id} tag={tag} onToggle={(t) => toggleActive(t, false)} />)}
              {!loadingTags && operatorTags.length === 0 && (
                <p className="text-sm text-muted-foreground">No cards registered for this operator yet.</p>
              )}
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Grant a Discount</h4>
              <p className="text-xs text-muted-foreground mb-3">
                By phone number — applies to the driver's rate at this operator whether they charge via
                RFID or the app. The driver account is created automatically if they haven't signed up yet;
                the discount takes effect once they do.
              </p>
              <Card>
                <CardContent className="py-4 flex flex-col gap-3">
                  <div className="grid grid-cols-4 gap-3 items-start">
                    <Input placeholder="Driver phone *" value={discountForm.phone}
                      onChange={(e) => setDiscountForm({ ...discountForm, phone: e.target.value })} />
                    <select
                      className="border border-input rounded-md px-3 py-2 text-sm bg-background"
                      value={discountForm.pricingMode}
                      onChange={(e) => setDiscountForm({ ...discountForm, pricingMode: e.target.value as VsPricingMode })}
                    >
                      <option value="standard">Standard pricing</option>
                      <option value="discounted">Discounted</option>
                    </select>
                    {discountForm.pricingMode === 'discounted' && (
                      <>
                        <select
                          className="border border-input rounded-md px-3 py-2 text-sm bg-background"
                          value={discountForm.discountType}
                          onChange={(e) => setDiscountForm({ ...discountForm, discountType: e.target.value as VsDiscountType })}
                        >
                          <option value="percent">Percent off</option>
                          <option value="flat">Flat ₹/kWh off</option>
                        </select>
                        <Input
                          type="number"
                          min={0}
                          max={discountForm.discountType === 'percent' ? 100 : undefined}
                          placeholder={discountForm.discountType === 'percent' ? '% off (0-100)' : '₹ off per kWh'}
                          value={discountForm.discountValue}
                          onChange={(e) => setDiscountForm({ ...discountForm, discountValue: e.target.value })}
                        />
                      </>
                    )}
                  </div>
                  {discountError && <p className="text-sm text-destructive">{discountError}</p>}
                  <div className="flex justify-end">
                    <Button variant="success" size="sm" disabled={savingDiscount || !discountForm.phone.trim()} onClick={grantDiscount}>
                      {savingDiscount ? 'Saving…' : 'Save Pricing'}
                    </Button>
                  </div>
                  {discountResult && (
                    <p className="text-xs text-muted-foreground">
                      Pricing saved for {discountResult.phone}. This never charges more than the
                      station's standard rate — only equal to or less.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </section>
    </div>
  );
};
