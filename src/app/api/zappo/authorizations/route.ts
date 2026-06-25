// VoltStation proxy — authorizations list with enriched owner data.
//
// WHY this exists instead of querying Hasura directly:
//   The Authorizations table stores raw OCPP tokens.  Hasura can expose the table but has no
//   knowledge of our application-level concepts (drivers, vehicles).  To show *who owns* a token
//   we need a JOIN across CitrineOS-managed tables (Authorizations) and our own tables (drivers,
//   driver_vehicles).  That join lives in ev-csms-api, which owns both sides of the data.
//
// ARCHITECTURE RULE (do not revert to Hasura for this resource):
//   Hasura → CitrineOS OCPP protocol data only (Transactions, ChargingStations, Locations, …)
//   ev-csms-api → enriched / business data that crosses the CitrineOS / VoltStation boundary
//   See CLAUDE.md "Operator UI Data Source Architecture" for the full decision record.

import { type NextRequest, NextResponse } from 'next/server';

const API = process.env.ZAPPO_API_URL ?? 'http://65.0.157.6:3001/api/v1';
const KEY = process.env.ZAPPO_ADMIN_API_KEY ?? '';

const headers = () => ({ 'Content-Type': 'application/json', 'x-admin-key': KEY });

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const qs = searchParams.toString(); // forward search, page, limit as-is
  const res = await fetch(`${API}/admin/authorizations${qs ? `?${qs}` : ''}`, {
    headers: headers(),
    cache: 'no-store',
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}