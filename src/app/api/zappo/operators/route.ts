import { NextRequest, NextResponse } from 'next/server';
import { getAdminProxyHeaders } from '@lib/server/admin-proxy-headers';

const API = process.env.ZAPPO_API_URL ?? 'http://65.0.157.6:3001/api/v1';

export async function GET() {
  const res = await fetch(`${API}/admin/operators`, { headers: await getAdminProxyHeaders(), cache: 'no-store' });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${API}/admin/operators`, {
    method: 'POST',
    headers: await getAdminProxyHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
