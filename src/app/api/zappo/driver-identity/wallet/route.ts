import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@lib/server/require-session';

const API = process.env.ZAPPO_API_URL ?? 'http://65.0.157.6:3001/api/v1';

export async function GET(req: NextRequest) {
  const unauthorized = await requireSession();
  if (unauthorized) return unauthorized;

  const driverToken = req.headers.get('x-driver-token');
  if (!driverToken) return NextResponse.json({ message: 'Missing driver token' }, { status: 401 });

  const res = await fetch(`${API}/driver/wallet`, {
    headers: { Authorization: `Bearer ${driverToken}` },
    cache: 'no-store',
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
