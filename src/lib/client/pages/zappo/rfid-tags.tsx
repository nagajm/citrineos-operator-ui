'use client';

import { useEffect, useState } from 'react';
import { Button } from '@lib/client/components/ui/button';
import { Card, CardContent } from '@lib/client/components/ui/card';
import { Badge } from '@lib/client/components/ui/badge';
import { Input } from '@lib/client/components/ui/input';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { CreditCard, Plus, Power, PowerOff, Wallet } from 'lucide-react';
import type { VsOperator, VsRfidTag } from '@lib/zappo/types';

const BLANK_CARD = { idToken: '', label: '' };
const DRIVER_TOKEN_KEY = 'zappo_driver_token';

function CardRow({
  tag,
  onToggle,
  claimable,
  onClaim,
  claiming,
}: {
  tag: VsRfidTag;
  onToggle: (tag: VsRfidTag) => void;
  claimable?: boolean;
  onClaim?: (tag: VsRfidTag) => void;
  claiming?: boolean;
}) {
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
        {claimable && onClaim && (
          <Button variant="success" size="sm" disabled={claiming} onClick={() => onClaim(tag)}>
            {claiming ? 'Claiming…' : 'Claim'}
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={() => onToggle(tag)}>
          {tag.isActive
            ? <><PowerOff className="size-4 mr-1" />Deactivate</>
            : <><Power className="size-4 mr-1" />Activate</>}
        </Button>
      </CardContent>
    </Card>
  );
}

// Links the super admin's OWN driver identity (phone + OTP — the same consent-boundary
// flow the driver app uses) so they can claim a super-admin test card as themselves.
// The resulting driver JWT lives only in sessionStorage on this browser, never in this
// admin's own NextAuth session — the two identities are deliberately kept separate so
// one can never be replayed as the other.
function MyDriverIdentity({ driverToken, onLinked, onUnlink }: {
  driverToken: string | null;
  onLinked: (token: string) => void;
  onUnlink: () => void;
}) {
  const [phone, setPhone] = useState('');
  const [pendingPhone, setPendingPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [topupAmount, setTopupAmount] = useState('');

  const loadWallet = (token: string) => {
    fetch('/api/zappo/driver-identity/wallet', { headers: { 'x-driver-token': token } })
      .then((r) => r.json())
      .then((d) => setBalance(d.balance != null ? Number(d.balance) : null))
      .catch(() => {});
  };

  useEffect(() => { if (driverToken) loadWallet(driverToken); }, [driverToken]);

  const sendOtp = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) { setError('Enter a valid phone number'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/zappo/driver-identity/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: digits.slice(-10) }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? 'Failed to send OTP'); return; }
      setPendingPhone(digits.slice(-10));
      setDevOtp(data.otp ?? '');
      if (data.otp) setOtp(data.otp);
    } catch {
      setError('Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/zappo/driver-identity/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: pendingPhone, otp }),
      });
      const data = await res.json();
      if (!res.ok || !data.accessToken) { setError(data.message ?? 'Incorrect or expired code'); return; }
      sessionStorage.setItem(DRIVER_TOKEN_KEY, data.accessToken);
      onLinked(data.accessToken);
      setPendingPhone('');
      setOtp('');
    } catch {
      setError('Failed to verify code');
    } finally {
      setLoading(false);
    }
  };

  const topUp = async () => {
    const amount = Number(topupAmount);
    if (!driverToken || !amount || amount <= 0) return;
    await fetch('/api/zappo/driver-identity/wallet/topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-driver-token': driverToken },
      body: JSON.stringify({ amount }),
    });
    setTopupAmount('');
    loadWallet(driverToken);
  };

  if (driverToken) {
    return (
      <Card>
        <CardContent className="py-4 flex items-center gap-4">
          <Wallet className="size-5 text-muted-foreground shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Your driver identity is linked</p>
            <p className="text-xs text-muted-foreground">
              Wallet balance: {balance != null ? `₹${balance.toFixed(2)}` : '…'}
            </p>
          </div>
          <Input
            placeholder="₹ top up"
            value={topupAmount}
            onChange={(e) => setTopupAmount(e.target.value)}
            className="w-28"
          />
          <Button variant="outline" size="sm" onClick={topUp}>Top Up (dev)</Button>
          <Button variant="ghost" size="sm" onClick={onUnlink}>Unlink</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-dashed">
      <CardContent className="py-4 flex flex-col gap-3">
        <p className="text-sm font-medium">Link your driver identity to claim a card as yourself</p>
        <p className="text-xs text-muted-foreground">
          A card only becomes usable once claimed from an authenticated driver session — the same
          consent boundary a customer's claim goes through.
        </p>
        {!pendingPhone ? (
          <div className="flex gap-2 max-w-sm">
            <Input placeholder="Your phone number" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Button variant="outline" size="sm" disabled={loading} onClick={sendOtp}>
              {loading ? 'Sending…' : 'Send Code'}
            </Button>
          </div>
        ) : (
          <div className="flex gap-2 max-w-sm items-center">
            <Input placeholder="Code" value={otp} onChange={(e) => setOtp(e.target.value)} className="w-28" />
            <Button variant="success" size="sm" disabled={loading} onClick={verifyOtp}>
              {loading ? 'Verifying…' : 'Verify'}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setPendingPhone(''); setOtp(''); setError(''); }}>Cancel</Button>
            {devOtp && <span className="text-xs text-amber-500">Dev mode — auto-filled</span>}
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
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

  const [driverToken, setDriverToken] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/zappo/operators')
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setOperators(d); });
    loadSuperAdminTags();
    setDriverToken(sessionStorage.getItem(DRIVER_TOKEN_KEY));
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

  const claimCard = async (tag: VsRfidTag) => {
    if (!driverToken) return;
    setClaimingId(tag.id);
    try {
      const res = await fetch('/api/zappo/driver-identity/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-driver-token': driverToken },
        body: JSON.stringify({ idToken: tag.idToken }),
      });
      if (res.ok) loadSuperAdminTags();
    } finally {
      setClaimingId(null);
    }
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

        <MyDriverIdentity
          driverToken={driverToken}
          onLinked={(token) => setDriverToken(token)}
          onUnlink={() => { sessionStorage.removeItem(DRIVER_TOKEN_KEY); setDriverToken(null); }}
        />

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
          {superAdminTags.map((tag) => (
            <CardRow
              key={tag.id}
              tag={tag}
              onToggle={(t) => toggleActive(t, true)}
              claimable={!!driverToken && !tag.linkedDriverId && tag.isActive}
              onClaim={claimCard}
              claiming={claimingId === tag.id}
            />
          ))}
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
