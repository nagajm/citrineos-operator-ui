'use client';

import { useEffect, useState } from 'react';
import { Button } from '@lib/client/components/ui/button';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { Input } from '@lib/client/components/ui/input';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import { Save } from 'lucide-react';
import type { VsPlatformSettings } from '@lib/zappo/types';

export const PlatformSettingsPage = () => {
  const [settings, setSettings] = useState<VsPlatformSettings | null>(null);
  const [gstRatePercent, setGstRatePercent] = useState('');
  const [platformCommissionPercent, setPlatformCommissionPercent] = useState('');
  const [sellerGstin, setSellerGstin] = useState('');
  const [sellerLegalName, setSellerLegalName] = useState('');
  const [sellerAddress, setSellerAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/zappo/settings')
      .then((r) => r.json())
      .then((data: VsPlatformSettings) => {
        setSettings(data);
        setGstRatePercent(String(data.gstRatePercent));
        setPlatformCommissionPercent(String(data.platformCommissionPercent));
        setSellerGstin(data.sellerGstin ?? '');
        setSellerLegalName(data.sellerLegalName ?? '');
        setSellerAddress(data.sellerAddress ?? '');
      })
      .catch(() => setError('Failed to load settings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setError('');
    setSaved(false);
    const gst = parseFloat(gstRatePercent);
    const commission = parseFloat(platformCommissionPercent);
    if (Number.isNaN(gst) || gst < 0) { setError('GST rate must be a non-negative number'); return; }
    if (Number.isNaN(commission) || commission < 0) { setError('Commission % must be a non-negative number'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/zappo/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gstRatePercent: gst,
          platformCommissionPercent: commission,
          sellerGstin: sellerGstin || null,
          sellerLegalName: sellerLegalName || null,
          sellerAddress: sellerAddress || null,
        }),
      });
      if (res.ok) {
        setSettings(await res.json());
        setSaved(true);
      } else {
        setError('Failed to save settings');
      }
    } catch {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${pageMargin} flex flex-col gap-6 max-w-2xl`}>
      <h2 className={heading2Style}>Platform Settings</h2>

      {loading && <p className="text-muted-foreground">Loading…</p>}

      {!loading && (
        <Card>
          <CardHeader>
            <span className="font-semibold">Billing</span>
            <p className="text-sm text-muted-foreground">
              Applies to every new session going forward. Changing a rate never rewrites a
              session that was already billed — each bill freezes the rate in effect at the time.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">GST rate (%)</label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={gstRatePercent}
                onChange={(e) => setGstRatePercent(e.target.value)}
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">
                Added on top of the operator's set rate — the driver pays energy cost + GST.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Platform commission (%)</label>
              <Input
                type="number"
                min={0}
                step={0.01}
                value={platformCommissionPercent}
                onChange={(e) => setPlatformCommissionPercent(e.target.value)}
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">
                Calculated on the pre-GST energy charge only — GST is a pass-through tax, not
                revenue split with the station owner.
              </p>
            </div>

            <div className="border-t pt-4 mt-2 flex flex-col gap-4">
              <div>
                <span className="text-sm font-semibold">Invoice details</span>
                <p className="text-xs text-muted-foreground mt-1">
                  Optional — shown on the driver's bill once set. Leave blank until GST
                  registration is complete.
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Seller GSTIN</label>
                <Input
                  value={sellerGstin}
                  onChange={(e) => setSellerGstin(e.target.value)}
                  placeholder="e.g. 29AAAAA0000A1Z5"
                  className="max-w-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Seller legal name</label>
                <Input
                  value={sellerLegalName}
                  onChange={(e) => setSellerLegalName(e.target.value)}
                  className="max-w-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Seller address</label>
                <Input
                  value={sellerAddress}
                  onChange={(e) => setSellerAddress(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            {saved && !error && <p className="text-sm text-success">Settings saved.</p>}

            <div>
              <Button disabled={saving} onClick={save}>
                <Save className="size-4 mr-2" />
                {saving ? 'Saving…' : 'Save Settings'}
              </Button>
            </div>

            {settings && (
              <p className="text-xs text-muted-foreground">
                Last updated {new Date(settings.updatedAt).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
