import { NextRequest, NextResponse } from 'next/server';
import { getAdminProxyHeaders } from '@lib/server/admin-proxy-headers';

const API = process.env.ZAPPO_API_URL ?? 'http://65.0.157.6:3001/api/v1';

export async function GET(req: NextRequest) {
  const qs = req.nextUrl.searchParams.toString();
  const res = await fetch(
    `${API}/accounting/reports/trial-balance${qs ? `?${qs}` : ''}`,
    {
      headers: await getAdminProxyHeaders(),
      cache: 'no-store',
    },
  );
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
