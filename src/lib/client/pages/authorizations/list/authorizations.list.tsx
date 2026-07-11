// SPDX-FileCopyrightText: 2025 Contributors to the CitrineOS Project
//
// SPDX-License-Identifier: Apache-2.0
//
// DATA SOURCE: VoltStation API (ev-csms-api), NOT Hasura.
//
// WHY: The Authorizations table holds raw OCPP tokens.  To show who *owns* a token we need a
// JOIN across CitrineOS tables (Authorizations) and our own tables (drivers, driver_vehicles).
// That enrichment lives in ev-csms-api, which owns both sides of the data.  Hasura is used for
// pure CitrineOS OCPP data (Transactions, ChargingStations, …) — it has no concept of drivers.
//
// DO NOT revert this page to a Hasura gqlQuery — see CLAUDE.md "Operator UI Data Source
// Architecture" and the proxy route at /src/app/api/zappo/authorizations/route.ts.
'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MenuSection } from '@lib/client/components/main-menu/main.menu';
import { Badge } from '@lib/client/components/ui/badge';
import { Button } from '@lib/client/components/ui/button';
import { Loader } from '@lib/client/components/ui/loader';
import {
  Table as TableUi,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@lib/client/components/ui/table';
import { TableCellLink } from '@lib/client/components/table-cell-link';
import { TimestampDisplay } from '@lib/client/components/timestamp-display';
import { DebounceSearch } from '@lib/client/components/debounce-search';
import { CanAccess, useTranslate } from '@refinedev/core';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { heading2Style, pageMargin } from '@lib/client/styles/page';
import {
  tableHeaderRowStyle,
  tableHeaderTextStyle,
  tableHeaderWrapperFlex,
  tableSearchFlex,
  tableWrapperStyle,
} from '@lib/client/styles/table';
import { buttonIconSize } from '@lib/client/styles/icon';
import { ActionType, ResourceType } from '@lib/utils/access.types';
import { AccessDeniedFallback } from '@lib/utils/AccessDeniedFallback';
import { EMPTY_VALUE } from '@lib/utils/consts';

// ── Types ──────────────────────────────────────────────────────────────────────

interface AuthorizationOwner {
  name: string | null;
  phone: string | null;
  driverId: number | null;
  /** 'driver' = own auth token; 'vehicle' = car idTag linked to a driver; 'rfid_card' = a
   *  zappo_rfid_tags test/owner/customer card, claimed by this driver. */
  linkType: 'driver' | 'vehicle' | 'rfid_card';
  vehicleLabel?: string | null;
  cardLabel?: string | null;
}

interface EnrichedAuthorization {
  id: number;
  idToken: string;
  idTokenType: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  owner: AuthorizationOwner | null;
}

interface AuthorizationsPage {
  data: EnrichedAuthorization[];
  total: number;
  page: number;
  limit: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

function ownerCell(owner: AuthorizationOwner | null) {
  if (!owner) return <Badge variant="muted">Unlinked</Badge>;

  const label = owner.vehicleLabel
    ? ` · ${owner.vehicleLabel}`
    : owner.cardLabel
      ? ` · ${owner.cardLabel}`
      : '';
  const type = owner.linkType === 'vehicle' ? ' (vehicle)' : owner.linkType === 'rfid_card' ? ' (RFID card)' : '';

  return (
    <span>
      {owner.name ?? EMPTY_VALUE}
      {owner.phone ? ` · ${owner.phone}` : ''}
      {label}
      {type && <span className="text-muted-foreground text-xs ml-1">{type}</span>}
    </span>
  );
}

// ── Component ──────────────────────────────────────────────────────────────────

export const AuthorizationsList = () => {
  const { push } = useRouter();
  const translate = useTranslate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery<AuthorizationsPage>({
    queryKey: ['voltstation', 'authorizations', { search, page }],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (search) params.set('search', search);
      const res = await fetch(`/api/zappo/authorizations?${params}`);
      if (!res.ok) throw new Error('Failed to load authorizations');
      return res.json();
    },
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  const onSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <div className={`${pageMargin} ${tableWrapperStyle}`}>
      <div className={tableHeaderWrapperFlex}>
        <h2 className={heading2Style}>
          {translate('Authorizations.Authorizations')}
        </h2>
        <div className={tableSearchFlex}>
          <CanAccess resource={ResourceType.AUTHORIZATIONS} action={ActionType.CREATE}>
            <Button
              variant="success"
              onClick={() => push(`/${MenuSection.AUTHORIZATIONS}/new`)}
            >
              <Plus className={buttonIconSize} />
              {translate('buttons.add')} {translate('Authorizations.authorization')}
            </Button>
          </CanAccess>
          <CanAccess resource={ResourceType.AUTHORIZATIONS} action={ActionType.LIST}>
            <DebounceSearch
              onSearch={onSearch}
              placeholder={`${translate('placeholders.search')} ${translate('Authorizations.authorization')}`}
            />
          </CanAccess>
        </div>
      </div>

      <CanAccess
        resource={ResourceType.AUTHORIZATIONS}
        action={ActionType.LIST}
        fallback={<AccessDeniedFallback />}
      >
        <div className="space-y-4">
          <TableUi>
            <TableHeader className={tableHeaderRowStyle}>
              <TableRow>
                <TableHead>
                  <div className={tableHeaderTextStyle}>Authorization ID</div>
                </TableHead>
                <TableHead>
                  <div className={tableHeaderTextStyle}>Type</div>
                </TableHead>
                <TableHead>
                  <div className={tableHeaderTextStyle}>Status</div>
                </TableHead>
                <TableHead>
                  <div className={tableHeaderTextStyle}>Owner</div>
                </TableHead>
                <TableHead>
                  <div className={tableHeaderTextStyle}>Updated At</div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <Loader className="h-4 text-primary" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-destructive">
                    Failed to load authorizations. Please try again.
                  </TableCell>
                </TableRow>
              ) : !data?.data.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    {translate('table.noResultsFound', undefined, 'No results found')}.
                  </TableCell>
                </TableRow>
              ) : (
                data.data.map((auth) => (
                  <TableRow key={auth.id}>
                    <TableCell className="text-nowrap">
                      <TableCellLink
                        path={`/${MenuSection.AUTHORIZATIONS}/${auth.id}`}
                        value={auth.idToken?.trim() ?? 'No ID'}
                      />
                    </TableCell>
                    <TableCell className="text-nowrap">
                      <Badge>{auth.idTokenType}</Badge>
                    </TableCell>
                    <TableCell className="text-nowrap">
                      <Badge>{auth.status}</Badge>
                    </TableCell>
                    <TableCell className="text-nowrap">
                      {ownerCell(auth.owner)}
                    </TableCell>
                    <TableCell className="text-nowrap">
                      {auth.updatedAt ? (
                        <TimestampDisplay isoTimestamp={auth.updatedAt} />
                      ) : (
                        <span>{EMPTY_VALUE}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </TableUi>

          <div className="flex items-center justify-between py-2 text-sm text-muted-foreground">
            <span>{data ? `${data.total} total` : ''}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span>
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </CanAccess>
    </div>
  );
};