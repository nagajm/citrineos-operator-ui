// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@lib/client/components/ui/card';
import { Badge } from '@lib/client/components/ui/badge';
import { Skeleton } from '@lib/client/components/ui/skeleton';
import { KeyValueDisplay } from '@lib/client/components/key-value-display';
import { cardGridStyle, cardHeaderFlex } from '@lib/client/styles/card';
import { heading3Style } from '@lib/client/styles/page';
import { NOT_APPLICABLE } from '@lib/utils/consts';
import { User, Car } from 'lucide-react';

interface AuthorizationOwner {
  name: string | null;
  phone: string | null;
  driverId: string | null;
  linkType: 'driver' | 'vehicle';
  vehicleLabel?: string | null;
}

interface EnrichedAuthorization {
  id: number;
  idToken: string;
  idTokenType: string;
  owner: AuthorizationOwner | null;
}

export const AuthorizationOwnerCard = ({
  authorizationId,
}: {
  authorizationId: number | string;
}) => {
  const { data, isLoading } = useQuery<EnrichedAuthorization>({
    queryKey: ['voltstation', 'authorizations', authorizationId],
    queryFn: async () => {
      const res = await fetch(`/api/zappo/authorizations/${authorizationId}`);
      if (!res.ok) throw new Error('Failed to load owner info');
      return res.json();
    },
  });

  if (isLoading) {
    return <Skeleton className="h-24 w-full" />;
  }

  const owner = data?.owner ?? null;

  return (
    <Card>
      <CardHeader>
        <div className={cardHeaderFlex}>
          {owner?.linkType === 'vehicle' ? (
            <Car className="h-4 w-4 text-muted-foreground" />
          ) : (
            <User className="h-4 w-4 text-muted-foreground" />
          )}
          <h3 className={heading3Style}>Owner Details</h3>
          {owner ? (
            <Badge variant={owner.linkType === 'driver' ? 'success' : 'secondary'}>
              {owner.linkType === 'driver' ? 'Driver Account' : 'Vehicle'}
            </Badge>
          ) : (
            <Badge variant="muted">Unlinked</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {owner ? (
          <div className={cardGridStyle}>
            <KeyValueDisplay keyLabel="Name" value={owner.name} />
            <KeyValueDisplay keyLabel="Phone" value={owner.phone} />
            <KeyValueDisplay keyLabel="Driver ID" value={owner.driverId} />
            {owner.linkType === 'vehicle' && (
              <KeyValueDisplay
                keyLabel="Vehicle Label"
                value={owner.vehicleLabel ?? NOT_APPLICABLE}
              />
            )}
            <KeyValueDisplay
              keyLabel="Token Source"
              value={owner.linkType}
              valueRender={(v) => (
                <span className="capitalize text-muted-foreground text-sm">
                  {v === 'driver'
                    ? 'Registered via driver app'
                    : 'Auto-charge vehicle (idTag)'}
                </span>
              )}
            />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            This token is not linked to any driver account or registered vehicle.
            It may be a physical RFID card or a manually created entry.
          </p>
        )}
      </CardContent>
    </Card>
  );
};